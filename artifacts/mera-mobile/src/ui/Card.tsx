import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { palette, radii, shadows, spacing } from "../theme";

type CardVariant = "default" | "muted" | "flat";

type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
  padding?: number;
  style?: ViewStyle;
};

function Card({
  children,
  variant = "default",
  padding = spacing.lg,
  style,
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === "default" ? styles.default : null,
        variant === "muted" ? styles.muted : null,
        variant === "flat" ? styles.flat : null,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    overflow: "hidden",
  },
  default: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    ...shadows.card,
  },
  flat: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
  },
  muted: {
    backgroundColor: palette.surfaceMuted,
    borderColor: "transparent",
  },
});

export { Card };
export type { CardProps, CardVariant };