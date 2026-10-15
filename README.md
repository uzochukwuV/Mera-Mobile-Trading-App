# Pera — Mobile Trading on Monad

A mobile-first trading venue on **Monad Testnet**: an Expo app
(`artifacts/mera-mobile`) powered by a live trading backend
(`artifacts/perpl-arena`). Users authenticate with a **Mera passkey**,
hold **AUSD**, and execute trades through **Perpl** — plus copy-trading,
tournaments, and realtime portfolio updates.

## How it works on Monad

All chain interaction targets Monad Testnet (chain ID 10143):

- **Identity:** a Mera passkey ceremony derives the user's EVM wallet.
  The PRF output is kept in the device SecureStore; nothing custodial
  ever touches the backend.
- **Money:** AUSD is an ERC-20-style collateral token. The app reads the
  on-chain `balanceOf` directly via `viem`, and the worker mirrors
  balance/locked/equity per user so Home renders instantly.
- **Trading:** trade tickets become signed intents queued in Postgres;
  the worker submits them to Perpl and reconciles fills, positions, and
  equity curves. Sub-second finality is what makes the ticket → fill →
  portfolio loop feel instant.
- **Copy-trading:** leaders are ranked from onchain-verified equity
  curves; followers allocate AUSD per leader and the engine mirrors
  leader orders with per-trade caps, slippage guards, and a kill switch.

## Built with Mera

- `@category-labs/mera` (`lib/mera`) — passkey creation/assertion with
  PRF outputs, secp256k1 + ed25519 signing sessions, secret-vault
  encryption (HKDF + AES-GCM).
- `@category-labs/mera-demo-shared` (`lib/mera-demo-shared`) — Monad
  network context and HD derivation (`prfOutputToMnemonic`,
  `mnemonicToSeed`, `deriveEvmPrivateKey`), so the same passkey yields
  the same address on mobile and web.
- `toViemAccount` bridges Mera sessions into `viem` for contract calls
  (order-forwarding flag, AUSD reads).
- On Android, Hermes lacks `crypto.subtle`, so the app uses only
  `getRandomValues` (polyfilled from `expo-crypto` in
  `src/polyfills.ts`); vault crypto stays pure-JS noble.

## The two pieces

**`artifacts/mera-mobile`** — Expo (React Native) app: onboarding,
passkey wallet, dashboard, markets, trade tickets, trades feed,
discover/copy, contests, account. Config lives in `app.json`
(`extra.rpId`, `extra.perplApiUrl`, Supabase keys) with Android
`assetlinks.json` / iOS association files under `well-known/`.

**`artifacts/perpl-arena`** — Express REST API (`src/index.ts`, :8080)
plus the trading brain (`src/worker.ts`): market-data ingestion, copy
engine, tournament scoring, equity snapshots, notifications. Both must
run against the same Postgres/Supabase, or positions and copy data stay
empty while public markets still load.

```bash
pnpm install --frozen-lockfile
pnpm --filter "@category-labs/*" run build   # libs first: Metro needs dist/
pnpm --filter @workspace/perpl-arena run dev         # API
pnpm --filter @workspace/perpl-arena run dev:worker  # worker (same DB)
pnpm --filter @workspace/mera-mobile run dev         # Expo
```

`pnpm run typecheck` checks everything. The `Build Android APK`
GitHub workflow produces a release APK and logs the SHA-256 signing
fingerprint needed for `assetlinks.json`.

## Roadmap

See `Upgrade.md`: TWAP/grid execution in the worker, risk-conditioned
copy guards, and staked tournament entries.
