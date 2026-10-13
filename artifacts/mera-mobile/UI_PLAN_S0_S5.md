# UI-first plan — Perpl Arena (onboarding → dashboard, S0–S5)

This plan is **UI-only**. It does not change wallet, storage, Supabase,
or trading logic. Logic already written in `src/wallet.ts`, `src/account.ts`,
`src/storage.ts`, and `src/TradingScreen.tsx` is treated as fixed contracts
and only wrapped/presented. Each step below only adds or restyles components.

## 0. Goals & non-goals

**Goals**
- Establish a single design language: hierarchy, type scale, radii, elevation.
- Ship presentational screens S0–S5 with realistic mock data so the flow can
  be reviewed before any API wiring.
- Keep every screen accessible (min 44 px hit targets, labels, Reduce Motion
  friendly).

**Non-goals (this phase)**
- No Supabase / Perpl / worker calls.
- No navigation library adoption; a lightweight in-app switcher is enough
  for review. Real routing lands in a later phase.
- No dark mode yet (light theme only, matching `userInterfaceStyle: light`).

## 1. Visual language

### 1.1 Colour
| Token | Hex | Use |
|---|---|---|
| `bg` | `#f3f5f8` | App background |
| `surface` | `#ffffff` | Cards, sheets |
| `surfaceMuted` | `#eef1f6` | Grouped controls, chips |
| `text` | `#0b0d14` | Titles, primary numbers |
| `textSecondary` | `#4a5260` | Body, hints |
| `textTertiary` | `#7b8494` | Labels, captions |
| `accent` | `#ff5500` | Primary CTA (one per screen) |
| `ok` | `#1d9b5e` | Success, PnL up, connected |
| `error` | `#e43f3f` | Destructive, PnL down |
| `warning` | `#f3a21a` | Caution, withdraw |

Rules: one accent CTA per view. Semantic chips use soft fills (`okSoft`, etc.)
with matching text — never a solid semantic background behind more than a
status pill.

### 1.2 Typography
| Preset | Size / line | Weight | Use |
|---|---|---|---|
| `display` | 30 / 36 | 700 | Equity hero, onboarding hero |
| `heading` | 20 / 28 | 700 | Screen titles |
| `title` | 17 / 24 | 600 | Card titles |
| `body` | 15 / 22 | 400 | Paragraphs |
| `small` | 13 / 18 | 400 | Hints, metadata |
| `caption` | 11 / 16 | 600, uppercased, +0.6 tracking | Section labels |
| `metric` | 26 / 32 | 700, tabular | Money / amounts |

### 1.3 Radii
`xs 6 · sm 10 · md 12 · lg 16 · xl 20 · xxl 24 · pill 999`
- Inputs & buttons: `sm`
- Cards & grouped panels: `lg`
- Modals & bottom sheets: `xxl` (top corners for sheets)
- Status chips: `pill`

### 1.4 Elevation
- Level 0 (page containers): flat, no shadow.
- Level 1 (`shadows.card`): cards resting on `bg`.
- Level 2 (`shadows.raised`): floating action cards, modals.
- Level 3 (`shadows.overlay`): bottom sheets, confirm dialogs.
Always pair elevation with a 1 px `border` at `border` opacity for crisp
edges on both platforms.

### 1.5 Spacing
4-based scale (`xxs 2 · xs 4 · sm 8 · md 12 · lg 16 · xl 20 · xxl 24 ·
xxxl 32 · huge 48`). Screen horizontal padding `xl` (20); vertical rhythm
between sections `xxl`.

## 2. Reusable primitives (done / planned)

Located in `src/ui/`:
- `Card` — surface + radius + elevation + padding. Variants:
  `default | muted | flat`.
- `Badge` — status pill with `neutral | accent | ok | error | warning`.
- `SectionHeader` — title + optional subtitle + trailing action.
- `Metric` — label / value / hint with tone + size.
- `ProgressBar` — 0..1 fill with tone.

