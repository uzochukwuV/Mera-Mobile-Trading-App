import { useState, type ReactElement, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../Button";
import { BottomSheet, Card, ProgressBar, TextField } from "../ui";
import { palette, radii, spacing, text } from "../theme";
import type { FundProps } from "./types";

type TagVariant = "ok" | "sunlit";

function Tag({ variant, dot, children }: { variant: TagVariant; dot?: boolean; children: ReactNode }) {
  const style = tagStyles[variant];
  return (
    <View style={[styles.tag, style.container]}>
      {dot ? <View style={[styles.tagDot, style.dot]} /> : null}
      <Text style={[styles.tagLabel, style.label]}>{children}</Text>
    </View>
  );
}

const tagStyles = {
  ok: {
    container: { backgroundColor: palette.okSoft },
    dot: { backgroundColor: palette.forest },
    label: { color: palette.forest },
  },
  sunlit: {
    container: { backgroundColor: palette.sunlitCream },
    dot: { backgroundColor: palette.emberBrown },
    label: { color: palette.emberBrown },
  },
} as const;

const HOW_IT_WORKS = [
  "Get test funds from the faucet.",
  "Deposit lands as available balance.",
  "Meet the minimum to enroll.",
] as const;

export function FundScreen(props: FundProps): ReactElement {
  const {
    available = "0.00",
    locked = "0.00",
    equity = "0.00",
    progress = 0,
    meetsMinimum = false,
    remaining = "10.00",
    onOpenFaucet,
    onDeposited,
    onWithdraw,
    onBack,
  } = props;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

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
        <Card>
          <View style={styles.headerRow}>
            <Text style={text.caption}>Balance</Text>
            {meetsMinimum ? (
              <Tag variant="ok" dot>
                Minimum met
              </Tag>
            ) : (
              <Tag variant="sunlit" dot>
                Below minimum
              </Tag>
            )}
          </View>

          <View style={styles.split}>
            <View style={styles.splitCell}>
              <Text style={styles.splitLabel}>Available</Text>
              <Text style={styles.metric}>{available}</Text>
            </View>
            <View style={styles.splitDivider} />
            <View style={styles.splitCell}>
              <Text style={styles.splitLabel}>Locked</Text>
              <Text style={styles.metric}>{locked}</Text>
            </View>
          </View>

          <View style={styles.hairline} />

          <View style={styles.equityRow}>
            <Text style={styles.equityLabel}>Total equity</Text>
            <Text style={styles.equityValue}>{equity}</Text>
          </View>

          <ProgressBar value={progress} tone={meetsMinimum ? "ok" : "accent"} />
          <Text style={styles.progressCaption}>
            {meetsMinimum ? "Ready to enroll" : `Deposit ${remaining} more`}
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button title="Open faucet" primary onPress={() => onOpenFaucet?.()} />
          <Button title="I've deposited" onPress={() => onDeposited?.()} />
        </View>

        <Card variant="muted" padding={spacing.md}>
          <Text style={text.caption}>How it works</Text>
          {HOW_IT_WORKS.map((line) => (
            <Text key={line} style={text.small}>
              {"· "}
              {line}
            </Text>
          ))}
        </Card>

        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setSheetOpen(true)}
          style={styles.withdraw}
        >
          <Text style={styles.withdrawLabel}>Withdraw funds</Text>
        </Pressable>
      </ScrollView>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Withdraw funds"
      >
        <Text style={styles.warning}>
          Withdrawals are signed by your wallet and cannot be undone. Check the
          address twice.
        </Text>
        <TextField
          label="Address"
          value={withdrawAddress}
          onChangeText={setWithdrawAddress}
          placeholder="0x…"
          mono
        />
        <TextField
          label="Amount"
          value={withdrawAmount}
          onChangeText={setWithdrawAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setSheetOpen(false);
            onWithdraw?.();
          }}
          style={({ pressed }) => [styles.confirm, pressed ? styles.pressed : null]}
        >
          <Text style={styles.confirmLabel}>Confirm withdrawal</Text>
        </Pressable>
        <Button title="Cancel" onPress={() => setSheetOpen(false)} />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  back: { alignSelf: "flex-start", paddingVertical: 4 },
  backText: { color: palette.graphite, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  confirm: {
    alignItems: "center",
    backgroundColor: palette.error,
    borderRadius: radii.button,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: "100%",
  },
  confirmLabel: { color: palette.onPrimary, fontSize: 14, fontWeight: "500", lineHeight: 20 },
  equityLabel: { color: palette.graphite, fontSize: 14, fontWeight: "400", lineHeight: 20 },
  equityRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  equityValue: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
  hairline: { backgroundColor: palette.border, height: 1, width: "100%" },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metric: {
    color: palette.ink,
    fontSize: 29,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.52,
    lineHeight: 35,
  },
  pressed: { opacity: 0.85 },
  progressCaption: { color: palette.ash, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  screen: { backgroundColor: palette.bg, flex: 1 },
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  split: { alignItems: "center", flexDirection: "row" },
  splitCell: { flex: 1, gap: 2 },
  splitDivider: { backgroundColor: palette.border, height: 40, width: 1 },
  splitLabel: {
    color: palette.slate,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.3,
    lineHeight: 14,
    textTransform: "uppercase",
  },
  tag: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagDot: { borderRadius: radii.pill, height: 6, width: 6 },
  tagLabel: { fontSize: 12, fontWeight: "500", lineHeight: 15 },
  warning: { color: palette.error, fontSize: 13, fontWeight: "500", lineHeight: 19 },
  withdraw: { alignItems: "center", paddingVertical: spacing.sm },
  withdrawLabel: { color: palette.error, fontSize: 14, fontWeight: "600", lineHeight: 20 },
});

export default FundScreen;
