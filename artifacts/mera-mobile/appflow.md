# Perpl Arena — App Flow (mera-mobile → perpl-arena → Perpl)

Maps every mobile screen from onboarding to trading, reusing what
already exists in `mera-mobile`, to the `perpl-arena` backend API,
Supabase Realtime, and the Perpl API underneath. Gaps where the
backend or app does not yet support a screen are marked **[GAP]**.

## 0. Architecture in one diagram

```
mera-mobile (Expo, existing + new screens)
  │  Supabase Auth JWT on every call
  ▼
perpl-arena API  ── Postgres (users, follows, copy_settings,
  │                 copy_orders, positions, tournaments, …)
  │  Supabase Realtime ──► app (live positions, fills, rankings)
  ▼
perpl-arene worker (trading brain, server-side only)
  ├── market-data WS  → price_cache / market_cache
  └── trading WS per enrolled key → positions, fills, equity
  ▼
Perpl testnet (chain 10143, Monad EVM)
```

Golden rules: secrets and strategy logic never live in the app beyond
the current session; the worker is the only Perpl trader; the app is a
signed-in viewer plus risk-limit forms.

## 1. Identity model (three linked identities)

| # | Identity | Where it lives | Used for |
|---|----------|----------------|----------|
| 1 | Supabase user (**anonymous** by default) | `supabase.auth.signInAnonymously()`; JWT in app memory | All backend calls (`requireAuth`) |
| 2 | mera passkey wallet (secp256k1, PRF-derived) | `src/wallet.ts`, SecureStore (`src/storage.ts`) | EIP-712 enrollment signature, `createAccount` tx, withdrawals, wallet-link signature |
| 3 | Perpl Ed25519 API key (scope 3) | Generated per enrollment; **encrypted server-side** (`perpl_accounts`) | Worker's trading WS + signed REST |

Anonymous sign-in is the whole visible-auth story: the user only ever
sees the mera passkey ceremony. The anon JWT is transport-only and
carries the `authenticated` role, so every RLS policy and guardrail
behaves identically; `updateUser`/link-identity later converts anon →
permanent for multi-device and recovery. After mera unlock, the app
binds wallet ↔ user once: `GET /users/link-challenge` →
wallet EIP-191-signs `Perpl Arena wallet link\nuser: …\naddress:
…\nnonce: …\nexpiry: …` via the mera session →
`POST /users/link-wallet` (ecrecover-verified, challenge consumed,
one wallet per user). `GET /users/me` shows the binding.

Key insight: Monad is EVM-compatible, so the mera-derived EVM
address **is** the Perpl wallet address. No second wallet. The mera
`Wallet.session` (`Secp256k1SigningSession`) signs the enrollment
`typed_data` and the on-chain `createAccount`, exactly as
`TradingScreen.submit()` signs demo trades today.

Onboarding order: **Supabase (silent, anonymous) first, passkey
second, wallet link third, Perpl fourth.** Every backend call needs
the JWT, so backend identity gates; the passkey unlocks the wallet;
the link binds them; the Perpl key connects trading.

## 2. Screen flow

### S0 — Splash / router (new)
Reads, in order: Supabase session → mera `loadStoredAccount()`
(`none` | `locked` | `unlocked`, `src/account.ts`) → 
`GET /accounts` (any `active` key?). Routes to S1/S2/S3/S5.
Reuse the locked-state pattern: render from address metadata with no
biometric prompt until a signature is actually needed.

### S1 — Onboarding with mera (reuse as-is)
`createAccount()` / `signIn()` from `src/wallet.ts`; biometric-gated
`unlockStoredWallet()`; `RecoveryPhrase` export unchanged. No backend
calls. The wallet address shown in `AccountChip` becomes the address
the user funds on Perpl.

### S2 — Supabase sign-in (one silent call, no UI)
`supabase.auth.signInAnonymously()` on first launch; the session
persists via the SDK. No email/OTP screen — the user perceives
"sign in with mera only" because the passkey (S1) is the sole
visible ceremony. After unlock, bind the wallet (S2b) then continue.
`PUT` the `public.users` row (handle). Sign-out clears Supabase
session **and** ends the mera session (`replaceAccount` in `App.tsx`).

