# Perpl Arena — backend

Express + TypeScript backend for **Perpl Arena**: follow proven Perpl
perp traders, copy their trades within your own risk limits, and compete
in risk-adjusted tournaments. Thin mobile client, backend trading brain,
Supabase Postgres as the source of truth, Supabase Realtime for live UI
updates. No Redis in v1.

Built against the Perpl API documented at
https://docs.perpl.xyz/resources/for-developers/api/typescript
(Ed25519 API keys, signed REST, market-data + trading WebSockets,
scaled-integer prices/sizes, builder codes).

## Processes

| Process | Entry | Does |
| ------- | ----- | ---- |
| API | `pnpm dev` → `src/index.ts` | Mobile REST API (auth, markets, accounts, leaders, copy, tournaments, dashboard) |
| Worker | `pnpm dev:worker` → `src/worker.ts` | Perpl market-data WS, per-key trading sessions, copy engine, leader stats, tournament scoring |

```
Mobile app ⇄ REST API ⇄ Postgres (+ Realtime → app)
                 ▲
                 │ reads settings / writes events
Perpl worker ────┘
   ├── market-data WS (prices, head block)
   ├── trading WS per enrolled key (positions, fills, orders)
   └── copy / risk / tournament engines
```

## Setup

1. **Supabase project.** Create a project, then apply the schema:
   ```bash
   export SUPABASE_DB_URL='postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres'
   pnpm db:push
   ```
2. **Environment.** Copy `.env.example` to `.env` and fill in:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `KEY_ENCRYPTION_KEY` — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Perpl network: testnet defaults are pre-filled; swap the four
     `PERPL_*` values for mainnet (`app.perpl.xyz`, chain `143`).
   - `PERPL_BUILDER_ID` — issued by Perpl out of band; `0` disables fees.
   - `APP_ORIGIN` — must be whitelisted by Perpl for key enrollment.
3. **Install & run.**
   ```bash
   pnpm install
   pnpm dev          # API on :8080
   pnpm dev:worker   # trading brain (separate shell)
   ```

## Key enrollment (mobile flow)

1. App generates an Ed25519 key pair locally.
2. `POST /accounts/enroll/payload` → EIP-712 `typedData` + `mac`
   (server injects `builder_id` + `max_builder_fee_per_100k` so the
   user signs the fee ceiling in their wallet prompt).
3. User signs with their wallet; app also produces the
   Ed25519 proof-of-possession signature.
4. `POST /accounts/enroll` → Perpl enrolls the key, server stores
   the token + private key **AES-256-GCM encrypted** and returns a
   non-secret summary. (Or `POST /accounts/import` for keys made in
   the Perpl web UI.)

**Local alternative:** `scripts/enroll-testnet.sh` enrolls a key
directly against Perpl testnet from your own machine (useful where
the backend host is geo-blocked from the enrollment endpoint with
HTTP 451). It prints an import command for `/accounts/import` at
the end. Testnet wallets only.

## Copy engine

Risk translation, not mirroring — `src/engine/risk.ts` is pure and
unit-tested (`pnpm test:smoke`):

```
fraction       = leaderNotional / leaderEquity
targetNotional = allocation × fraction
targetNotional = min(targetNotional, allocation × leverage, maxPerTrade)
leverage       = min(implied, maxLeverage)
```

Guardrails: market allow/blacklists, per-trade + exposure caps,
daily loss limit (realized + unrealized), 7-day drawdown cutoff,
per-position stop-loss, anti-frontrun copy delay, IOC market orders
with slippage cap, reduce-only mode, one-tap kill switch
(`POST /copy/kill-switch`, consumed by the worker in ~1s).

Fills correlate back to `copy_orders` via the Perpl `rq`
idempotency key; stale `submitted` rows are finalized by the
reconciler from REST order-history. Builder fees (`bf`) go only on
opening/increasing orders, capped by each key's signed ceiling;
`bfa` on fills is the builder portion of the gross fee (never added).

Known v1 limitation: a follower position on a market is attributed
to the first active copy setting whose leader holds that market —
single-leader-per-market is the supported shape.

## Tournaments

Weekly risk-adjusted contests. `Score = NetPnL / (1 + MaxDrawdown)`
rewards profit without blowups. `TournamentEngine` scores active
tournaments from entrants' equity curves, writes ranks to
`tournament_entries` + `leaderboard_snapshots` (Realtime-enabled),
and settles on wall clock with winner notifications.