Still to add in this phase:
- `Screen` — safe-area + scroll + standard horizontal padding.
- `BottomSheet` — Level 3 surface sliding up; used for withdraw + kill
  switch + recovery warning.
- `EmptyState` — icon + title + body + CTA.
- `Skeleton` — shimmer placeholder for cards/lists while loading.
- `TextField` — labelled input with hint/error, reusing `radius sm`.
- `Divider` — 1 px hairline at `border`.

Existing components upgraded visually (not restructured) in a later pass:
`Button`, `AccountChip`, `Holdings`, `PriceChart`, `TradeForm`, `RecoveryPhrase`.

## 3. Screen-by-screen UI (S0–S5)

### S0 — Splash / router
**Layout** (full screen, centred column)
- Top third: brand wordmark `Perpl Arena` (display, -0.6 tracking) with a
  small `LIVE` badge when network context resolves.
- Centre: a `Card` (Level 1) skeleton stack — 3 muted rows — communicates
  "checking your account" without a blocking spinner. A caption underneath:
  "Checking your account…".
- Footer: `AccountChip`-style network pill (dot + chain name) bottom-left
  and build/version muted bottom-right.

**Hierarchy**: brand → status → network. No CTAs; auto-advances.

### S1 — Onboarding (mera)
**Layout** (scroll, padded)
- Hero `Card` (Level 2, `xxl` radius) occupying top: title
  "Welcome to Perpl Arena" (display), subtitle one line (body, muted),
  illustration placeholder (rounded rect, `surfaceMuted`).
- Steps `Card`: 3 numbered rows (Passkey, Silent identity, Fund) with a
  status dot (neutral → spinning on action). Each row: number circle (muted)
  + title (title) + one-line description (small).
- Primary CTA (full-width) `Create account with passkey` (accent).
- Secondary `Sign in` (outline button, full-width, below).
- Footer note: caption, centred — "No email. Biometrics never leave your device."

**Hierarchy**: hero → steps → CTAs → reassurance. Only one accent button.

### S2 / S2b — silent (no UI)
- S1 shows an in-place status change on the step rows ("Preparing identity…",
  "Linking wallet…"). No new screen.

### S3 — Connect Perpl (3 steps)
**Layout** (modal stack card over dimmed bg)
- Header: back affordance (text button), title "Connect trading account"
  (heading), subtitle (small).
- `StepIndicator`: 3 pills `Payload · Sign · Confirm`, active pill accent.
- `Card` (Level 1): address row (`Address:` mono + truncated + copy),
  then a muted `Card` (inset) explaining what enrollment does in 2 lines.
- Actions stack: primary `Enroll this wallet`; secondary `Import existing key`;
  tertiary text `I haven't funded yet →` (routes to S4).
- Error panel: bottom `Card` (errorSoft) with code (mono) + message + `Retry`.
- Legal/fee note: caption at bottom.

### S4 — Fund & activate
**Layout**
- Header: "Fund & activate" (heading) + subtitle.
- `BalanceCard` (`Card`, Level 1, xl): 
   - `Metric` "Available" (lg) + `Metric` "Locked" (md, muted) side by side.
   - Total equity row (title) with subtle divider.
   - `ProgressBar` to the 100 aUSD minimum; label switches from
     "Deposit 34.20 more" to `Badge tone=ok` "Minimum met".
- Actions: primary `Open faucet` (accent), secondary `I've deposited`,
  (outline), tertiary `Add funds` text if balance low.
- `Card` (muted) "How funding works" — 3 small bullets.
- Danger zone at very bottom: `LinkButton` "Withdraw funds" (error colour)
  → opens `BottomSheet`.

**BottomSheet (withdraw)** — Level 3, top corners `xxl`:
- Title "Withdraw funds" (heading, error).
- Warning body (small).
- Address `TextField` (mono).
- Amount `TextField`.
- Primary destructive `Confirm withdrawal` (error fill, white text).

