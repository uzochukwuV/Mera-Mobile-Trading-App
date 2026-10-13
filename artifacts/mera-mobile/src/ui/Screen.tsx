import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { palette, spacing } from "../theme";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  backgroundColor?: string;
};

function Screen({
  children,
  scroll = true,
  padded = true,
  backgroundColor = palette.bg,
}: ScreenProps) {
  const content = (
    <View style={[styles.content, padded ? styles.padded : null]}>{children}</View>
  );

  if (!scroll) {
    return <View style={[styles.root, { backgroundColor }]}>{content}</View>;
  }

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.huge },
  padded: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
});

export { Screen };