### S2b — Wallet link (background, once per wallet)
`GET /users/link-challenge` → sign the exact message above with the
mera session → `POST /users/link-wallet`. Errors: `bad_challenge`
(refetch), `address_mismatch` (wrong wallet), `409` wallet taken.
Re-linking with a fresh signature rotates the binding.

### S3 — Connect Perpl (new, 3 steps)
1. `POST /accounts/enroll/payload` → returns EIP-712 `typed_data` +
   `mac` (server injects `builder_id` + fee ceiling when registered).
2. Wallet signs via mera session → `POST /accounts/enroll`
   (or `POST /accounts/import` for a key made at
   `testnet.perpl.xyz/apikeys`).
3. Handle `404` = wallet has no on-chain account → route to S4.
   Handle `409`/`423` per docs. `GET /accounts` lists keys;
   `DELETE /accounts/:id` revokes (also pauses copying).

### S4 — Fund & aUSD balance (new)
- Faucet (testnet UI/webview) → deposit **≥ 100 aUSD** → on-chain
  `createAccount` creates the profile (enrollment prerequisite).
- Balance card: wallet `balance` + `locked` (worker mirrors from
  `WalletSnapshot`; expose via dashboard equity block).
- Withdrawals are **never** via API key — must be a wallet-signed
  contract call from the mera session. Keep this a distinct,
  scary-confirm screen.

### S5 — Dashboard / Home (new, one call)
`GET /dashboard` returns `{ equity, equityAt, positions[] (with
live mark/last), activeCopySettings[], realizedPnlToday,
unreadNotifications[] }`. Subscribe Realtime to `positions`,
`copy_orders`, `notifications`, `risk_events`. Reuse `Holdings`,
`PriceChart`, `AccountChip` patterns from mera. Kill-switch button
lives here: `POST /copy/kill-switch` behind a confirm sheet.

### S6 — Markets list (new)
`GET /markets` → cached configs + live `price_cache` (symbol,
decimals, margins, oracle/mark/last/bid/ask, 24h-ago, volume, OI).
Subscribe Realtime `price_cache` for ticks. Testnet IDs (never
hard-code; resolve from this endpoint): BTC 16, ETH 32, SOL 48,
MON 64, ZEC 256 (+ LIT 272, PUMP 320, NEAR 336 observed live).

### S7 — Pair detail (new, per market)
Header/quote + chart + stats + open-position card.
- Chart: `GET /markets/:id/candles?resolution=&hours=` (human units;
  reuse mera `PriceChart` SVG pattern; resolutions 60–86400).
- Stats: funding/OI/volume from the S6 row.
- CTA row: **Copy this market's top trader** → S11 pre-filtered.

### S8 — Trade ticket (intent queue, worker executes)
`POST /trading/orders` with `{ marketId, side: long|short|close|
cancel, size (human units), price? (omit = market IOC, present =
limit GTC), leverage (default 1, capped at the market max from
`initial_margin`), slippageBps, perplOrderId? (cancel), idempotencyKey*
(required — replays return the original row), dryRun? }`. Requires a
trade-scoped key. Validates market, minimum size, leverage, and (for
closes) a mirrored position; responds **202** with the pending
`manual_orders` row. The worker consumes intents ~1s (atomic claim,
single execution even multi-worker), submits through the account's
trading session with the same lifecycle as copies (`pending →
submitted → open → partial → filled`, `manual_fill` notifications),
and the reconciler heals missed states. `GET /trading/manual` is the
audit list; subscribe Realtime `manual_orders`. `dryRun: true`
simulates end-to-end without submitting — the safe way to test the
ticket from any region.

### S9 — Trades (own fills + history)
- Copy fills: `GET /copy/orders` (lifecycle
  `submitted → open → partial → filled`, `filled_size_scaled`,
  `dry_run` flag) + `GET /copy/risk-events`.
- Manual fills: `GET /trading/manual` (same lifecycle) +
  `manual_fill` notifications.
- Full account history (read scope, cursor pagination, Perpl
  passthrough): `GET /trading/fills`, `/trading/orders/history`,
  `/trading/positions/history`, `/trading/account-history`
  (`?count=&page=` passthrough, optional `?account=` to pin a key).

