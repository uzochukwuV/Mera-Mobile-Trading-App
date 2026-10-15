# Perpl Arena backend — what still needs doing

Companion to `appflow.md` (the plan) — this file tracks the delta between
what the API/worker already do and what the mobile app needs next. Verified
working live: `GET /markets`, `GET /markets/:id/candles`, auth middleware,
wallet-link flow, enroll proxy structure, manual-intent queue.

Base URL (deployed): `https://01a13ff4-99a1-7e33-97a5-4327175bff36-8080.eur-1.aiven.app`

## Landed (2026-10-13 API update — app wired)

- [x] **Enroll error mapping**: `POST /accounts/enroll` now preserves
  `404 no_account` (→ Fund), `409 key_taken` (→ fresh keypair, retry once),
  `423 key_limit` (→ revoke-a-key message). The app handles all three.
  Note: `POST /accounts/enroll/payload` upstream errors remain
  `502 enrollment_failed`.
- [x] **Dashboard wallet fields**: `GET /dashboard` returns `balance`,
  `locked`, `walletAt` (null until the worker stores a snapshot). The app
  prefers them, falling back to on-chain `balanceOf` and position notional.
- [x] **`PUT /users/me`** handle update — wired to Account → Edit profile
  (taken handles surface `409 conflict` inline).
- [x] **`GET /meta/account-creation`** — Fund screen reads min deposit and
  collateral identity from it instead of hardcoding.
- [x] **CORS** allows all origins (dev-permissive, by design for now).
- [x] **Realtime schema**: publication entries, `authenticated` read
  policies, `REPLICA IDENTITY FULL` on positions/copy_orders/manual_orders,
  wallet mirror columns. Must be applied to the deployed database; the app
  has no subscriptions yet.
- [x] **Ops documented**: `APP_ORIGIN` whitelist, run API + worker together,
  `DRY_RUN=true` worker flag for simulated copies.

## 1. Blockers (app cannot proceed without these)

### 1.1 ~~Map Perpl enroll failures to distinct codes~~ — landed, see top.
### 1.2 ~~Expose wallet balance + locked on the dashboard~~ — landed, see top.
### 1.3 Supabase project settings
- **Enable anonymous sign-ins** (Auth → Sign In → Anonymous). Without it,
  `POST /auth/v1/signup {}` 422s and the entire app is offline.
- The anon JWT carries the `authenticated` role: confirm RLS policies on
  user-scoped tables permit it wherever the app will subscribe/read
  directly (matters for §3 Realtime; the API tier uses the pool and
  bypasses RLS).

## 2. Needed before the next frontend milestones

### 2.1 ~~CORS middleware~~ — landed (permissive `*`, dev only).
### 2.2 ~~`APP_ORIGIN` must be the Perpl-whitelisted origin~~ — documented in
the API update; still verify the deployed value is whitelisted.
### 2.3 ~~Fund-screen metadata endpoint~~ — landed (`GET /meta/account-creation`).
### 2.4 ~~Handle update endpoint~~ — landed (`PUT /users/me`).

## 3. Realtime prerequisites (before any live-tick UI) — schema landed,
must still be applied to the deployed database + anon sign-in enabled.

The app will subscribe via Supabase Realtime `postgres_changes` to:
`price_cache`, `positions`, `copy_orders`, `manual_orders`,
`notifications`, `risk_events`, `leaderboard_snapshots`.
Requires, in this order:
1. Tables added to the `supabase_realtime` publication.
2. RLS `SELECT` policies letting the `authenticated` role read own rows
   (`user_id = auth.uid()` or equivalent) on each table.
3. A replica-identity/full row config sufficient for UPDATE/DELETE payloads
   where the UI needs them (`positions`, `copy_orders`, `manual_orders`).

## 4. Ops — keep the worker running

The API alone is a hollow shell: markets/candles/prices go stale without
the market-data WS, and equity/positions/copy/fills never materialize
without trading-WS sessions, the copy engine, and the manual-intent
consumer + reconciler. Always run `start:worker` next to `start` against
the same database. If `/dashboard.equity` stays null for a linked +
enrolled user, the worker (not the app) is the first suspect.

## 5. Known accepted limitations (no action)

- `DELETE /accounts/:id` revokes locally only; the key must also be
  revoked at testnet.perpl.xyz/apikeys (documented in code; surfaced in
  app copy).
- Withdrawals are wallet-signed contract calls, never API-key — there is
  deliberately no backend endpoint for them.
- A revoked Ed25519 public key can never be re-enrolled (Perpl rule) —
  the app generates a fresh keypair per attempt.
- Rate limit: 60 req/min per user (middleware). Realtime ticks don't
  count against it; REST polling loops should stay well under it.
