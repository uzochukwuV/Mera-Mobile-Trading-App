// The ticket is a form, so it is built like one.
//
// ONE SURFACE, THREE QUESTIONS, IN THE ORDER YOU ASK THEM: which way,
// how much, how hard. Everything else on the card is a reading that
// answers back — notional, margin, fees — and the single action sits
// outside the card in the accent, because a fill that means "commit"
// should not have to compete with the fill of a chip.
//
// The direction is a segmented choice rather than two slabs of colour.
// Long and short are the same size, the same weight and the same
// distance from your thumb; the arrow and the word say which one you
// are in, and no hue is spent implying that one of them is "up".

import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import {
  AMBER_SOFT,
  BORDER,
  CARD,
  CARD_SOFT,
  FONT,
  INDIGO,
  INK,
  MUTED,
  ON_ACCENT,
  PAPER,
  RADIUS,
  SECONDARY,
} from "./homeTheme";
import { LiquidToggle } from "./LiquidToggle";
import { SlideConfirm } from "./SlideConfirm";
import { ToastStack, useToasts } from "./ToastStack";
import type { TradeTicketProps } from "./types";

// A ladder, not a fixed list: BTC on testnet caps near 6x, and the old
// [5, 10, 15, 20] left a single 5X chip and no way to pick the actual
// maximum. The ladder is filtered to what this market allows and the
// cap is always appended, so the last chip is the real ceiling. When
// more than four survive, the lowest are dropped — four is what fits a
// row without shrinking the targets below a thumb.
function leveragePresets(maxLeverage: number): number[] {
  const cap = Math.floor(maxLeverage);
  if (cap < 1) return [];
  const ladder = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
  const picks = [...ladder.filter((preset) => preset < cap), cap];
  while (picks.length > 4) picks.shift();
  return picks;
}

const QUICK_FILLS = [
  { label: "25%", share: 0.25 },
  { label: "50%", share: 0.5 },
  { label: "75%", share: 0.75 },
  { label: "MAX", share: 1 },
] as const;

