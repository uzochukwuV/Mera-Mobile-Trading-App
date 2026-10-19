// Pera design system — warm paper canvas, highlighter accent.
//
// The palette is achromatic plus exactly one chromatic accent:
//
//   Paper      #ffffff  card surfaces, reversed text on dark
//   Bone       #f4f2f0  the page canvas, subtle washes
//   Ink        #0c0a08  primary text, headings, dark surfaces
//   Obsidian   #1a1919  dark panels, nav bar
//   Ash        #6d6c6b  secondary text, hushed captions
//   Hairline   #e5e7eb  borders and dividers
//   Smoke      #d3d3d3  muted borders, skeletons
//   Highlighter #e4f222 primary action, live counters, highlights
//
// Hierarchy comes from size and tracking, not weight contrast: the
// system uses a single weight (400) and the type scale below. Lausanne
// is the intended face; the system sans (Inter on Android, SF on iOS)
// is its documented substitute and needs no bundling.
//
// Elevation is a 1px hairline, not a shadow. `SHADOW_SOFT` is kept as
// the name every screen already imports, but it now draws the hairline.
//
// Spacing is the 4px base unit, comfortable density. Screen padding 20.
// Controls are pill-shaped (radius 9999); cards 20; sheets 24.

import { Platform } from "react-native";

/** Lausanne's documented substitute, bundled so Android and web agree. */
export const FONT = "Inter";
/** Menlo is iOS-only; Android and web fall back to their mono face. */
export const MONO =
  Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) ??
  "monospace";

export const PAPER = "#FFFFFF";
/** the page canvas */
export const BG = "#F4F2F0";
export const SHEET = "#FFFFFF";
export const CARD = "#FFFFFF";
/** the subtle wash — one step off Paper */
export const CARD_SOFT = "#F4F2F0";
export const BONE = "#F4F2F0";
export const BORDER = "#E5E7EB";
export const HAIRLINE = "#E5E7EB";
export const SMOKE = "#D3D3D3";
export const INK = "#0C0A08";
export const OBSIDIAN = "#1A1919";
export const SECONDARY = "#6D6C6B";
export const MUTED = "#6D6C6B";

// The one chromatic accent. TEAL is a legacy alias so existing imports
// keep compiling; new code should use INDIGO.
export const INDIGO = "#E4F222";
export const TEAL = INDIGO;
export const INDIGO_SOFT = "rgba(228, 242, 34, 0.30)";
/** yellow is a light fill: its ink is black, never white */
export const ON_ACCENT = "#0C0A08";

// Trading meaning without a second hue: a rise is the primary voice,
// a fall is the hushed one, and the sign and arrow carry the rest.
// This is the strict reading of "one chromatic accent" — and it keeps
// the accent meaning "act" rather than "up".
export const UP = "#0C0A08";
export const UP_SOFT = "#F4F2F0";
export const DOWN = "#6D6C6B";
export const DOWN_SOFT = "#F4F2F0";
// Warnings are the accent used as a highlight, not a second colour.
export const AMBER = "#0C0A08";
export const AMBER_SOFT = "rgba(228, 242, 34, 0.45)";

// Tint avatars.
export const ACCENT = "#F4F2F0";
export const ACCENT_INK = "#0C0A08";

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

// One weight (400). Sizes and tracking do the work.
export const TYPE = {
  display: { fontFamily: FONT, fontSize: 40, fontWeight: "400", lineHeight: 42, letterSpacing: -0.8 },
  heading: { fontFamily: FONT, fontSize: 28, fontWeight: "400", lineHeight: 32, letterSpacing: -0.4 },
  section: { fontFamily: FONT, fontSize: 20, fontWeight: "400", lineHeight: 26, letterSpacing: -0.2 },
  body: { fontFamily: FONT, fontSize: 16, fontWeight: "400", lineHeight: 24 },
  support: { fontFamily: FONT, fontSize: 13, fontWeight: "400", lineHeight: 20 },
  micro: { fontFamily: FONT, fontSize: 10, fontWeight: "400", lineHeight: 14, letterSpacing: 0.18 },
} as const;

// The elevation primitive: a 1px hairline. Kept under the old name so
// the screens that already spread it gain the new rule everywhere.
export const SHADOW_SOFT = {
  borderColor: HAIRLINE,
  borderWidth: 1,
} as const;