### S10 — Discover / leaderboard (new)
`GET /leaders?sort=pnl|pnl24h|winRate|sharpe|followers&order=&
minWinRate=&maxDrawdown=&minSharpe=&style=&limit=` (filter chips =
these params; timeframe is display-only — stats are precomputed
30d/24h). Row → S11.

### S11 — Trader profile → follow → copy (new)
`GET /leaders/:id` → profile + live positions + 50 recent fills.
`POST /leaders/:id/follow` (self-follow 400s) →
copy form → `PUT /copy/:leaderId` with
`allocationUsd*`, `maxLeverage`, `maxNotionalPerTradeUsd`,
`dailyLossLimitUsd`, `weeklyDrawdownLimitBps`, allow/blacklists,
`slippageBps`, `copyDelayMs`, `reduceOnly`, `stopLossBps`.
Requires a trade-scoped key (`no_trade_key` → route S3).
Show the translation preview: target ≈ allocation ×
leader_fraction (documented formula, not a black box).

### S12 — Copy management (new)
`GET /copy` (settings + handles), per-copy `DELETE /copy/:leaderId`
(stop, keeps history), audit + risk-event lists, kill switch.
Status chips map 1:1 to the `copy_orders.status` lifecycle.

### S13 — Tournaments (new)
`GET /tournaments?status=`, `GET /tournaments/:id` (detail +
`standings` by risk-adjusted score), `POST /tournaments/:id/join`
(requires enrolled key: `no_account` → S3), `GET /tournaments/me/entries`.
Subscribe Realtime `leaderboard_snapshots` for live ranks.

### S14 — Account / settings (extend mera links row)
Reuse mera Lock / Export / Sign out. Add: `GET /accounts`
(key list + `connected_at`), revoke, `PUT /leaders/me`
(publish/update own trader profile: `isPublic`, `styles`, `bio`),
`POST /dashboard/notifications/read`.

## 3. Realtime subscription map

| Table (`postgres_changes`) | Screens |
|---|---|
| `price_cache` | S5, S6, S7 |
| `positions` | S5, S7 position card, S11 (leader's) |
| `copy_orders` | S5 activity, S12 audit, S9 (copy fills) |
| `manual_orders` | S8 ticket status, S9 (manual fills) |
| `notifications` | S5 badge, S12 |
| `risk_events` | S12, S5 banner (pauses, kill switch) |
| `leaderboard_snapshots` | S10 live ranks, S13 standings |

## 4. Perpl → backend → screen traceability

| Perpl concept | Backend | Screen |
|---|---|---|
| `GET /v1/pub/context` (markets, decimals, margins) | `market_cache`, `MarketRegistry` | S6, S7, S11 preview math |
| market-data WS `mt:9` state | `price_cache` | S5, S6, S7 ticks |
| `GET /v1/market-data/:id/candles` | passthrough rescale | S7 chart |
| trading WS snapshots/updates per key | `positions`, `equity_snapshots`, `leader_fills` | S5, S11, S13 scoring |
| `mt:22` orders (copy engine + manual intents) | `copy_orders` / `manual_orders` lifecycle | S12, S8, S9 |
| fills `bfa` (builder fee share) | `copy_orders` / events | S12 receipt rows |
| `createAccount` / withdrawals | wallet-signed, never API key | S4 |
| API-key enroll payload/enroll | `/accounts/*` | S3 |

## 5. Reusable mera pieces (do not rebuild)

`theme.ts` + `Button`/`LinkButton`, `AccountChip` (address +
network dot), `PriceChart` (SVG pattern for S7), `Holdings`
(rows for S5/S11), `TradeForm` (shape for S8/S11 amount entry),
`useCopyButton`, `describeError` taxonomy (extend with backend
`code`s: `no_trade_key`, `no_account`, `not_following`,
`unauthorized`), locked-state rendering, app-switcher phrase
drop (`RecoveryPhrase`).

## 6. Navigation proposal

Tabs: **Home** (S5) · **Markets** (S6) · **Traders** (S10) ·
**Contests** (S13) · **Account** (S14). Stack pushes: S7, S8, S9,
S11, S12, S3/S4 modals over first launch. Onboarding stack
(S1→S2→S3→S4) replaces the current single-`TradingScreen` root
once all three identities exist.
