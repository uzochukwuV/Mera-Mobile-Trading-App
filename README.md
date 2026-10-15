# Mera Mobile Trading App

Mobile-first trading on Monad Testnet: an Expo app that authenticates via
Mera passkeys, shows an AUSD stablecoin balance, and executes trades through
Perpl — with copy-trading, tournaments, and a live worker-driven backend.

Built for the Monad Onchain Finance & Trading track
(Agora "Best Mobile Trading App" bounty).

## Where things live

| Path | What |
| ---- | ---- |
| `artifacts/mera-mobile` | Expo (React Native) trading app — start here for the product |
| `artifacts/perpl-arena` | Trading backend: Express REST API + worker (copy engine, tournaments, realtime) |
| `lib/mera` | Passkey/HD-wallet library (`@category-labs/mera`) |
| `lib/mera-demo-shared` | Shared network + HD derivation helpers |
| `artifacts/api-server`, `lib/db`, `lib/api-*` | Workspace scaffolding (spec, codegen, DB) |
| `Upgrade.md` | Originality roadmap (TWAP execution, copy guards, staked arenas) |

## Run it

```bash
pnpm install --frozen-lockfile
pnpm --filter "@category-labs/*" run build   # libs must be built before bundling
```

Backend (needs `artifacts/perpl-arena/.env` — Supabase + Perpl config):

```bash
pnpm --filter @workspace/perpl-arena run dev         # API on :8080
pnpm --filter @workspace/perpl-arena run dev:worker  # trading brain (same DB)
```

Mobile (Expo dev server):

```bash
pnpm --filter @workspace/mera-mobile run dev
```

Typecheck everything: `pnpm run typecheck`. Android APK: GitHub Actions
workflow `Build Android APK` (prebuild → `assembleRelease`, logs the
SHA-256 cert fingerprint for the passkey `assetlinks.json`).

## Configuration that matters

- RP ID / package ID: set in `artifacts/mera-mobile/app.json`
  (`extra.rpId`, `android.package`, `ios.bundleIdentifier`) with matching
  `well-known/assetlinks.json` + `apple-app-site-association` served at
  `https://<rpId>/.well-known/`.
- API URL + Supabase anon config: `app.json` → `extra.perplApiUrl`,
  `extra.supabaseUrl`, `extra.supabaseAnonKey`.
- Always run the API **and** the worker against the same database, or
  dashboard/positions/copy data stays empty while markets still load.

## Gotchas

- `app.json` changes need a fresh bundle (fast refresh won't pick them up).
- Browser (web) API calls require the backend's CORS headers plus the
  `ngrok-skip-browser-warning` header the app sends; native is unaffected.
- Android Hermes has no `crypto.subtle` — the app only uses
  `getRandomValues` (polyfilled from `expo-crypto` in `src/polyfills.ts`).
