import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { palette, spacing } from "../theme";

type MetricProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "up" | "down" | "accent";
  size?: "lg" | "md";
  trailing?: ReactNode;
};

function Metric({
  label,
  value,
  hint,
  tone = "default",
  size = "lg",
  trailing,
}: MetricProps) {
  const valueStyle = size === "lg" ? styles.valueLg : styles.valueMd;
  const toneStyle = toneStyles[tone];

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Text style={[valueStyle, toneStyle]}>{value}</Text>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const toneStyles = {
  default: { color: palette.text },
  up: { color: palette.up },
  down: { color: palette.down },
  accent: { color: palette.accent },
} as const;

const styles = StyleSheet.create({
  hint: { color: palette.textTertiary, fontSize: 12, lineHeight: 16 },
  label: {
    color: palette.textTertiary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
    lineHeight: 14,
    textTransform: "uppercase",
  },
  row: { alignItems: "baseline", flexDirection: "row", gap: spacing.sm },
  trailing: { marginLeft: "auto" },
  valueLg: {
    color: palette.text,
    fontSize: 26,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  valueMd: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  wrap: { gap: 4 },
});

export { Metric };