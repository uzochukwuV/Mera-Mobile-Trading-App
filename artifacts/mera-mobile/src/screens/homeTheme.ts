// Pera design system — achromatic canvas, electric indigo accent.
//
// Pure white surfaces, black text, one accent. Hierarchy comes from
// whitespace, weight contrast, and scale — not borders or shadows.
// Elevation is a single soft drop shadow, used sparingly.
//
// Type scale (figmaSans / system):
//   display  34/800  hero values (balances, marks)
//   heading  26/700  screen titles
//   section  18/700  content group titles
//   body     15/400  important information
//   support  13/400  secondary details
//   micro    11/500  nonessential metadata
//
// Spacing is 8pt (4pt where necessary). Screen padding 20. Controls are
// pill-shaped (radius 9999); cards 20; sheets 24.

export const PAPER = "#FFFFFF";
export const BG = "#FFFFFF";
export const SHEET = "#FFFFFF";
export const CARD = "#FFFFFF";
export const CARD_SOFT = "#F4F4F5";
export const BORDER = "#E4E4E7";
export const INK = "#09090B";
export const SECONDARY = "#52525B";
export const MUTED = "#8E8E93";

// Single accent. TEAL is kept as a legacy alias so existing imports keep
// compiling; new code should use INDIGO.
export const INDIGO = "#4D49FC";
export const TEAL = INDIGO;
export const INDIGO_SOFT = "rgba(77, 73, 252, 0.10)";
export const ON_ACCENT = "#FFFFFF";

// Semantics — green/red only for trading meaning.
export const UP = "#16A34A";
export const UP_SOFT = "rgba(22, 163, 74, 0.12)";
export const DOWN = "#DC2626";
export const DOWN_SOFT = "rgba(220, 38, 38, 0.10)";
export const AMBER = "#B45309";
export const AMBER_SOFT = "rgba(180, 83, 9, 0.12)";

// Tint avatars.
export const ACCENT = "#E9E8FF";
export const ACCENT_INK = "#4D49FC";

export const RADIUS = {
  pill: 9999,
  input: 16,
  card: 20,
  sheet: 24,
} as const;

export const SPACE = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const TYPE = {
  display: { fontSize: 34, fontWeight: "800", lineHeight: 41 },
  heading: { fontSize: 26, fontWeight: "700", lineHeight: 32 },
  section: { fontSize: 18, fontWeight: "700", lineHeight: 24 },
  body: { fontSize: 15, fontWeight: "400", lineHeight: 22 },
  support: { fontSize: 13, fontWeight: "400", lineHeight: 19 },
  micro: { fontSize: 11, fontWeight: "500", lineHeight: 14 },
} as const;

// The one elevation in the system: soft drop shadow for elevated cards.
export const SHADOW_SOFT = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 24,
  elevation: 4,
} as const;
