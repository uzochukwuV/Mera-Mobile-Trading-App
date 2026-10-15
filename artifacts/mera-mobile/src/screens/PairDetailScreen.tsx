import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { coinColor } from "./coinMeta";
import {
  BG,
  BORDER,
  CARD,
  CARD_SOFT,
  DOWN,
  DOWN_SOFT,
  INK,
  MUTED,
  PAPER,
  RADIUS,
  SECONDARY,
  SHADOW_SOFT,
  TEAL,
  UP,
  UP_SOFT,
} from "./homeTheme";
import {
  getCandles,
  getMarketsCached,
  toMarketRow,
  type ApiCandle,
  type ApiMarket,
} from "../api";
import type { PairDetailProps, PositionRow } from "./types";

// Fixed mock trajectory — fallback until live candles arrive.
const CHART_LINE =
  "M0,72 L30,68 L60,70 L90,58 L120,60 L150,46 L180,50 L210,36 L240,40 L270,22 L300,18";

const TABS = ["Trades", "Orders"] as const;
type Tab = (typeof TABS)[number];

const INDICATORS = ["MA", "BOLL", "MACD", "VOL", "RSI"] as const;

const TIMEFRAMES = ["Live", "1H", "4H", "1D", "1W", "1M"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

const TIMEFRAME_PARAMS: Record<Timeframe, { resolution: number; hours: number }> = {
  Live: { resolution: 60, hours: 1 },
  "1H": { resolution: 60, hours: 1 },
  "4H": { resolution: 300, hours: 4 },
  "1D": { resolution: 900, hours: 24 },
  "1W": { resolution: 3600, hours: 168 },
  "1M": { resolution: 14400, hours: 720 },
};

function formatChange(changePct: number): string {
  return `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;
}

function formatCompactUsd(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const trim = (n: number): string =>
    String(Math.round(n * 10) / 10).replace(/\.0$/, "");
  if (abs >= 1_000_000_000) return `$${trim(value / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `$${trim(value / 1_000_000)}M`;
  if (abs >= 1_000) return `$${trim(value / 1_000)}K`;
  return `$${value.toFixed(2)}`;
}

/** Line path through candle closes in a 300x96 box. */
function closesToPath(closes: number[]): string | null {
  if (closes.length < 2) return null;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const step = 300 / (closes.length - 1);
  return closes
    .map((c, i) => {
      const x = (i * step).toFixed(1);
      const y = (88 - ((c - min) / span) * 80).toFixed(1);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

function PositionCard({ position }: { position: PositionRow }): ReactElement {
  const long = position.side === "Long";
  return (
    <View style={styles.row}>
      <View style={[styles.coin, { backgroundColor: coinColor(position.symbol) }]}>
        <Text style={styles.coinText}>{position.symbol.slice(0, 1)}</Text>
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle}>{position.symbol}</Text>
        <Text style={styles.rowDetail}>{position.size}</Text>
      </View>
      <View style={styles.rowRight}>
        <View
          style={[
            styles.pill,
            long ? styles.pillLong : styles.pillShort,
          ]}
        >
          <Text
            style={[
              styles.pillLabel,
              long ? styles.up : styles.down,
            ]}
          >
            {position.side}
          </Text>
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
    marketId,
    refreshToken = 0,
    symbol: symbolProp = "BTC",
    mark: markProp = "67,410.5",
    changePct: changeProp = 2.41,
    high: highProp = "68,900.0",
    low: lowProp = "65,120.3",
    openInterest: oiProp = "412M",
    volume: volumeProp = "1.2B",
    position = null,
    onBack,
    onCopyTrader,
    onTrade,
  } = props;

  const [tab, setTab] = useState<Tab>("Trades");
  const [timeframe, setTimeframe] = useState<Timeframe>("Live");
  const [market, setMarket] = useState<ApiMarket | null>(null);
  const [candles, setCandles] = useState<ApiCandle[] | null>(null);
  const [chartLoading, setChartLoading] = useState(marketId !== undefined);
  const [chartError, setChartError] = useState<string | null>(null);

  // Live header row for the selected market (public endpoint, no auth).
  useEffect(() => {
    if (marketId === undefined) return;
    let stale = false;
    getMarketsCached()
      .then((markets) => {
        if (stale) return;
        setMarket(markets.find((m) => m.market_id === marketId) ?? null);
      })
      .catch(() => {
        if (!stale) setMarket(null);
      });
    return () => {
      stale = true;
    };
  }, [marketId, refreshToken]);

  // Live candles for the active timeframe.
  useEffect(() => {
    if (marketId === undefined) return;
    let stale = false;
    setChartLoading(true);
    setChartError(null);
    const { resolution, hours } = TIMEFRAME_PARAMS[timeframe];
    getCandles(marketId, resolution, hours)
      .then((rows) => {
        if (stale) return;
        setCandles(rows);
      })
      .catch((caught: unknown) => {
        if (stale) return;
        setCandles(null);
        setChartError(
          caught instanceof Error ? caught.message : "Couldn't load chart",
        );
      })
      .finally(() => {
        if (!stale) setChartLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [marketId, timeframe, refreshToken]);

  const liveRow = market ? toMarketRow(market) : null;
  const symbol = market?.symbol ?? symbolProp;
  const mark = liveRow?.mark ?? markProp;
  const changePct = liveRow?.changePct ?? changeProp;
  const volume = liveRow?.volume ?? volumeProp;
  const candleHigh =
    candles && candles.length > 0
      ? Math.max(...candles.map((c) => c.h))
      : null;
  const candleLow =
    candles && candles.length > 0 ? Math.min(...candles.map((c) => c.l)) : null;
  const priceDecimals = market?.price_decimals ?? 2;
  const digits = Math.min(Math.max(priceDecimals, 2), 5);
  const high =
    candleHigh !== null
      ? candleHigh.toLocaleString("en-US", {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        })
      : highProp;
  const low =
    candleLow !== null
      ? candleLow.toLocaleString("en-US", {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        })
      : lowProp;
  const openInterest =
    market && market.open_interest !== null && liveRow
      ? formatCompactUsd(
          (Number(market.open_interest) / 10 ** market.size_decimals) *
            (Number(market.mark_price) / 10 ** market.price_decimals),
        )
      : oiProp;
  const closes = candles?.map((c) => c.c) ?? [];
  const liveLine = closesToPath(closes);
  const line = liveLine ?? CHART_LINE;
  const area = `${line} L300,96 L0,96 Z`;
  const up = changePct >= 0;
  const lineColor = up ? UP : DOWN;
  const stats: Array<{ label: string; value: string }> = [
    { label: "High", value: high },
    { label: "Low", value: low },
    { label: "24h volume", value: volume },
    { label: "Open interest", value: openInterest },
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
        style={styles.back}
      >
        <Ionicons name="chevron-back" size={20} color={SECONDARY} />
        <Text style={styles.backLabel}>Back</Text>
      </Pressable>

      <View style={styles.header}>
        <View
          style={[styles.coinLarge, { backgroundColor: coinColor(symbol) }]}
        >
          <Text style={styles.coinLargeText}>{symbol.slice(0, 1)}</Text>
        </View>
        <View style={styles.headerMain}>
          <Text style={styles.symbol}>{symbol} / USD</Text>
          <View style={styles.quoteRow}>
            <Text style={styles.mark}>{mark}</Text>
            <View style={[styles.pill, up ? styles.pillLong : styles.pillShort]}>
              <Text style={[styles.pillLabel, up ? styles.up : styles.down]}>
                {formatChange(changePct)}
              </Text>
            </View>
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

      <View style={styles.card}>
        {chartLoading && liveLine === null ? (
          <View style={styles.chartLoading}>
            <ActivityIndicator size="small" color={MUTED} />
          </View>
        ) : (
          <Svg
            accessibilityLabel="Price chart"
            viewBox="0 0 300 96"
            style={styles.chart}
          >
            <Path d={area} fill={lineColor} opacity={0.12} />
            <Path
              d={line}
              fill="none"
              stroke={lineColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
        {chartError && liveLine === null ? (
          <Text style={styles.chartCaption}>{chartError}</Text>
        ) : null}
        <View style={styles.chartMeta}>
          <Text style={styles.chartCaption}>H {high}</Text>
          <Text style={styles.chartCaption}>L {low}</Text>
        </View>
      </View>

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
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setTimeframe(item)}
              style={[styles.tfChip, active ? styles.tfActive : styles.tfIdle]}
            >
              {item === "Live" ? (
                <View
                  style={[
                    styles.liveDot,
                    { backgroundColor: active ? PAPER : UP },
                  ]}
                />
              ) : null}
              <Text
                style={[
                  styles.tfLabel,
                  active ? styles.tfLabelActive : null,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.card}>
        <View style={styles.grid}>
          {stats.map((cell) => (
            <View key={cell.label} style={styles.cell}>
              <Text style={styles.cellLabel}>{cell.label}</Text>
              <Text style={styles.cellValue}>{cell.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        {position != null ? (
          <PositionCard position={position} />
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No open position</Text>
          </View>
        )}
      </View>

      <Text style={styles.risk}>
        Perps are leveraged — you can lose your collateral.
      </Text>

      <View style={styles.directionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onTrade?.("long")}
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
          onPress={() => onTrade?.("short")}
          style={({ pressed }) => [
            styles.directionBlock,
            styles.shortBlock,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.directionLabel}>SHORT</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => onCopyTrader?.()}
        style={styles.copyWrap}
      >
        <Text style={styles.copyLabel}>Copy top trader instead →</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 2, paddingVertical: 4 },
  backLabel: { color: SECONDARY, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    gap: 10,
    padding: 16,
    ...SHADOW_SOFT,
  },
  cell: { flexBasis: "46%", flexGrow: 1, gap: 2, paddingVertical: 8 },
  cellLabel: { color: MUTED, fontSize: 11, fontWeight: "600", letterSpacing: 0.6, lineHeight: 14, textTransform: "uppercase" },
  cellValue: {
    color: INK,
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
  chart: { height: 120, width: "100%" },
  chartCaption: { color: MUTED, fontSize: 12, fontWeight: "500", lineHeight: 16 },
  chartLoading: {
    alignItems: "center",
    height: 120,
    justifyContent: "center",
    width: "100%",
  },
  chartMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  coin: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  coinText: { color: PAPER, fontSize: 17, fontWeight: "800" },
  coinLarge: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  coinLargeText: { color: PAPER, fontSize: 21, fontWeight: "800" },
  copyLabel: { color: TEAL, fontSize: 14, fontWeight: "600" },
  copyWrap: { alignItems: "center", paddingVertical: 6 },
  directionBlock: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    flex: 1,
    justifyContent: "center",
    minHeight: 56,
  },
  directionLabel: {
    color: PAPER,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  directionRow: { flexDirection: "row", gap: 10 },
  down: { color: DOWN },
  emptyText: { color: MUTED, fontSize: 13, fontWeight: "400", lineHeight: 19 },
  emptyWrap: {
    alignItems: "center",
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.card,
    padding: 14,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  header: { alignItems: "center", flexDirection: "row", gap: 12 },
  headerMain: { flex: 1, gap: 4 },
  indChip: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  indLabel: { color: SECONDARY, fontSize: 12, fontWeight: "600", lineHeight: 15 },
  liveDot: { borderRadius: RADIUS.pill, height: 6, width: 6 },
  longBlock: { backgroundColor: UP },
  mark: {
    color: INK,
    fontSize: 34,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
    lineHeight: 41,
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillLabel: { fontSize: 12, fontWeight: "700", lineHeight: 15 },
  pillLong: { backgroundColor: UP_SOFT },
  pillShort: { backgroundColor: DOWN_SOFT },
  pnl: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  pressed: { opacity: 0.85 },
  quoteRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  risk: { color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16, textAlign: "center" },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  rowDetail: { color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  rowMain: { flex: 1, gap: 2 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  rowTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 14, padding: 20, paddingBottom: 32 },
  segmented: {
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    padding: 4,
  },
  segment: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    flex: 1,
    paddingVertical: 8,
  },
  segmentActive: { backgroundColor: CARD },
  segmentLabel: { color: MUTED, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  segmentLabelActive: { color: INK, fontSize: 13, fontWeight: "700", lineHeight: 18 },
  shortBlock: { backgroundColor: DOWN },
  symbol: { color: INK, fontSize: 20, fontWeight: "800", letterSpacing: -0.4, lineHeight: 28 },
  tfActive: { backgroundColor: INK },
  tfChip: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tfIdle: { backgroundColor: CARD, borderColor: BORDER, borderWidth: 1 },
  tfLabel: { color: SECONDARY, fontSize: 12, fontWeight: "600", lineHeight: 15 },
  tfLabelActive: { color: PAPER },
  up: { color: UP },
});

export default PairDetailScreen;
