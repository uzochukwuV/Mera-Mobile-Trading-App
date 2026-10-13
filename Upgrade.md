# Upgrade Plan — originality plays for Onchain Finance & Trading

Goal: turn the mobile venue from "a faster clone" into new trading
experiences that lean on Monad's sub-second finality. Ordered by
payoff-per-hour with ~12h to the bounty deadline.

## 1. TWAP / grid execution in the worker (DO FIRST, 3–5h)

**What:** a `TWAP` order intent. User picks size + slice count + interval;
the worker drips child orders into Perpl; the app shows live progress
(slice 4/12 filled).

**Why it's original:** new execution primitives surfaced through a mobile
interface (track starting point #07). Sub-second finality makes
400ms-spaced slices meaningful — execution quality that can't exist
where settlement is the bottleneck.

**Builds on:** existing manual-intent queue, worker consumer,
idempotency keys (`POST /trading/orders`), realtime tick UI.
**Needs:** `side: "twap"` intent shape, worker slicer loop, progress
state on the ticket/trades screens, one screen recording for the demo.

## 2. Conditional copy with auto-pause guards (DO SECOND, 2–4h)

**What:** per-copy guards evaluated by the worker each snapshot tick —
"pause if leader 24h drawdown > X%", "pause if my copy PnL < –$Y" —
surfaced as a toggle + status line ("Paused by guard: leader −8.2%").

**Why it's original:** risk-conditioned copy-following with
onchain-verifiable triggers. Turns copy-trading from a clone feature
into a structured-product primitive.

**Builds on:** copy settings API, worker snapshot loop, kill-switch UI.
**Needs:** guard fields on copy settings, worker evaluation per tick,
guard status in copy manager.

## 3. Staked tournament entries (ROADMAP, post-hackathon)

**What:** tournament entries escrowed in AUSD in a minimal contract,
auto-paid to top ranks on settle. Skill-staked trading arenas.

**Why it's original:** closest thing to a new market structure in the
stack. But it needs a contract, funding flow, and review — do NOT
half-ship it before judging. Announce as next step with a TVL target.

## Pitch line

"Execution primitives (TWAP/grid) + risk-conditioned copy + staked
arenas — a mobile venue, not a faster clone."
