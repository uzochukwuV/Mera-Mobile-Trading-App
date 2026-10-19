// The quote header every market screen opens with.
//
// WHO IT IS, WHAT IT COSTS, WHICH WAY IT MOVED — one unit, three sizes,
// and not one pixel of brand colour. The disc is a marker, not a
// sticker: a market's brand colour is an index (you scan the list by
// it), so it belongs in the list and nowhere you are reading a single
// pair. Here the number is the only thing allowed to be large.
//
// The direction is carried by an arrow and the ink, not a hue: a rise
// is the primary voice, a fall is the hushed one. Nothing on this
// screen should compete with the one action below it.

import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { ReactElement } from "react";

import { BORDER, FONT, INK, PAPER, RADIUS, SECONDARY } from "./homeTheme";

export type QuoteHeaderProps = {
  /** "BTC-PERP" or "BTC" — anything before the first dash is the ticker */
  symbol: string;
  /** the market's kind, shown beside the ticker */
  kind?: string;
  /** the mark price, already formatted */
  mark: string;
  /** signed change over the window, in percent */
  changePct: number;
  /** window the change is measured over */
  window?: string;
  loading?: boolean;
};

export function QuoteHeader({
  symbol,
  kind = "PERP",
  mark,
  changePct,
  window = "24H",
  loading = false,
}: QuoteHeaderProps): ReactElement {
  const ticker = symbol.split("-")[0] || symbol;
  const up = changePct >= 0;
  const color = up ? INK : SECONDARY;

  return (
    <View style={styles.wrap}>
      <View style={styles.disc}>
        <Text style={styles.discText}>{ticker.slice(0, 1)}</Text>
      </View>

      <View style={styles.main}>
        <Text style={styles.ticker} numberOfLines={1}>
          {ticker}
          {`  ·  ${kind}`}
        </Text>
        <Text style={[styles.price, loading ? styles.priceIdle : null]}>
          {loading ? "—" : mark}
        </Text>
        <View style={styles.moveRow}>
          <Ionicons
            name={up ? "arrow-up" : "arrow-down"}
            size={13}
            color={color}
          />
          <Text style={[styles.move, { color }]}>
            {`${up ? "+" : ""}${changePct.toFixed(2)}%`}
          </Text>
          <Text style={styles.period}>{window}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: {
    alignItems: "center",
    backgroundColor: PAPER,
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
  main: { flex: 1, gap: 2 },
  move: {
    fontFamily: FONT,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    lineHeight: 18,
  },
  moveRow: { alignItems: "center", flexDirection: "row", gap: 4 },
  period: {
    color: SECONDARY,
    fontFamily: FONT,
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 0.6,
    lineHeight: 14,
  },
  price: {
    color: INK,
    fontFamily: FONT,
    fontSize: 40,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  priceIdle: { color: SECONDARY },
  ticker: {
    color: INK,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.4,
    lineHeight: 18,
    textTransform: "uppercase",
  },
  wrap: { alignItems: "flex-start", flexDirection: "row", gap: 12 },
});

export default QuoteHeader;
