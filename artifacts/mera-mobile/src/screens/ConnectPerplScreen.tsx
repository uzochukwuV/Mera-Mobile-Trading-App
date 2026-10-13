import type { ReactElement, ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, LinkButton } from "../Button";
import { Card } from "../ui";
import { palette, radii, spacing, text } from "../theme";
import type { ConnectPerplProps } from "./types";

const STEPS = ["1 Payload", "2 Sign", "3 Confirm"] as const;

function truncate(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

type TagVariant = "done" | "active" | "todo" | "soft";

function Tag({ variant, children }: { variant: TagVariant; children: ReactNode }) {
  const style = tagStyles[variant];
  return (
    <View style={[styles.tag, style.container]}>
      <Text style={[styles.tagLabel, style.label]}>{children}</Text>
    </View>
  );
}

const tagStyles = {
  done: {
    container: { backgroundColor: palette.okSoft },
    label: { color: palette.forest },
  },
  active: {
    container: { backgroundColor: palette.ink },
    label: { color: palette.bg },
  },
  todo: {
    container: { backgroundColor: palette.surfaceMuted },
    label: { color: palette.graphite },
  },
  soft: {
    container: { backgroundColor: palette.sunlitCream },
    label: { color: palette.emberBrown },
  },
} as const;

export function ConnectPerplScreen(props: ConnectPerplProps): ReactElement {
  const {
    address = "0x1234…abcd",
    step = 1,
    error = null,
    busy = false,
    onEnroll,
    onImport,
    onGoFund,
    onRetry,
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
          <Text style={styles.backLabel}>‹ Back</Text>
        </Pressable>

        <View style={styles.heading}>
          <Text style={text.title}>Connect trading</Text>
          <Text style={text.small}>Enroll one wallet to copy trades.</Text>
        </View>

        <View style={styles.steps}>
          {STEPS.map((label, index) => {
            const n = (index + 1) as 1 | 2 | 3;
            const variant: TagVariant = n < step ? "done" : n === step ? "active" : "todo";
            const prefix = n < step ? "✓ " : "";
            return (
              <Tag key={label} variant={variant}>
                {`${prefix}${label}`}
              </Tag>
            );
          })}
        </View>

        <Card>
          <Text style={text.caption}>Wallet</Text>
          <View style={styles.walletRow}>
            <Text style={styles.mono}>{truncate(address)}</Text>
            <Tag variant="soft">EIP-712</Tag>
          </View>
          <Card variant="muted" padding={spacing.md}>
            <Text style={text.small}>
              Sign once with your passkey. No seed phrase leaves this device.
            </Text>
          </Card>
        </Card>

        {error ? (
          <View style={styles.errorCard}>
            {error.code ? <Text style={styles.errorCode}>{error.code}</Text> : null}
            <Text style={styles.errorMessage}>{error.message}</Text>
            <LinkButton title="Try again" onPress={() => onRetry?.()} />
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            title={busy ? "Waiting for passkey…" : "Enroll this wallet"}
            primary
            disabled={busy}
            onPress={() => onEnroll?.()}
          />
          <Button title="Import existing key" onPress={() => onImport?.()} />
          <LinkButton title="I haven't funded yet →" onPress={() => onGoFund?.()} />
        </View>

        <Text style={styles.footnote}>
          Builder fees are injected server-side per fill.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { alignItems: "center", gap: spacing.sm },
  back: { alignSelf: "flex-start", paddingVertical: 4 },
  backLabel: { color: palette.graphite, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  errorCard: {
    backgroundColor: palette.errorSoft,
    borderRadius: radii.lg,
    gap: spacing.xs,
    padding: spacing.md,
  },
  errorCode: {
    color: palette.error,
    fontFamily: "Menlo",
    fontSize: 12,
    lineHeight: 14,
  },
  errorMessage: { color: palette.graphite, fontSize: 13, fontWeight: "400", lineHeight: 19 },
  footnote: { color: palette.ash, fontSize: 12, fontWeight: "400", lineHeight: 16, textAlign: "center" },
  heading: { gap: 4 },
  mono: {
    color: palette.text,
    flex: 1,
    fontFamily: "Menlo",
    fontSize: 13,
    lineHeight: 18,
  },
  screen: { backgroundColor: palette.bg, flex: 1 },
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  steps: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  tag: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagLabel: { fontSize: 12, fontWeight: "500", lineHeight: 15 },
  walletRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
});

export default ConnectPerplScreen;
