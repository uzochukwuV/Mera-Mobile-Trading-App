import type { ReactElement } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../ui";
import { palette, radii, spacing, text } from "../theme";
import type { CopyManagementProps, CopySettingRow } from "./types";

const DEFAULT_COPIES: CopySettingRow[] = [
  { leaderId: "satoshi-trades", handle: "satoshi-trades", allocation: "500.00", status: "Active" },
  { leaderId: "macro-desk", handle: "macro-desk", allocation: "250.00", status: "Paused" },
];

function StatusTag({ status }: { status: CopySettingRow["status"] }) {
  const active = status === "Active";
  return (
    <View style={[styles.tag, active ? styles.tagActive : styles.tagPaused]}>
      <View style={[styles.tagDot, active ? styles.tagDotActive : styles.tagDotPaused]} />
      <Text style={[styles.tagLabel, active ? styles.tagLabelActive : styles.tagLabelPaused]}>
        {status}
      </Text>
    </View>
  );
}

function MiniButton({
  title,
  onPress,
  danger,
}: {
  title: string;
  onPress?: () => void;
  danger?: boolean;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.mini,
        danger ? styles.miniDanger : styles.miniGhost,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.miniLabel, danger ? styles.miniLabelDanger : styles.miniLabelGhost]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function CopyManagementScreen(props: CopyManagementProps = {}): ReactElement {
  const {
    copies = DEFAULT_COPIES,
    onPause,
    onResume,
    onStop,
    onKillSwitch,
    onBack,
  } = props;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onBack?.()}
          style={styles.back}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Copying</Text>

        {copies.map((copy) => (
          <Card key={copy.leaderId} style={styles.card}>
            <View style={styles.rowTop}>
              <View style={styles.rowMain}>
                <Text style={styles.handle}>{copy.handle}</Text>
                <Text style={styles.allocation}>{copy.allocation} aUSD</Text>
              </View>
              <StatusTag status={copy.status} />
            </View>
            <View style={styles.actions}>
              {copy.status === "Active" ? (
                <MiniButton title="Pause" onPress={() => onPause?.(copy.leaderId)} />
              ) : (
                <MiniButton title="Resume" onPress={() => onResume?.(copy.leaderId)} />
              )}
              <MiniButton title="Stop" danger onPress={() => onStop?.(copy.leaderId)} />
            </View>
          </Card>
        ))}

        <Card style={styles.card}>
          <Text style={styles.dangerTitle}>Stop everything</Text>
          <Text style={text.caption}>Pauses every copy at once.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onKillSwitch}
            style={({ pressed }) => [styles.kill, pressed ? styles.pressed : null]}
          >
            <Text style={styles.killLabel}>Stop everything</Text>
          </Pressable>
        </Card>

        <Text style={styles.footnote}>Stopping keeps history.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", gap: spacing.xs },
  back: { alignSelf: "flex-start", paddingVertical: 4 },
  backText: { color: palette.graphite, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  allocation: {
    color: palette.ash,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    lineHeight: 16,
  },
  card: { gap: spacing.sm },
  dangerTitle: { color: palette.ink, fontSize: 14, fontWeight: "600", lineHeight: 19 },
  footnote: { color: palette.ash, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  handle: { color: palette.ink, fontSize: 14, fontWeight: "600", lineHeight: 19 },
  kill: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: palette.error,
    borderRadius: radii.button,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: "100%",
  },
  killLabel: { color: palette.error, fontSize: 14, fontWeight: "500", lineHeight: 20 },
  mini: {
    alignItems: "center",
    borderRadius: radii.full,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  miniDanger: { backgroundColor: "transparent", borderColor: palette.error },
  miniGhost: { backgroundColor: "transparent", borderColor: palette.border },
  miniLabel: { fontSize: 12, fontWeight: "500", lineHeight: 16 },
  miniLabelDanger: { color: palette.error },
  miniLabelGhost: { color: palette.graphite },
  pressed: { opacity: 0.85 },
  rowMain: { flex: 1, gap: 2 },
  rowTop: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  screen: { backgroundColor: palette.bg, flex: 1 },
  scroll: { gap: spacing.md, paddingBottom: spacing.xl, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  tag: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagActive: { backgroundColor: palette.okSoft },
  tagDot: { borderRadius: radii.pill, height: 6, width: 6 },
  tagDotActive: { backgroundColor: palette.forest },
  tagDotPaused: { backgroundColor: palette.emberBrown },
  tagLabel: { fontSize: 12, fontWeight: "500", lineHeight: 15 },
  tagLabelActive: { color: palette.forest },
  tagLabelPaused: { color: palette.emberBrown },
  tagPaused: { backgroundColor: palette.sunlitCream },
  title: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.37,
    lineHeight: 31,
  },
});

export default CopyManagementScreen;