## API reference

Auth: `Authorization: Bearer <supabase access token>`, 60 req/min
per user. Errors: `{ error: { code, message } }`.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/health` | liveness, DB + market-context status (public) |
| GET | `/markets` | cached configs + live prices (public) |
| GET | `/markets/:id/candles?resolution=&hours=` | OHLCV, human units (public) |
| POST | `/accounts/enroll/payload` | EIP-712 enrollment payload (+ builder terms) |
| POST | `/accounts/enroll` | complete enrollment, store encrypted key |
| POST | `/accounts/import` | store an existing enrolled key pair |
| GET/DELETE | `/accounts`, `/accounts/:id` | list / revoke (revoke also pauses copying) |
| GET | `/leaders?...` | filter by winRate, drawdown, Sharpe, style; sort by PnL/followers |
| GET | `/leaders/follows` | leaders the caller follows + copy status |
| GET | `/leaders/:id` | profile, live positions, 50 recent fills |
| PUT | `/leaders/me` | publish/update own leader profile |
| POST/DELETE | `/leaders/:id/follow` | follow / unfollow |
| PUT/GET/DELETE | `/copy/:leaderId`, `/copy` | risk-limited copy settings |
| POST | `/copy/kill-switch` | close all copied positions, pause copying |
| GET | `/copy/orders`, `/copy/risk-events` | audit trail, guardrail history |
| GET | `/tournaments`, `/tournaments/:id` | list, detail + standings |
| GET | `/tournaments/me/entries` | caller's entries |
| POST | `/tournaments/:id/join` | enter (requires enrolled key) |
| GET | `/dashboard` | equity, positions, active copies, today's PnL, notifications |
| POST | `/dashboard/notifications/read` | mark read |

Mobile realtime: subscribe with the Supabase client to
`postgres_changes` on `positions`, `copy_orders`, `notifications`,
`leaderboard_snapshots`, `price_cache`, `risk_events`.

## Testing

- `pnpm typecheck` — strict `tsc`, must be clean.
- `pnpm test:smoke` — 16 checks: scaling math, risk translation,
  stop-loss, drawdown, tournament score, encrypt round-trip, app
  boot, auth gating. No DB or network needed.
- `pnpm test:integration` — tournament scoring + leader stats
  against a real Postgres (schema validated on Postgres 16:
  constraints, case-insensitive enroll upsert, realtime tables).
- `pnpm test:lifecycle` — fill accumulation (partial → filled, no
  double-count on duplicates), reconciler behavior, and a DRY_RUN
  copy cycle against local Postgres + live testnet context.
- `pnpm test:e2e` — 20 checks against the running API + live
  Supabase (creates and deletes its own auth users).
- `pnpm build` / `pnpm start`, `pnpm start:worker` for production.

Set `DRY_RUN=true` on the worker to simulate copying without
submitting orders; simulated rows are flagged `dry_run` and the
reconciler skips them.

## Troubleshooting

- **DB host resolves to IPv6 only.** If `SUPABASE_DB_URL` uses
  `db.<ref>.supabase.co` and your host has no IPv6 route, direct
  Postgres connections fail with `ENOTFOUND`. Switch to the
  Supavisor pooler URL from the Supabase dashboard (Settings →
  Database → Connection pooling, port `6543`, user
  `postgres.<ref>`). The API and worker both degrade gracefully
  without a DB (health reports `db:false`, public market routes
  that don't need Postgres keep working), but enrollment,
  copying, and tournaments need it.
- **Market-data socket closed with 1008 ~10s after connect.**
  The server closes connections that never subscribe. The client
  (re)subscribes the full set on every `onopen` — a delta-only
  resubscribe after reconnect silently drops the subscription
  and reproduces this cycle.
- **Wire shape vs docs.** `GET /v1/pub/context` nests scaling and
  margin fields under `market.config` (`price_decimals`,
  `size_decimals`, `initial_margin`) with `order_ttl_blocks`
  top-level. `MarketRegistry` normalizes this into the flat
  internal shape; always read `initial_margin` (testnet BTC is
  1500 = ~6.6x max, not 10x) and `order_ttl_blocks` (testnet BTC
  is 20) live.
- **Port 8080 shadowed.** On Replit, something answers on 8080
  before your server (HTML proxy 404s). Run on another port
  (`PORT=8099 pnpm dev`) — the JSON 404 envelope distinguishes
  your server from the proxy.
