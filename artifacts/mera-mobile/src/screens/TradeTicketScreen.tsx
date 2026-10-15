import { useState, type ReactElement } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { coinColor } from "./coinMeta";
import {
  BG,
  BORDER,
  CARD,
  CARD_SOFT,
  DOWN,
  INK,
  MUTED,
  SECONDARY,
  UP,
} from "./homeTheme";
import type { TradeTicketProps } from "./types";

const LEVERAGE_PRESETS = [5, 10, 15, 20];

type MarginMode = "Market" | "Isolated";
const MARGIN_MODES: MarginMode[] = ["Market", "Isolated"];

export function TradeTicketScreen(props: TradeTicketProps): ReactElement {
  const {
    symbol = "BTC-PERP",
    mark = "67,410.5",
    balance,
    side = "long",
    size = "",
    leverage = 10,
    maxLeverage = 50,
    busy = false,
    error = null,
    notice = null,
    onSizeChange,
    onLeverageChange,
    onSubmit,
    onDryRun,
    onBack,
  } = props;

  const [marginMode, setMarginMode] = useState<MarginMode>("Market");
  const visiblePresets = LEVERAGE_PRESETS.filter((p) => p <= maxLeverage);
  const effectiveLeverage = Math.min(leverage, maxLeverage);

  const isLong = side === "long";
  const sideLabel = isLong ? "LONG" : "SHORT";
  const baseAsset = symbol.split("-")[0] ?? symbol;
  // Live notional from size × mark; fees are quoted server-side, unknown here.
  const markNum = Number(mark.replace(/,/g, ""));
  const sizeNum = Number(size);
  const tradeValue =
    Number.isFinite(markNum) &&
    markNum > 0 &&
    Number.isFinite(sizeNum) &&
    sizeNum > 0
      ? sizeNum * markNum
      : null;
  const confirmTitle = busy
    ? "Submitting…"
    : isLong
      ? "Buy Long"
      : "Sell Short";

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onBack?.()}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={20} color={SECONDARY} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>

        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <View
              style={[styles.coin, { backgroundColor: coinColor(symbol) }]}
            >
              <Text style={styles.coinText}>{symbol.slice(0, 1)}</Text>
            </View>
            <Text style={styles.title}>
              {symbol} · {sideLabel}
            </Text>
          </View>
          <Text style={styles.price}>{mark}</Text>
        </View>

        <View style={styles.ticket}>
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
                    active ? styles.chipActive : null,
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
            <View style={styles.leverageHead}>
              <Text style={styles.caption}>SELECT LEVERAGE</Text>
              <Text style={styles.leverageReadout}>{effectiveLeverage}X</Text>
            </View>
            <View style={styles.presets}>
              {visiblePresets.map((preset) => {
                const active = effectiveLeverage === preset;
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
            <Text style={styles.balance}>Max {maxLeverage}X on this market</Text>
          </View>

          <View style={styles.amountBlock}>
            <Text style={styles.caption}>AMOUNT TO TRADE ({baseAsset})</Text>
            <TextInput
              accessibilityLabel="Amount to trade"
              editable={!busy}
              keyboardType="decimal-pad"
              onChangeText={(value) => onSizeChange?.(value)}
              placeholder="0.00"
              placeholderTextColor={MUTED}
              style={styles.input}
              value={size}
            />
            <Text style={styles.balance}>
              Available balance: {balance ?? "—"} aUSD
            </Text>
          </View>

          <View style={styles.summary}>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Trade value</Text>
              <Text style={styles.kvValue}>
                {tradeValue === null
                  ? "--"
                  : `$${tradeValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
              </Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Fees</Text>
              <Text style={styles.kvValue}>--</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error.message}</Text>
            </View>
          ) : null}
          {notice ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={confirmTitle}
            disabled={busy}
            onPress={() => onSubmit?.()}
            style={({ pressed }) => [
              styles.confirm,
              isLong ? styles.longBlock : styles.shortBlock,
              busy || pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.confirmLabel}>{confirmTitle}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dry run"
            disabled={busy}
            onPress={() => onDryRun?.()}
            style={({ pressed }) => [
              styles.dryRun,
              busy || pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.dryRunLabel}>Dry run</Text>
          </Pressable>
        </View>

        <Text style={styles.lifecycle}>
          Market IOC · Worker executes in ~1s · pending → filled
        </Text>
      </ScrollView>
    </View>
  );
}

const cardElevation = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.07,
  shadowRadius: 18,
  elevation: 3,
} as const;

const styles = StyleSheet.create({
  amountBlock: { gap: 8 },
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 2, paddingVertical: 4 },
  backLabel: { color: SECONDARY, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  balance: { color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  caption: { color: MUTED, fontSize: 11, fontWeight: "600", letterSpacing: 1, lineHeight: 14 },
  chip: {
    alignItems: "center",
    borderRadius: 9999,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 10,
  },
  chipActive: { backgroundColor: CARD, ...cardElevation },
  chipActiveLabel: { color: INK, fontSize: 13, fontWeight: "700", lineHeight: 18 },
  chipIdleLabel: { color: MUTED, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  chips: {
    backgroundColor: CARD_SOFT,
    borderRadius: 9999,
    flexDirection: "row",
    gap: 2,
    padding: 4,
  },
  coin: {
    alignItems: "center",
    borderRadius: 9999,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  coinText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  confirm: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 56,
    width: "100%",
  },
  confirmLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", lineHeight: 20 },
  dryRun: {
    alignItems: "center",
    backgroundColor: CARD_SOFT,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 52,
    width: "100%",
  },
  dryRunLabel: { color: INK, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  errorCard: {
    backgroundColor: "rgba(217, 45, 32, 0.08)",
    borderColor: "rgba(217, 45, 32, 0.30)",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  errorText: { color: DOWN, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  noticeCard: {
    backgroundColor: "rgba(23, 138, 76, 0.10)",
    borderColor: "rgba(23, 138, 76, 0.30)",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  noticeText: { color: UP, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  input: {    backgroundColor: BG,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    color: INK,
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  kvLabel: { color: MUTED, fontSize: 13, fontWeight: "400", lineHeight: 18 },
  summary: {
    backgroundColor: BG,
    borderRadius: 14,
    gap: 8,
    padding: 12,
  },
  kvRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  kvValue: {
    color: INK,
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  leverageBlock: { gap: 8 },
  leverageHead: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leverageReadout: {
    color: INK,
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  lifecycle: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
    textAlign: "center",
  },
  longBlock: { backgroundColor: UP },
  preset: {
    alignItems: "center",
    borderRadius: 9999,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 10,
  },
  presetActive: { backgroundColor: INK },
  presetActiveLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", fontVariant: ["tabular-nums"] },
  presetIdle: { backgroundColor: CARD_SOFT },
  presetIdleLabel: { color: SECONDARY, fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] },
  presets: { flexDirection: "row", gap: 8 },
  pressed: { opacity: 0.6 },
  price: {
    color: INK,
    fontSize: 30,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 14, padding: 20, paddingBottom: 32 },
  shortBlock: { backgroundColor: DOWN },
  ticket: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 16,
    ...cardElevation,
  },
  title: { color: INK, fontSize: 20, fontWeight: "800", letterSpacing: -0.4, lineHeight: 28 },
  titleBlock: { gap: 4 },
  titleRow: { alignItems: "center", flexDirection: "row", gap: 10 },
});

export default TradeTicketScreen;