### S5 — Dashboard / Home
**Layout** (scroll, padded; floats over bottom nav)
- Top bar (no shadow, bottom border): left title "Home" (heading); right
  cluster: live pill (Badge ok, dot), bell with unread count badge (Badge
  error, small), `AccountChip`.
- `EquityHero` `Card` (Level 2): 
   - label "Total equity" (caption)
   - `Metric` lg accent value (display-sized) 
   - row: 24h change (up/down badge) + "last updated 12s ago" small
   - mini chart placeholder `Card` muted inset (or `PriceChart` later).
- Quick actions row: 3 ghost buttons in a `Card` (flat): "Copy a trader",
  "Kill switch" (error text + confirm), "Markets".
- Section "Open positions" (`SectionHeader` with "See all"):
   - empty: `EmptyState`.
   - else: `Card` containing stacked `PositionRow`s with 1 px dividers.
- Section "Active copies" (`SectionHeader`): `Card` with `CopyRow`s
  (handle, allocation, status chip, pause toggle visual).
- Section "Recent activity" (`SectionHeader` "See all"): `Card` with
  `ActivityRow`s including lifecycle `Badge`.
- `BottomSheet` (kill switch confirm): title, consequence summary,
  primary destructive `Pause all copying` + cancel.

**Bottom nav** (Level 2, top border, rounded top `lg`):
- 5 tabs: Home · Markets · Traders · Contests · Account.
- Active tab accent icon + label; inactive muted. 44 px targets.
- Floating above safe area; subtle shadow upward.

## 4. Data contracts (UI side only)

Screens accept props shaped like the appflow's endpoints but without I/O.
Example:

```ts
type DashboardProps = {
  equity: string;
  equityChangePct: number;
  lastUpdatedSecondsAgo: number;
  positions: PositionRow[];
  activeCopies: CopyRow[];
  activity: ActivityRow[];
  unreadNotifications: number;
  onKillSwitch: () => void;
  // …
};
```

All money values arrive as **formatted strings**; formatting stays in the
eventual data layer, not in components.

## 5. File targets

New
- `src/ui/Screen.tsx`, `BottomSheet.tsx`, `EmptyState.tsx`, `Skeleton.tsx`,
  `TextField.tsx`, `Divider.tsx`
- `src/screens/SplashScreen.tsx`
- `src/screens/OnboardingScreen.tsx`
- `src/screens/ConnectPerplScreen.tsx`
- `src/screens/FundScreen.tsx`
- `src/screens/DashboardScreen.tsx`
- `src/screens/ui-types.ts` (prop contracts, no logic)
- `src/navigation/AppShell.tsx` (tabs + stack visuals only)

Modified (style only, no logic)
- `src/theme.ts` (done: tokens)
- `src/ui/*` (done: Card, Badge, SectionHeader, Metric, ProgressBar)
- later: `src/Button.tsx`, `src/AccountChip.tsx`, existing demo components.

Untouched
- `src/wallet.ts`, `src/storage.ts`, `src/account.ts`, `src/TradingScreen.tsx`,
  `App.tsx` logic blocks.

## 6. Implementation phases & checkpoints

1. **Tokens + primitives** (current) — done partially; typecheck clean.
2. **Static screens** — build S0–S1 with mock data; review.
3. **S3–S4** — wizard + funding visuals; review destructive sheet.
4. **S5** — dashboard + bottom nav; review hierarchy on small screens.
5. **Polish pass** — spacing, shadows, skeletons, empty states; verify on
   web (`expo start --web`) and a device.

Checkpoint after each phase: `pnpm --filter @workspace/mera-mobile run typecheck`
must pass; no change to logic files.

## 7. Review questions for the user
- Keep the warm orange `#ff5500` as the single accent, or move to a cooler
  finance-blue? (Affects primary CTAs and active tab.)
- Should onboarding illustrations be abstract (recommended, no asset cost)
  or branded photography?
- Bottom nav: 5 tabs as proposed, or collapse Contests into Traders?
- Confirm sheets: prefer bottom sheets (proposed) or centred modals?