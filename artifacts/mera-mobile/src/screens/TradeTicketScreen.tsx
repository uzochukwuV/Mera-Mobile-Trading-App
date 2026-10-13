import { useState, type ReactElement } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../Button";
import { Card, TextField } from "../ui";
import { palette, radii, spacing, text } from "../theme";
import type { TradeTicketProps } from "./types";

const LEVERAGE_PRESETS = [5, 10, 15, 20];

type MarginMode = "Market" | "Isolated";
const MARGIN_MODES: MarginMode[] = ["Market", "Isolated"];

export function TradeTicketScreen(props: TradeTicketProps): ReactElement {
  const {
    symbol = "BTC-PERP",
    mark = "67,410.5",
    side = "long",
    size = "",
    leverage = 10,
    maxLeverage = 20,
    busy = false,
    error = null,
    onSideChange,
    onSizeChange,
    onLeverageChange,
    onSubmit,
    onDryRun,
    onBack,
  } = props;
  void maxLeverage;
  void onSideChange;

  const [marginMode, setMarginMode] = useState<MarginMode>("Market");

  const isLong = side === "long";
  const sideLabel = isLong ? "LONG" : "SHORT";
  const confirmTitle = busy
    ? "Submitting…"
    : isLong
      ? "Buy Long"
      : "Sell Short";

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => onBack?.()}
          >
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
        </View>

        <View style={styles.titleBlock}>
          <Text style={text.title}>
            {symbol} · {sideLabel}
          </Text>
          <Text style={styles.price}>{mark}</Text>
        </View>

        <Card style={styles.ticket}>
          <View style={styles.chips}>
            {MARGIN_MODES.map((mode) => {
              const active = marginMode === mode;
              return (
                <Pressable
                  key={mode}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setMarginMode(mode)}
                  style={[
                    styles.chip,
                    active ? styles.chipActive : styles.chipIdle,
                  ]}
                >
                  <Text
                    style={
                      active ? styles.chipActiveLabel : styles.chipIdleLabel
                    }
                  >
                    {mode}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.leverageBlock}>
            <Text style={text.caption}>Select leverage</Text>
            <Text style={styles.leverageReadout}>{leverage}X</Text>
            <View style={styles.presets}>
              {LEVERAGE_PRESETS.map((preset) => {
                const active = leverage === preset;
                return (
                  <Pressable
                    key={preset}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => onLeverageChange?.(preset)}
                    style={[
                      styles.preset,
                      active ? styles.presetActive : styles.presetIdle,
                    ]}
                  >
                    <Text
                      style={
                        active
                          ? styles.presetActiveLabel
                          : styles.presetIdleLabel
                      }
                    >
                      {preset}X
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.amountBlock}>
            <TextField
              label="Amount to trade"
              keyboardType="decimal-pad"
              onChangeText={(value) => onSizeChange?.(value)}
              placeholder="0.00"
              value={size}
            />
            <Text style={styles.balance}>
              Available balance: 0.00 aUSD
            </Text>
          </View>

          <Card variant="muted" padding={spacing.md}>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Trade value</Text>
              <Text style={styles.kvValue}>--</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Fees</Text>
              <Text style={styles.kvValue}>--</Text>
            </View>
          </Card>

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error.message}</Text>
            </View>
          ) : null}

          {isLong ? (
            <Button
              title={confirmTitle}
              primary
              disabled={busy}
              onPress={() => onSubmit?.()}
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => onSubmit?.()}
              style={({ pressed }) => [
                styles.shortBlock,
                pressed ? styles.pressed : null,
                busy ? styles.disabled : null,
              ]}
            >
              <Text style={styles.shortLabel}>{confirmTitle}</Text>
            </Pressable>
          )}
          <Button title="Dry run" onPress={() => onDryRun?.()} />
        </Card>

        <Text style={styles.lifecycle}>
          Market IOC · Worker executes in ~1s · pending → filled
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  amountBlock: { gap: spacing.xxs },
  back: {
    color: palette.graphite,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  balance: {
    color: palette.ash,
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
  },
  chip: {
    alignItems: "center",
    borderRadius: radii.pill,
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  chipActive: { backgroundColor: palette.surfaceStrong },
  chipActiveLabel: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  chipIdle: { backgroundColor: palette.surfaceMuted },
  chipIdleLabel: {
    color: palette.slate,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  chips: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xxs,
    padding: spacing.xxs,
  },
  disabled: { opacity: 0.45 },
  errorCard: {
    backgroundColor: palette.errorSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  errorText: {
    color: palette.error,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  headerRow: { alignItems: "flex-start" },
  kvLabel: {
    color: palette.slate,
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
  },
  kvRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  kvValue: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  leverageBlock: { gap: spacing.xs },
  leverageReadout: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.37,
    lineHeight: 31,
  },
  lifecycle: {
    color: palette.ash,
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
    textAlign: "center",
  },
  preset: {
    alignItems: "center",
    borderRadius: radii.pill,
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.xs,
  },
  presetActive: { backgroundColor: palette.accentSoft },
  presetActiveLabel: {
    color: palette.sky,
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  presetIdle: { backgroundColor: palette.surfaceMuted },
  presetIdleLabel: {
    color: palette.slate,
    fontSize: 13,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  presets: { flexDirection: "row", gap: spacing.xs },
  pressed: { opacity: 0.85 },
  price: {
    color: palette.text,
    fontSize: 29,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.52,
    lineHeight: 35,
  },
  screen: { backgroundColor: palette.bg, flex: 1 },
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  shortBlock: {
    alignItems: "center",
    backgroundColor: palette.error,
    borderRadius: radii.lg,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: "100%",
  },
  shortLabel: {
    color: palette.onPrimary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  ticket: { padding: spacing.lg },
  titleBlock: { gap: 2 },
});

export default TradeTicketScreen;
