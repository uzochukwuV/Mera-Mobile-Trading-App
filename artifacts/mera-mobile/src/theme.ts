import { Platform, StyleSheet } from "react-native";

/**
 * Pera mobile design tokens — dark trading theme derived from the reference
 * screens in /icon (Roqqu-style dark fintech).
 *
 * Near-black canvas, lifted dark cards, white Inter type, green/red only
 * for trading semantics, blue primary action, Pera orange rationed to
 * brand punctuation. Legacy key names are kept so existing components
 * keep compiling; values are remapped to the dark system.
 */

const palette = {
  // Surfaces — black canvas → lifted card → muted inset
  bg: "#0B0E13",
  bgElevated: "#0B0E13",
  canvas: "#0B0E13",
  canvasSoft: "#1E2532",
  surface: "#151B26",
  surfaceMuted: "#1E2532",
  surfaceStrong: "#242C3B",
  stone: "#8B94A5",
  sand: "#1E2532",
  sunlitCream: "#fef3c7",
  emberBrown: "#451a03",

  // Text — white display, gray metadata
  text: "#FFFFFF",
  textSecondary: "#C4CCD8",
  textTertiary: "#8B94A5",
  textInverse: "#FFFFFF",
  heading: "#FFFFFF",
  body: "#C4CCD8",
  muted: "#8B94A5",
  faint: "#4A5261",
  ink: "#FFFFFF",
  slate: "#8B94A5",
  graphite: "#C4CCD8",
  ash: "#5F6879",

  // Dividers — faint white hairlines
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.14)",
  hairline: "rgba(255, 255, 255, 0.08)",
  hairlineStrong: "rgba(255, 255, 255, 0.14)",

  // Brand — blue primary action, Pera orange punctuation only
  primary: "#2F7CF6",
  primaryDeep: "#1F5FD0",
  forest: "#22C55E",
  onPrimary: "#ffffff",
  accent: "#2F7CF6",
  accentSoft: "rgba(47, 124, 246, 0.16)",
  accentText: "#ffffff",
  campfire: "#ff6b1a",
  campfireSoft: "#fef3c7",
  ember: "#ff6b1a",
  emberSoft: "#fef3c7",
  link: "#7CC4FF",
  info: "#7CC4FF",
  sky: "#7CC4FF",
  grass: "#22C55E",
  mint: "#22C55E",
  sun: "#fef3c7",
  gold: "#FF9F2E",
  honey: "#fef3c7",
  coral: "#F6465D",
  plum: "#8B94A5",
  mint50: "rgba(34, 197, 94, 0.12)",
  mint100: "rgba(34, 197, 94, 0.20)",
  mint200: "#22C55E",
  limeHero: "#9ae600",
  limePanel: "#e8fdac",
  limeAccent: "#ddfa88",
  limeRibbon: "#a8ea4c",
  logoLime: "#8dc63f",
  ok: "#22C55E",
  okSoft: "rgba(34, 197, 94, 0.16)",
  error: "#F6465D",
  errorSoft: "rgba(246, 70, 93, 0.14)",
  warning: "#FF9F2E",
  warningSoft: "rgba(255, 159, 46, 0.16)",
  up: "#22C55E",
  down: "#F6465D",

  // Utility
  success: "#22C55E",
  surface2: "#1E2532",
} as const;

const monoFont = Platform.select({ ios: "Menlo", default: "monospace" });

/** Radii — pills/chips full, cards 12–16, sheets 24. */
const radii = {
  none: 0,
  xxs: 1,
  xs: 2,
  sm: 8,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  xxxl: 24,
  tooltip: 20,
  button: 9999,
  icon: 9999,
  illustration: 12,
  full: 9999,
  pill: 9999,
} as const;

/** Spacing — 4px base unit. */
const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
  section: 64,
} as const;

/** Elevation — cards lift via surface tone; glow only on primary. */
const shadows = {
  none: {},
  subtle: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
  },
  primary: {
    shadowColor: "#2F7CF6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  icon: {},
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
  },
  overlay: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 6,
  },
  sheet: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// Type — Inter only: 600 display, 500 metadata, 400 body max.
const text = StyleSheet.create({
  caption: {
    color: palette.slate,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
    lineHeight: 15,
  },
  label: {
    color: palette.slate,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
    lineHeight: 15,
  },
  eyebrow: {
    color: palette.slate,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
    lineHeight: 15,
  },
  micro: {
    color: palette.ash,
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
  },
  hint: { color: palette.graphite, fontSize: 14, fontWeight: "400", lineHeight: 21 },
  body: {
    color: palette.graphite,
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
  },
  bodyStrong: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  small: {
    color: palette.graphite,
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 19,
  },

  // Display — 600 only, tight tracking
  title: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.37,
    lineHeight: 31,
  },
  heading: {
    color: palette.ink,
    fontSize: 29,
    fontWeight: "600",
    letterSpacing: -0.52,
    lineHeight: 35,
  },
  headingLg: {
    color: palette.ink,
    fontSize: 29,
    fontWeight: "600",
    letterSpacing: -0.52,
    lineHeight: 35,
  },
  display: {
    color: palette.ink,
    fontSize: 29,
    fontWeight: "600",
    letterSpacing: -0.52,
    lineHeight: 35,
  },
  metric: {
    color: palette.ink,
    fontSize: 29,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.52,
    lineHeight: 35,
  },
  metricSmall: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.37,
    lineHeight: 31,
  },
  mono: { color: palette.text, fontFamily: monoFont, fontSize: 12, lineHeight: 14 },
});

export { monoFont, palette, radii, shadows, spacing, text };
export { shadows as shadow };
export { shadows as elevation };
