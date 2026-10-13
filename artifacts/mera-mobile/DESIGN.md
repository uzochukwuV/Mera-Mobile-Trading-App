# Pera Dark — Style Reference
> near-black trading terminal — lifted dark cards, white Inter type, green/red reserved for money

**Theme:** dark

Derived from the reference screens in `/icon` (dark fintech: black splash, balance headers, asset rows, pair detail with LONG/SHORT blocks, trade bottom sheet, grouped history). This replaces the previous light Campsite system everywhere.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Abyss | `#0B0E13` | `bg` / `canvas` | Page canvas — near-black, cards lift off it |
| Splash Black | `#060809` | — | Splash background only, pure dark |
| Card Surface | `#151B26` | `surface` | Cards, sheets, preview frames |
| Muted Inset | `#1E2532` | `surfaceMuted` | Chips, segments, search fields, stat strips |
| Raised | `#242C3B` | `surfaceStrong` | Active chip fills, pressed states |
| Pure White | `#FFFFFF` | `text` / `ink` | Headings, prices, primary values |
| Body Gray | `#C4CCD8` | `textSecondary` / `graphite` | Body copy, row details |
| Muted Gray | `#8B94A5` | `textTertiary` / `slate` | Labels, captions, inactive tabs |
| Faint | `#4A5261` / `#5F6879` | `faint` / `ash` | Placeholders, timestamps, disabled |
| Hairline | `rgba(255,255,255,0.08)` | `border` | Row dividers, card edges |
| Signal Blue | `#2F7CF6` | `primary` / `accent` | Primary actions, links, active states |
| Sky | `#7CC4FF` | `link` / `info` | Secondary links, sliders, metadata accents |
| Pera Orange | `#ff6b1a` | `campfire` / `ember` | Brand punctuation only — logo dot, lev tags |
| Sunlit Cream | `#fef3c7` | `sunlitCream` | Soft tag wash with ember-brown text |
| Bull Green | `#22C55E` | `ok` / `up` / `forest` | Long, gains, filled, live — money only |
| Bear Red | `#F6465D` | `error` / `down` | Short, losses, failed, destructive |
| Trade Purple | `#6D5EF0` | — | LONG direction button only |
| Amber | `#FF9F2E` | `warning` / `gold` | Leverage tags, caution |

## Tokens — Typography

Inter only. Weights 400 body / 500 metadata / 600 display. Money always `tabular-nums`.

| Role | Size | Weight | Use |
|------|------|--------|-----|
| display | 29 | 600, -0.52 | Equity hero, pair quote |
| title | 22 | 600, -0.37 | Screen + section titles |
| section | 18 | 600 | Sub-section heads |
| body | 15 | 400 | Paragraphs |
| small | 13 | 400 | Details, metadata |
| caption | 12 | 500, +0.3 | Labels, pills, buttons |
| micro | 11 | 500 | Timestamps, disclosures |

## Tokens — Spacing & Shapes

Base unit 4px. Screen padding 16–24; card padding 16–20; element gaps 8–12; section gaps 24–32.

Radius: pills/chips/tabs `9999`; cards `12`; trade blocks `12`; inputs `8`; sheets top `24`; icon badges `9999`.

Elevation: cards separate by surface tone + soft black shadow; glow only on primary blue buttons. No light-theme inset tricks.

## Components

- **Splash**: `#060809` full-bleed, centered brand mark, faint wave arcs bottom third. No text.
- **Balance header**: caption label → 29/600 tabular value + unit → change pill + updated caption.
- **Quick actions**: 4× 56px muted-circle icon buttons in a row with 12px labels (Deposit / Withdraw / Buy / Sell pattern).
- **Asset row**: 40px coin badge + name 14/600 + sub 12 faint left; balance 15/600 tabular + green/red % right. Hairline dividers, 12px row padding.
- **Segmented**: muted inset pill container, active segment = raised fill + white text.
- **Chips**: pill Pressables — active ink/blue fill, inactive muted fill.
- **LONG/SHORT**: full-width 12px blocks, 56px, purple `#6D5EF0` / red `#F6465D`, white 600 labels.
- **Trade sheet**: top-24 radius, pair+SIDE title, price metric, Market/Isolated chips, leverage readout + preset pills, amount field, value/fees inset card, full-width confirm.
- **History**: date-group caption + count → icon-led rows (badge + direction arrow, title/detail, colored amount).
- **Bottom nav**: surface bar, hairline top border, 5 tabs (glyph + 11px label), active = muted pill + white, 52px targets.
- **Tags**: pill 4/10 padding 12/500 — solid forest/ember/blue/ink (white text) for direction/status; soft tints for pending.

## Do's and Don'ts

### Do
- Keep green/red exclusively for money, direction, and status.
- Set prices/equity tabular-nums, white 600; labels 12px muted.
- Separate cards by surface tone first, shadow second.
- Use blue for primary actions, orange only for brand/leverage punctuation.
- One-line rows with hairlines; 12px vertical row rhythm.

### Don't
- Don't use light surfaces, warm cream, or dark-on-light text anywhere.
- Don't use green/red for decorative or brand elements.
- Don't add gradients except imagery/product art.
- Don't shrink tap targets below 44px; keep 56px primary blocks.
- Don't add new icon/slider/gesture dependencies — draw with Views, SVG, and Pressables.
