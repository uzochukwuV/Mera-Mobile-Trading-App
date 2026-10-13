import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { palette, radii, shadows, spacing } from "./theme";

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
};

function Button({
  title,
  onPress,
  disabled,
  primary,
}: ButtonProps): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        primary ? styles.primary : styles.ghost,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={primary ? styles.primaryLabel : styles.ghostLabel}>
        {title}
      </Text>
    </Pressable>
  );
}

type LinkButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

function LinkButton({
  title,
  onPress,
  disabled,
}: LinkButtonProps): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.link,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={styles.linkLabel}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.45 },
  // Ghost pill — transparent, 1px linen border, slate text.
  ghost: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: palette.border,
    borderRadius: radii.button,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: "100%",
  },
  ghostLabel: {
    color: palette.slate,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  link: { paddingHorizontal: 4, paddingVertical: 2 },
  linkLabel: {
    color: palette.graphite,
    fontSize: 14,
    fontWeight: "500",
  },
  pressed: { opacity: 0.85 },
  // Filled pill — midnight ink, white 14/500, inset highlight elevation.
  primary: {
    alignItems: "center",
    backgroundColor: palette.primary,
    borderRadius: radii.button,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: "100%",
    ...shadows.primary,
  },
  primaryLabel: {
    color: palette.onPrimary,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
});

export { Button, LinkButton };
