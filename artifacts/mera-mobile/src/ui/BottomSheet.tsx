import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { palette, radii, shadow, spacing } from "../theme";

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  style?: ViewStyle;
};

function BottomSheet({ visible, onClose, title, children, style }: BottomSheetProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, style]}>
        <View style={styles.handle} />
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <View style={styles.content}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(10, 13, 20, 0.45)",
    flex: 1,
  },
  content: { gap: spacing.md },
  handle: {
    alignSelf: "center",
    backgroundColor: palette.borderStrong,
    borderRadius: radii.pill,
    height: 4,
    marginBottom: spacing.sm,
    width: 40,
  },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    ...shadow.sheet,
  },
  title: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
});

export { BottomSheet };