import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../Button";
import { palette, spacing, text } from "../theme";

type EmptyStateProps = {
  title: string;
  body?: string;
  glyph?: string;
  actionLabel?: string;
  onAction?: () => void;
};

function EmptyState({
  title,
  body,
  glyph = "•",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <View style={styles.glyphWrap}>
        <Text style={styles.glyph}>{glyph}</Text>
      </View>
      <Text style={[text.title, styles.title]}>{title}</Text>
      {body ? <Text style={text.small}>{body}</Text> : null}
      {actionLabel ? (
        <Button title={actionLabel} onPress={() => onAction?.()} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: { color: palette.textTertiary, fontSize: 28, fontWeight: "700" },
  glyphWrap: {
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  root: { alignItems: "center", gap: spacing.md, padding: spacing.xl },
  title: { textAlign: "center" },
});

export { EmptyState };