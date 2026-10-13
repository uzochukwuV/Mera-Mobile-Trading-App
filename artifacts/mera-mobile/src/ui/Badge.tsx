import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { palette, radii, text } from "../theme";

type BadgeTone = "neutral" | "accent" | "ok" | "error" | "warning";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
};

function Badge({ children, tone = "neutral", dot = false }: BadgeProps) {
  return (
    <View style={[styles.base, toneStyles[tone].container]}>
      {dot ? (
        <View style={[styles.dot, toneStyles[tone].dot]} />
      ) : null}
      <Text style={[text.caption, toneStyles[tone].label, styles.label]}>
        {children}
      </Text>
    </View>
  );
}

const toneStyles = {
  neutral: {
    container: { backgroundColor: palette.surfaceMuted },
    dot: { backgroundColor: palette.textTertiary },
    label: { color: palette.textSecondary },
  },
  accent: {
    container: { backgroundColor: palette.accentSoft },
    dot: { backgroundColor: palette.accent },
    label: { color: palette.accent },
  },
  ok: {
    container: { backgroundColor: palette.okSoft },
    dot: { backgroundColor: palette.ok },
    label: { color: palette.ok },
  },
  error: {
    container: { backgroundColor: palette.errorSoft },
    dot: { backgroundColor: palette.error },
    label: { color: palette.error },
  },
  warning: {
    container: { backgroundColor: palette.warningSoft },
    dot: { backgroundColor: palette.warning },
    label: { color: palette.warning },
  },
} as const;

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: { borderRadius: radii.pill, height: 6, width: 6 },
  label: { fontSize: 12, letterSpacing: 0.3, lineHeight: 15 },
});

export { Badge };
export type { BadgeProps, BadgeTone };