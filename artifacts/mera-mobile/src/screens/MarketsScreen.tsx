import { useState } from "react";
import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, TextField } from "../ui";
import { palette, radii, spacing, text } from "../theme";
import type { MarketRow, MarketsProps } from "./types";

const DEFAULT_MARKETS: MarketRow[] = [
  { id: 1, symbol: "BTC", mark: "67,410.5", changePct: 2.41, volume: "1.2B" },
  { id: 2, symbol: "ETH", mark: "3,512.8", changePct: -1.12, volume: "890M" },
  { id: 3, symbol: "SOL", mark: "172.44", changePct: 4.87, volume: "410M" },
  { id: 4, symbol: "MON", mark: "5.42", changePct: 1.05, volume: "96M" },
  { id: 5, symbol: "ZEC", mark: "58.20", changePct: -0.64, volume: "32M" },
];

const CATEGORIES = ["All", "Hot", "New"] as const;
type Category = (typeof CATEGORIES)[number];

function formatChange(changePct: number): string {
  return `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;
}

function filterByCategory(markets: MarketRow[], category: Category): MarketRow[] {
  if (category === "Hot") return markets.filter((row) => Math.abs(row.changePct) >= 1);
  if (category === "New") return markets.filter((row) => row.id >= 4);
  return markets;
}

export function MarketsScreen(props: MarketsProps = {}): ReactElement {
  const {
    markets = DEFAULT_MARKETS,
    search = "",
    onSearchChange,
    onSelectMarket,
  } = props;
  const [category, setCategory] = useState<Category>("All");
  const visible = filterByCategory(markets, category);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Markets</Text>
      <TextField
        placeholder="Search markets"
        value={search ?? ""}
        onChangeText={onSearchChange ?? (() => {})}
      />
      <View style={styles.chipsRow}>
        {CATEGORIES.map((item) => {
          const active = item === category;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setCategory(item)}
              style={({ pressed }) => [
                styles.chip,
                active ? styles.chipActive : styles.chipInactive,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={active ? styles.chipLabelActive : styles.chipLabelInactive}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Card style={styles.list} padding={spacing.sm}>
        {visible.length === 0 ? (
          <Text style={text.caption}>No markets found</Text>
        ) : (
          visible.map((row, index) => {
            const up = row.changePct >= 0;
            return (
              <View key={row.id}>
                {index > 0 ? <View style={styles.hairline} /> : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onSelectMarket?.(row.id)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <View style={styles.coin}>
                    <Text style={styles.coinText}>
                      {row.symbol.slice(0, 1)}
                    </Text>
                  </View>
                  <View style={styles.rowMain}>
                    <View style={styles.symbolRow}>
                      <Text style={styles.symbol}>{row.symbol}</Text>
                      <View style={styles.levTag}>
                        <Text style={styles.levLabel}>{`${row.id * 5}x`}</Text>
                      </View>
                    </View>
                    <Text style={styles.volume}>Vol {row.volume}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.mark}>{row.mark}</Text>
                    <View
                      style={[
                        styles.pill,
                        up ? styles.pillUp : styles.pillDown,
                      ]}
                    >
                      <Text style={styles.pillLabel}>
                        {formatChange(row.changePct)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            );
          })
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: palette.ink },
  chipInactive: { backgroundColor: palette.surfaceMuted },
  chipLabelActive: {
    color: palette.bg,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 15,
  },
  chipLabelInactive: {
    color: palette.graphite,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 15,
  },
  chipsRow: { flexDirection: "row", gap: spacing.xs },
  coin: {
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  coinText: { color: palette.ink, fontSize: 15, fontWeight: "600" },
  hairline: { backgroundColor: palette.border, height: 1, width: "100%" },
  levLabel: {
    color: palette.warning,
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
  },
  levTag: {
    backgroundColor: palette.warningSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  list: { gap: 0 },
  mark: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
  pill: {
    alignSelf: "flex-end",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillDown: { backgroundColor: palette.error },
  pillLabel: {
    color: palette.textInverse,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 15,
  },
  pillUp: { backgroundColor: palette.forest },
  pressed: { opacity: 0.85 },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowMain: { flex: 1, gap: 2 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  screen: {
    backgroundColor: palette.bg,
    flex: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  symbol: { color: palette.ink, fontSize: 14, fontWeight: "600", lineHeight: 19 },
  symbolRow: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  title: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.37,
    lineHeight: 31,
  },
  volume: { color: palette.slate, fontSize: 12, fontWeight: "400", lineHeight: 16 },
});

export default MarketsScreen;
