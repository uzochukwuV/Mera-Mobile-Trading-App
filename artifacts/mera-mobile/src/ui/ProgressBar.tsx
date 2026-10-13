import { StyleSheet, View } from "react-native";
import { palette, radii, spacing } from "../theme";

type ProgressBarProps = {
  value: number; // 0..1
  tone?: "accent" | "ok" | "warning" | "error";
  height?: number;
};

function ProgressBar({ value, tone = "accent", height = 6 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          toneStyles[tone],
          {
            borderRadius: height / 2,
            width: `${Math.round(clamped * 100)}%`,
          },
        ]}
      />
    </View>
  );
}

const toneStyles = {
  accent: { backgroundColor: palette.accent },
  ok: { backgroundColor: palette.ok },
  warning: { backgroundColor: palette.warning },
  error: { backgroundColor: palette.error },
} as const;

const styles = StyleSheet.create({
  fill: { height: "100%" },
  track: { backgroundColor: palette.surfaceMuted, overflow: "hidden", width: "100%" },
});

export { ProgressBar };