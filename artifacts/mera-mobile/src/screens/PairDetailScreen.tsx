import { useState } from "react";
import type { ReactElement } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { LinkButton } from "../Button";
import { Card } from "../ui";
import { palette, radii, spacing } from "../theme";
import type { PairDetailProps, PositionRow } from "./types";

// Fixed mock trajectory — UI-only, no data fetching.
const CHART_LINE =
  "M0,72 L30,68 L60,70 L90,58 L120,60 L150,46 L180,50 L210,36 L240,40 L270,22 L300,18";
const CHART_AREA = `${CHART_LINE} L300,96 L0,96 Z`;

const TABS = ["Trades", "Orders"] as const;
type Tab = (typeof TABS)[number];

const INDICATORS = ["MA", "BOLL", "MACD", "VOL", "RSI"] as const;

const TIMEFRAMES = ["Live", "1H", "4H", "1D", "1W", "1M"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

function formatChange(changePct: number): string {
  return `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;
}

function PositionCard({ position }: { position: PositionRow }): ReactElement {
  const long = position.side === "Long";
  return (
    <View style={styles.row}>
      <View style={styles.coin}>
        <Text style={styles.coinText}>{position.symbol.slice(0, 1)}</Text>
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle}>{position.symbol}</Text>
        <Text style={styles.rowDetail}>{position.size}</Text>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.pill, long ? styles.pillLong : styles.pillShort]}>
          <Text style={styles.pillLabel}>{position.side}</Text>
        </View>
        <Text style={[styles.pnl, position.pnlUp ? styles.up : styles.down]}>
          {position.pnl}
        </Text>
      </View>
    </View>
  );
}

export function PairDetailScreen(props: PairDetailProps = {}): ReactElement {
  const {
    symbol = "BTC",
    mark = "67,410.5",
    changePct = 2.41,
    high = "68,900.0",
    low = "65,120.3",
    funding = "0.0100%",
    openInterest = "412M",
    volume = "1.2B",
    position = null,
    onBack,
    onCopyTrader,
    onTrade,
  } = props;

  const [tab, setTab] = useState<Tab>("Trades");
  const [timeframe, setTimeframe] = useState<Timeframe>("Live");
  const up = changePct >= 0;
  const lineColor = up ? palette.forest : palette.error;
  const stats: Array<{ label: string; value: string }> = [
    { label: "High", value: high },
    { label: "Low", value: low },
    { label: "24h volume", value: volume },
    { label: "Open interest", value: openInterest },
    { label: "Funding", value: funding },
    { label: "Mark", value: mark },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scroll}
    >
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => onBack?.()}
      >
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.symbol}>{symbol}</Text>
        <View style={styles.quoteRow}>
          <Text style={styles.mark}>{mark}</Text>
          <View style={[styles.pill, up ? styles.pillLong : styles.pillShort]}>
            <Text style={styles.pillLabel}>{formatChange(changePct)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.segmented}>
        {TABS.map((item) => {
          const active = item === tab;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(item)}
              style={[styles.segment, active ? styles.segmentActive : null]}
            >
              <Text style={active ? styles.segmentLabelActive : styles.segmentLabel}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card>
        <Svg
          accessibilityLabel="Price chart"
          viewBox="0 0 300 96"
          style={styles.chart}
        >
          <Path d={CHART_AREA} fill={lineColor} opacity={0.08} />
          <Path
            d={CHART_LINE}
            fill="none"
            stroke={lineColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <View style={styles.chartMeta}>
          <Text style={styles.chartCaption}>H {high}</Text>
          <Text style={styles.chartCaption}>L {low}</Text>
        </View>
      </Card>

      <View style={styles.chipsRow}>
        {INDICATORS.map((item) => (
          <View key={item} style={styles.indChip}>
            <Text style={styles.indLabel}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.chipsRow}>
        {TIMEFRAMES.map((item) => {
          const active = item === timeframe;
          const live = item === "Live";
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setTimeframe(item)}
              style={[
                styles.tfChip,
                live ? styles.tfLive : styles.tfIdle,
                !live && active ? styles.tfSelected : null,
              ]}
            >
              {live ? <View style={styles.liveDot} /> : null}
              <Text
                style={[
                  styles.tfLabel,
                  live || active ? styles.tfLabelActive : null,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.statsCard} padding={spacing.sm}>
        <View style={styles.grid}>
          {stats.map((cell, index) => (
            <View
              key={cell.label}
              style={[
                styles.cell,
                index % 2 === 0 ? styles.cellLeft : styles.cellRight,
                index >= stats.length - 2 ? styles.cellLastRow : null,
              ]}
            >
              <Text style={styles.cellLabel}>{cell.label}</Text>
              <Text style={styles.cellValue}>{cell.value}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        {position != null ? (
          <PositionCard position={position} />
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No open position</Text>
          </View>
        )}
      </Card>

      <Text style={styles.risk}>
        Perps are leveraged — you can lose your collateral.
      </Text>

      <View style={styles.directionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onTrade?.()}
          style={({ pressed }) => [
            styles.directionBlock,
            styles.longBlock,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.directionLabel}>LONG</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onTrade?.()}
          style={({ pressed }) => [
            styles.directionBlock,
            styles.shortBlock,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.directionLabel}>SHORT</Text>
        </Pressable>
      </View>

      <View style={styles.copyWrap}>
        <LinkButton
          title="Copy top trader instead"
          onPress={() => onCopyTrader?.()}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  back: { color: palette.graphite, fontSize: 14, fontWeight: "500" },
  cell: { flex: 1, gap: 2, paddingVertical: spacing.sm },
  cellLabel: { color: palette.graphite, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  cellLastRow: { borderBottomWidth: 0 },
  cellLeft: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    borderRightColor: palette.border,
    borderRightWidth: 1,
    paddingRight: spacing.sm,
  },
  cellRight: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    paddingLeft: spacing.sm,
  },
  cellValue: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
  chart: { height: 96, width: "100%" },
  chartCaption: { color: palette.slate, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  chartMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  coin: {
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  coinText: { color: palette.ink, fontSize: 15, fontWeight: "600" },
  copyWrap: { alignItems: "center" },
  directionBlock: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    minHeight: 56,
  },
  directionLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  directionRow: { flexDirection: "row", gap: spacing.xs },
  down: { color: palette.down },
  emptyText: { color: palette.slate, fontSize: 13, fontWeight: "400", lineHeight: 19 },
  emptyWrap: {
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  header: { gap: 4 },
  indChip: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  indLabel: {
    color: palette.graphite,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 15,
  },
  liveDot: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.full,
    height: 6,
    width: 6,
  },
  longBlock: { backgroundColor: "#6D5EF0" },
  mark: {
    color: palette.ink,
    fontSize: 29,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.52,
    lineHeight: 35,
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillLabel: {
    color: palette.textInverse,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 15,
  },
  pillLong: { backgroundColor: palette.forest },
  pillShort: { backgroundColor: palette.error },
  pnl: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  pressed: { opacity: 0.85 },
  quoteRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  risk: { color: palette.slate, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  rowDetail: { color: palette.slate, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  rowMain: { flex: 1, gap: 2 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  rowTitle: { color: palette.ink, fontSize: 14, fontWeight: "600", lineHeight: 19 },
  screen: { backgroundColor: palette.bg, flex: 1 },
  scroll: { gap: spacing.md, padding: spacing.md },
  segmented: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.pill,
    flexDirection: "row",
    padding: 4,
  },
  segment: {
    alignItems: "center",
    borderRadius: radii.pill,
    flex: 1,
    paddingVertical: 8,
  },
  segmentActive: { backgroundColor: palette.surfaceStrong },
  segmentLabel: {
    color: palette.slate,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 15,
  },
  segmentLabelActive: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 15,
  },
  shortBlock: { backgroundColor: palette.error },
  statsCard: { gap: 0 },
  symbol: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.37,
    lineHeight: 31,
  },
  tfChip: {
    alignItems: "center",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tfIdle: { backgroundColor: palette.surfaceMuted },
  tfLabel: {
    color: palette.graphite,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 15,
  },
  tfLabelActive: {
    color: palette.textInverse,
  },
  tfLive: { backgroundColor: palette.forest },
  tfSelected: { backgroundColor: palette.surfaceStrong },
  up: { color: palette.up },
});

export default PairDetailScreen;
