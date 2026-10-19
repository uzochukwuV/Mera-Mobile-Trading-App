import { ReactElement, ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { DOWN, FONT, INDIGO, INK, ON_ACCENT, RADIUS } from "./homeTheme";

type PillButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  busy?: boolean;
  icon?: ReactNode;
  accessibilityLabel?: string;
};

/**
 * The one button in the system. Pill-shaped, 56px tall, semibold label.
 * Primary = indigo fill; secondary = soft ink outline; danger = red text
 * on soft red; ghost = plain indigo text.
 */
export function PillButton(props: PillButtonProps): ReactElement {
  const {
    label,
    onPress,
    variant = "primary",
    disabled = false,
    busy = false,
    icon = null,
    accessibilityLabel,
  } = props;
  const inactive = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : null,
        variant === "secondary" ? styles.secondary : null,
        variant === "danger" ? styles.danger : null,
        variant === "ghost" ? styles.ghost : null,
        pressed && !inactive ? styles.pressed : null,
        inactive ? styles.inactive : null,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={ON_ACCENT} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text
            style={[
              styles.label,
              variant === "primary" ? styles.labelOnAccent : null,
              variant === "secondary" ? styles.labelInk : null,
              variant === "danger" ? styles.labelDanger : null,
              variant === "ghost" ? styles.labelGhost : null,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
  },
  primary: { backgroundColor: INDIGO },
  secondary: {
    backgroundColor: "transparent",
    borderColor: INK,
    borderWidth: 1.5,
  },
  danger: { backgroundColor: "rgba(220, 38, 38, 0.10)" },
  ghost: { backgroundColor: "transparent", minHeight: 48 },
  pressed: { opacity: 0.85 },
  inactive: { opacity: 0.5 },
  content: { alignItems: "center", flexDirection: "row", gap: 8 },
  label: { fontFamily: FONT, fontSize: 16, fontWeight: "400", lineHeight: 22 },
  labelOnAccent: { color: ON_ACCENT },
  labelInk: { color: INK },
  labelDanger: { color: DOWN },
  labelGhost: { color: INK },
});
