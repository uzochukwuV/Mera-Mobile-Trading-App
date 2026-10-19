// One market, read once.
//
// THE SHAPE OF THE SCREEN IS THE ORDER YOU READ IT IN: who it is, what
// it costs, the line and its volume, the numbers behind the line, what
// you already hold, then the two ways to act. One hero surface — the
// chart — and everything under it flat on the canvas, separated by
// hairlines rather than stacked into a tower of cards. A card is
// elevation; using it for a five-cell table is decoration.
//
// Two things were deleted rather than restyled: a Trades/Orders
// segmented control that owned no state and switched nothing, and a row
// of MA/BOLL/MACD/VOL/RSI chips that were not wired to anything. Dead
// controls are the most expensive kind of "worked".

import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import {
  ApiCandle,
  ApiMarket,
  getCandles,
  getMarketsCached,
  toMarketRow,
} from "../api";
import {
  BORDER,
  CARD,
  FONT,
  INK,
  MUTED,
  PAPER,
  RADIUS,
  SECONDARY,
} from "./homeTheme";
import { PriceChart } from "./PriceChart";
import { QuoteHeader } from "./QuoteHeader";
import { StackBar, StackedBars } from "./StackedBars";
import type { PairDetailProps, PositionRow } from "./types";

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

/** One cell of the spec sheet: label over value, hairline between. */
function Spec({
  label,
  value,
  divider = false,
}: {
  label: string;
  value: string;
  divider?: boolean;
}): ReactElement {
  return (
    <View style={[styles.spec, divider ? styles.specDivider : null]}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

function PositionPanel({ position }: { position: PositionRow }): ReactElement {
  return (
    <View style={styles.posRow}>
      <View style={styles.posDisc}>
        <Text style={styles.posDiscText}>{position.symbol.slice(0, 1)}</Text>
      </View>
      <View style={styles.posMain}>
        <Text style={styles.posTitle}>{position.symbol}</Text>
        <Text style={styles.posDetail}>
          {position.side}
          {` · ${position.size}`}
          {position.mark !== undefined ? ` @ ${position.mark}` : ""}
        </Text>
      </View>
      <View style={styles.posRight}>
        <Text
          style={[styles.posPnl, position.pnlUp ? null : styles.posPnlDown]}
        >
          {position.pnl}
        </Text>
        <Text style={styles.posPnlLabel}>UNREALISED</Text>
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
    candles && candles.length > 0 ? Math.max(...candles.map((c) => c.h)) : null;
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

  // ── volume, from the same candles the line is drawn from ──
  // Fourteen buckets, each split by the side the candle closed on.
  // Nothing here is invented: a bucket is the sum of the volume of the
  // candles in it, and "up" means close ≥ open.
  const volumeBars: StackBar[] = (() => {
    const src = candles ?? [];
    if (src.length < 4) return [];
    const buckets = Math.min(14, src.length);
    const size = Math.max(1, Math.ceil(src.length / buckets));
    const out: StackBar[] = [];
    for (let i = 0; i < src.length; i += size) {
      const slice = src.slice(i, i + size);
      let bought = 0;
      let sold = 0;
      for (const c of slice) {
        // `v` arrives as a STRING, in micro-USD. Adding the strings
        // concatenates — one bucket came out at 1e49 and every other
        // bar flattened to its floor. Coerce, then scale to dollars
        // so the readout agrees with the market row's 24h volume.
        const usd = (Number(c.v) || 0) / 1e6;
        if (c.c >= c.o) bought += usd;
        else sold += usd;
      }
      const stamp = slice[slice.length - 1]?.t ?? 0;
      const d = new Date(stamp > 1e12 ? stamp : stamp * 1000);
      out.push({
        label: `${String(d.getHours()).padStart(2, "0")}:${String(
          d.getMinutes(),
        ).padStart(2, "0")}`,
        values: [bought, sold],
      });
    }
    return out;
  })();

  const chartFailed = candles === null && !chartLoading && chartError !== null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => onBack?.()}
        style={styles.back}
      >
        <Ionicons name="chevron-back" size={20} color={SECONDARY} />
        <Text style={styles.backLabel}>Back</Text>
      </Pressable>

      <QuoteHeader
        changePct={changePct}
        loading={market === null && marketId !== undefined && !liveRow}
        mark={mark}
        symbol={symbol}
        window="24H"
      />

      {/* ── the hero: one surface, three readings ───────────── */}
      <View style={styles.hero}>
        <View style={styles.heroChart}>
          {chartFailed ? (
            <Text style={styles.chartError}>{chartError}</Text>
          ) : (
            <PriceChart
              candles={candles}
              digits={digits}
              height={180}
              loading={chartLoading}
            />
          )}
        </View>

        {volumeBars.length > 0 ? (
          <View style={styles.volume}>
            <StackedBars
              bars={volumeBars}
              caption="VOLUME · BUYS / SELLS"
              generation={TIMEFRAMES.indexOf(timeframe)}
              height={36}
            />
          </View>
        ) : null}

        <View style={styles.tfRow}>
          {TIMEFRAMES.map((item) => {
            const active = item === timeframe;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setTimeframe(item)}
                style={styles.tf}
              >
                <Text
                  style={[styles.tfLabel, active ? styles.tfLabelActive : null]}
                >
                  {item.toUpperCase()}
                </Text>
                <View style={[styles.tfBar, active ? styles.tfBarOn : null]} />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── the numbers behind the line, as a spec sheet ─────── */}
      <View style={styles.specs}>
        <View style={styles.specRow}>
          <Spec label="MARK" value={mark} />
          <Spec divider label="24H HIGH" value={high} />
        </View>
        <View style={styles.specRow}>
          <Spec label="24H LOW" value={low} />
          <Spec divider label="24H VOLUME" value={volume} />
        </View>
        <View style={[styles.specRow, styles.specRowLast]}>
          <Spec label="OPEN INTEREST" value={openInterest} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>POSITION</Text>
        {position != null ? (
          <PositionPanel position={position} />
        ) : (
          <Text style={styles.empty}>No open position on this market.</Text>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onTrade?.("long")}
          style={({ pressed }) => [
            styles.action,
            styles.actionLong,
            pressed ? styles.pressed : null,
          ]}
        >
          <Ionicons name="arrow-up" size={16} color={PAPER} />
          <Text style={styles.actionLabelLong}>Long</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onTrade?.("short")}
          style={({ pressed }) => [
            styles.action,
            styles.actionShort,
            pressed ? styles.pressed : null,
          ]}
        >
          <Ionicons name="arrow-down" size={16} color={INK} />
          <Text style={styles.actionLabelShort}>Short</Text>
        </Pressable>
      </View>

      <Text style={styles.risk}>
        Perps are leveraged — you can lose your collateral.
      </Text>

      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => onCopyTrader?.()}
        style={styles.copyWrap}
      >
        <Ionicons name="people-outline" size={16} color={SECONDARY} />
        <Text style={styles.copyLabel}>Copy top traders instead</Text>
        <Ionicons name="chevron-forward" size={16} color={MUTED} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    height: 52,
    justifyContent: "center",
  },
  actionLabelLong: {
    color: PAPER,
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 20,
  },
  actionLabelShort: {
    color: INK,
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 20,
  },
  actionLong: { backgroundColor: INK },
  actionShort: {
    backgroundColor: PAPER,
    borderColor: INK,
    borderWidth: 1,
  },
  actions: { flexDirection: "row", gap: 12 },
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
  chartError: {
    color: SECONDARY,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 20,
    paddingVertical: 48,
    textAlign: "center",
  },
  copyLabel: {
    color: INK,
    flex: 1,
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  copyWrap: {
    alignItems: "center",
    borderTopColor: BORDER,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 8,
    paddingVertical: 16,
  },
  empty: {
    color: SECONDARY,
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  hero: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    overflow: "hidden",
  },
  heroChart: { paddingHorizontal: 16, paddingTop: 12 },
  posDetail: {
    color: SECONDARY,
    fontFamily: FONT,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    lineHeight: 18,
  },
  posDisc: {
    alignItems: "center",
    backgroundColor: PAPER,
    borderColor: BORDER,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  posDiscText: {
    color: INK,
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 20,
  },
  posMain: { flex: 1, gap: 2 },
  posPnl: {
    color: INK,
    fontFamily: FONT,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    lineHeight: 20,
  },
  posPnlDown: { color: SECONDARY },
  posPnlLabel: {
    color: MUTED,
    fontFamily: FONT,
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 0.6,
    lineHeight: 14,
  },
  posRight: { alignItems: "flex-end", gap: 2 },
  posRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  posTitle: {
    color: INK,
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 20,
  },
  spec: { flex: 1, gap: 2, paddingVertical: 12 },
  specDivider: {
    borderLeftColor: BORDER,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingLeft: 16,
  },
  specLabel: {
    color: MUTED,
    fontFamily: FONT,
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 0.6,
    lineHeight: 14,
  },
  specRow: {
    borderBottomColor: BORDER,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
  },
  specRowLast: { borderBottomWidth: 0 },
  specs: { borderTopColor: BORDER, borderTopWidth: StyleSheet.hairlineWidth },
  specValue: {
    color: INK,
    fontFamily: FONT,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    lineHeight: 20,
  },
  pressed: { opacity: 0.7 },
  risk: {
    color: MUTED,
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    textAlign: "center",
  },
  screen: { backgroundColor: "transparent", flex: 1 },
  scroll: { gap: 20, padding: 20, paddingBottom: 32 },
  section: { gap: 12 },
  sectionLabel: {
    color: MUTED,
    fontFamily: FONT,
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 0.6,
    lineHeight: 14,
  },
  tf: { alignItems: "center", gap: 6, paddingTop: 4 },
  tfBar: { backgroundColor: "transparent", borderRadius: 1, height: 2 },
  tfBarOn: { backgroundColor: INK },
  tfLabel: {
    color: SECONDARY,
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 0.6,
    lineHeight: 16,
  },
  tfLabelActive: { color: INK },
  tfRow: {
    borderTopColor: BORDER,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
  },
  volume: {
    borderTopColor: BORDER,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default PairDetailScreen;