type MarginMode = "Market" | "Isolated";

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactElement {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

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
    onSideChange,
    onSizeChange,
    onLeverageChange,
    onSubmit,
    onDryRun,
    onBack,
  } = props;

  const { toasts, push, dismiss } = useToasts();
  const [marginMode, setMarginMode] = useState<MarginMode>("Market");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (notice) push({ title: notice, tone: "ok" });
  }, [notice, push]);

  const effectiveLeverage = Math.min(leverage, maxLeverage);
  const visiblePresets = leveragePresets(maxLeverage);

  const isLong = side === "long";
  const ticker = symbol.split("-")[0] ?? symbol;
  const confirmTitle = busy ? "Submitting…" : isLong ? "Buy Long" : "Sell Short";

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
  const margin =
    tradeValue !== null && effectiveLeverage > 0
      ? tradeValue / effectiveLeverage
      : null;

  // The size a full balance buys at this leverage, and the four shares of
  // it the quick fills hand back. Same arithmetic a desk would do — and
  // it is a maximum, so the label says Max.
  const balanceNum = Number((balance ?? "").replace(/,/g, ""));
  const maxSize =
    Number.isFinite(balanceNum) && balanceNum > 0 && markNum > 0
      ? (balanceNum * effectiveLeverage) / markNum
      : null;

  const usd = (value: number): string =>
    `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  const formatSize = (value: number): string =>
    String(Number(value.toFixed(6)));

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

        <View style={styles.headRow}>
          <View style={styles.disc}>
            <Text style={styles.discText}>{ticker.slice(0, 1)}</Text>
          </View>
          <View style={styles.headMain}>
            <Text style={styles.headTicker}>{ticker}-PERP</Text>
            <Text style={styles.meta}>PERP · MARKET IOC</Text>
          </View>
          <View style={styles.headRight}>
            <Text style={styles.headMark}>{mark}</Text>
            <Text style={styles.meta}>MARK</Text>
          </View>
        </View>

        <View style={styles.card}>
          {/* ── which way ─────────────────────────────────────── */}
          <View style={styles.sideTrack}>
            {(["long", "short"] as const).map((option) => {
              const active = side === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => onSideChange?.(option)}
                  style={[styles.sideSeg, active ? styles.sideSegOn : null]}
                >
                  <Ionicons
                    name={option === "long" ? "arrow-up" : "arrow-down"}
                    size={14}
                    color={active ? PAPER : SECONDARY}
                  />
                  <Text
                    style={[
                      styles.sideLabel,
                      active ? styles.sideLabelOn : null,
                    ]}
                  >
                    {option === "long" ? "Long" : "Short"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── how much ──────────────────────────────────────── */}
          <View style={styles.field}>
            <View style={styles.fieldHead}>
              <Text style={styles.label}>AMOUNT</Text>
              <Text style={styles.label}>{ticker}</Text>
            </View>
            <TextInput
              accessibilityLabel="Amount to trade"
              editable={!busy}
              keyboardType="decimal-pad"
              onBlur={() => setFocused(false)}
              onChangeText={(value) => onSizeChange?.(value)}
              onFocus={() => setFocused(true)}
              placeholder="0"
              placeholderTextColor={MUTED}
              style={styles.amount}
              value={size}
            />
            <View
              style={[styles.fieldRule, focused ? styles.fieldRuleOn : null]}
            />
            <View style={styles.fieldFoot}>
              <Text style={styles.hint}>
                {tradeValue === null ? "— notional" : `${usd(tradeValue)} notional`}
              </Text>
              <Text style={styles.hint}>
                {balance === undefined ? "— available" : `${balance} aUSD available`}
              </Text>
            </View>
            <View style={styles.quickRow}>
              {QUICK_FILLS.map((fill) => {
                const disabled = maxSize === null || busy;
                return (
                  <Pressable
                    key={fill.label}
                    accessibilityRole="button"
                    accessibilityLabel={`Fill ${fill.label} of maximum size`}
                    disabled={disabled}
                    onPress={() => {
                      if (maxSize === null) return;
                      onSizeChange?.(formatSize(maxSize * fill.share));
                    }}
                    style={({ pressed }) => [
                      styles.quick,
                      disabled ? styles.quickDisabled : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.quickLabel}>{fill.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {maxSize !== null ? (
              <Text style={styles.hint}>
                {`Max ~${formatSize(maxSize)} ${ticker} at ${effectiveLeverage}X`}
              </Text>
            ) : null}
          </View>

          <View style={styles.rule} />

          {/* ── how hard ──────────────────────────────────────── */}
          <View style={styles.block}>
            <View style={styles.blockHead}>
              <Text style={styles.label}>LEVERAGE</Text>
              <Text style={styles.blockValue}>{effectiveLeverage}X</Text>
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
            <Text style={styles.hint}>{`Max ${maxLeverage}X on this market`}</Text>
          </View>

          <View style={styles.rule} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleMain}>
              <Text style={styles.label}>MARGIN</Text>
              <Text style={styles.hint}>
                {marginMode === "Isolated"
                  ? "Isolated to this position"
                  : "Shared across positions"}
              </Text>
            </View>
            <View style={styles.toggleWrap}>
              <LiquidToggle
                accessibilityLabel="Margin mode"
                left="Market"
                onChange={(isolated) =>
                  setMarginMode(isolated ? "Isolated" : "Market")
                }
                right="Isolated"
                value={marginMode === "Isolated"}
              />
            </View>
          </View>

          <View style={styles.rule} />

          {/* ── the reading back ──────────────────────────────── */}
          <View style={styles.summary}>
            <SummaryRow
              label="Trade value"
              value={tradeValue === null ? "—" : usd(tradeValue)}
            />
            <SummaryRow
              label="Margin (est.)"
              value={margin === null ? "—" : usd(margin)}
            />
            <SummaryRow label="Fees" value="—" />
          </View>
        </View>

        {error ? (
          <View style={styles.warn}>
            <Ionicons name="alert-circle-outline" size={16} color={INK} />
            <Text style={styles.warnText}>{error.message}</Text>
          </View>
        ) : null}

        {/* The one place the accent is spent: the thing you commit. */}
        <SlideConfirm
          contrast={ON_ACCENT}
          disabled={busy}
          ink={INDIGO}
          label={confirmTitle}
          onConfirm={() => onSubmit?.()}
        />
        <Pressable
          accessibilityLabel="Dry run"
          accessibilityRole="button"
          disabled={busy}
          onPress={() => onDryRun?.()}
          style={({ pressed }) => [
            styles.dryRun,
            busy || pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.dryRunLabel}>Dry run</Text>
        </Pressable>

        <Text style={styles.lifecycle}>
          MARKET IOC · WORKER EXECUTES IN ~1S · PENDING → FILLED
        </Text>
      </ScrollView>
      <ToastStack onDismiss={dismiss} toasts={toasts} />
    </View>
  );
}

const styles = StyleSheet.create({
  amount: {
    color: INK,
    fontFamily: FONT,
    fontSize: 36,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    letterSpacing: -0.8,
    lineHeight: 44,
    padding: 0,
  },
  back: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    paddingVertical: 4,
  },
  backLabel: {
    color: SECONDARY,
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 20,
  },
  block: { gap: 12 },
  blockHead: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  blockValue: {
    color: INK,
    fontFamily: FONT,
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    gap: 20,
    padding: 16,
  },
  disc: {
    alignItems: "center",
    backgroundColor: CARD_SOFT,
    borderColor: BORDER,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  discText: {
    color: INK,
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 20,
  },
  dryRun: {
    alignItems: "center",
    backgroundColor: PAPER,
    borderColor: BORDER,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: "100%",
  },
  dryRunLabel: {
    color: INK,
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 20,
  },
  field: { gap: 8 },
  fieldFoot: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  fieldHead: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fieldRule: {
    backgroundColor: BORDER,
    height: 1,
  },
  fieldRuleOn: { backgroundColor: INK },
  headMain: { flex: 1, gap: 2 },
  headMark: {
    color: INK,
    fontFamily: FONT,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    lineHeight: 20,
  },
  headRight: { alignItems: "flex-end", gap: 2 },
  headRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  headTicker: {
    color: INK,
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 20,
  },
  hint: {
    color: MUTED,
    fontFamily: FONT,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    lineHeight: 16,
  },
  label: {
    color: MUTED,
    fontFamily: FONT,
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 0.6,
    lineHeight: 14,
  },
  lifecycle: {
    color: MUTED,
    fontFamily: FONT,
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 0.6,
    lineHeight: 14,
    textAlign: "center",
  },
  meta: {
    color: MUTED,
    fontFamily: FONT,
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 0.6,
    lineHeight: 14,
  },
  preset: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    flex: 1,
    height: 40,
    justifyContent: "center",
  },
  presetActive: { backgroundColor: INK },
  presetActiveLabel: {
    color: PAPER,
    fontFamily: FONT,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    lineHeight: 18,
  },
  presetIdle: { backgroundColor: CARD_SOFT },
  presetIdleLabel: {
    color: SECONDARY,
    fontFamily: FONT,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    lineHeight: 18,
  },
  presets: { flexDirection: "row", gap: 8 },
  pressed: { opacity: 0.7 },
  quick: {
    alignItems: "center",
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.pill,
    flex: 1,
    height: 32,
    justifyContent: "center",
  },
  quickDisabled: { opacity: 0.4 },
  quickLabel: {
    color: SECONDARY,
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  quickRow: { flexDirection: "row", gap: 8 },
  rule: { backgroundColor: BORDER, height: StyleSheet.hairlineWidth },
  screen: { backgroundColor: "transparent", flex: 1 },
  scroll: { gap: 20, padding: 20, paddingBottom: 32 },
  sideLabel: {
    color: SECONDARY,
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  sideLabelOn: { color: PAPER },
  sideSeg: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    height: 40,
    justifyContent: "center",
  },
  sideSegOn: { backgroundColor: INK },
  sideTrack: {
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  summary: { gap: 8 },
  summaryLabel: {
    color: SECONDARY,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryValue: {
    color: INK,
    fontFamily: FONT,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    lineHeight: 18,
  },
  toggleMain: { flex: 1, gap: 2 },
  toggleRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  toggleWrap: { width: 168 },
  warn: {
    alignItems: "flex-start",
    backgroundColor: AMBER_SOFT,
    borderRadius: RADIUS.input,
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  warnText: {
    color: INK,
    flex: 1,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
  },
});

export default TradeTicketScreen;
