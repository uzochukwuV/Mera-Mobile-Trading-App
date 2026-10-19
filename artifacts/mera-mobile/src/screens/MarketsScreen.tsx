import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { coinColor, coinName } from "./coinMeta";
import { Seek } from "./Seek";
import { ApiError, getMarketsCached, toMarketRow } from "../api";
import { ReactElement, useCallback, useEffect, useState } from "react";
import { BG, BORDER, CARD, DOWN, FONT, INDIGO_SOFT, INK, MUTED, PAPER, RADIUS, SECONDARY, TEAL, UP } from "./homeTheme";
import { MarketRow, MarketsProps } from "./types";

type Scope = "mine" | "all";

function formatChange(changePct: number): string {
  return `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;
}

export function MarketsScreen(props: MarketsProps = {}): ReactElement {
  const { markets: marketsOverride, heldSymbols, search = "", refreshToken = 0, onSearchChange, onSelectMarket } = props;
  const [scope, setScope] = useState<Scope>("all");
  const [sortDesc, setSortDesc] = useState(true);
  // The screen owns the query when nobody above it does. Every
  // caller used to pass `search` through, and none of them passed
  // `onSearchChange`, so the field was permanently empty — a
  // controlled input with no controller.
  const [localSearch, setLocalSearch] = useState(search);
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);
  const { width: windowWidth } = useWindowDimensions();
  const seekWidth = Math.min(320, Math.max(200, windowWidth - 40));
  const [remote, setRemote] = useState<MarketRow[] | null>(
    marketsOverride ?? null,
  );
  const [loading, setLoading] = useState(marketsOverride === undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean): Promise<void> => {
    if (marketsOverride !== undefined) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const markets = await getMarketsCached();
      setRemote(markets.map(toMarketRow));
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Couldn't load markets",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [marketsOverride]);

  useEffect(() => {
    void load(false);
  }, [load, refreshToken]);

  const rows = marketsOverride ?? remote ?? [];
  const query = localSearch.trim().toUpperCase();

  const visible = rows
    .filter((row) =>
      // Live holdings from the dashboard; unknown (never loaded) shows all.
      scope === "mine" && heldSymbols !== undefined
        ? heldSymbols.includes(row.symbol.toUpperCase())
        : true,
    )
    .filter((row) =>
      query.length === 0
        ? true
        : row.symbol.toUpperCase().includes(query) ||
          coinName(row.symbol).toUpperCase().includes(query),
    )
    .sort((a, b) => (sortDesc ? b.changePct - a.changePct : a.changePct - b.changePct));

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Markets</Text>
        {visible.length > 0 ? (
          <View style={styles.count}>
            <Text style={styles.countLabel}>{visible.length}</Text>
          </View>
        ) : null}
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={SECONDARY}
            />
          }
        >
          <View style={styles.seekRow}>
            <Seek
              accessibilityLabel="Search tokens"
              onChangeText={(value) => {
                setLocalSearch(value);
                onSearchChange?.(value);
              }}
              value={localSearch}
              width={seekWidth}
            />
          </View>

          <View style={styles.chipsRow}>
            <Pressable
              accessibilityLabel="Sort by change"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setSortDesc((desc) => !desc)}
              style={({ pressed }) => [
                styles.circleButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Ionicons name="swap-vertical" size={20} color={SECONDARY} />
            </Pressable>
            <Pressable
              accessibilityLabel="My Assets"
              accessibilityRole="button"
              accessibilityState={{ selected: scope === "mine" }}
              hitSlop={8}
              onPress={() => setScope("mine")}
              style={({ pressed }) => [
                styles.pill,
                scope === "mine" ? styles.pillActive : styles.pillIdle,
                pressed ? styles.pressed : null,
              ]}
            >
              <Ionicons
                name="flame"
                size={16}
                color={scope === "mine" ? INK : MUTED}
              />
              <Text
                style={
                  scope === "mine" ? styles.pillActiveLabel : styles.pillIdleLabel
                }
              >
                My Assets
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="All Tokens"
              accessibilityRole="button"
              accessibilityState={{ selected: scope === "all" }}
              hitSlop={8}
              onPress={() => setScope("all")}
              style={({ pressed }) => [
                styles.pill,
                scope === "all" ? styles.pillActive : styles.pillIdle,
                pressed ? styles.pressed : null,
              ]}
            >
              <Ionicons
                name="layers-outline"
                size={16}
                color={scope === "all" ? INK : MUTED}
              />
              <Text
                style={
                  scope === "all" ? styles.pillActiveLabel : styles.pillIdleLabel
                }
              >
                All Tokens
              </Text>
            </Pressable>
          </View>

          <View style={styles.list}>
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={INK} />
                <Text style={styles.emptyBody}>Loading live markets…</Text>
              </View>
            ) : error && visible.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Couldn't load markets</Text>
                <Text style={styles.emptyBody}>{error}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void load(false)}
                  style={({ pressed }) => [
                    styles.retry,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={styles.retryLabel}>Try again</Text>
                </Pressable>
              </View>
            ) : visible.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No tokens found</Text>
                <Text style={styles.emptyBody}>
                  Try a different search or filter.
                </Text>
              </View>
            ) : (
              visible.map((row, index) => {
                const up = row.changePct >= 0;
                return (
                  <View key={row.id}>
                    {index > 0 ? <View style={styles.hairline} /> : null}
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onSelectMarket?.(row.id, row.symbol)}
                      style={({ pressed }) => [
                        styles.row,
                        pressed ? styles.pressed : null,
                      ]}
                    >
                      <View
                        style={[
                          styles.coin,
                          { backgroundColor: coinColor(row.symbol) },
                        ]}
                      >
                        <Text style={styles.coinText}>
                          {row.symbol.slice(0, 1)}
                        </Text>
                      </View>
                      <View style={styles.rowMain}>
                        <Text style={styles.name}>
                          {coinName(row.symbol)}{" "}
                          <Text style={styles.symbol}>{row.symbol}</Text>
                        </Text>
                        <Text style={styles.volume}>Vol {row.volume}</Text>
                      </View>
                      <View style={styles.rowRight}>
                        <Text style={styles.mark}>{row.mark}</Text>
                        <Text
                          style={[
                            styles.change,
                            up ? styles.up : styles.down,
                          ]}
                        >
                          {formatChange(row.changePct)}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  change: { fontFamily: FONT, fontSize: 12, fontWeight: "400", lineHeight: 15 },
  circleActive: { borderColor: INK },
  circleButton: {
    alignItems: "center",
    backgroundColor: CARD,
    borderColor: "transparent",
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  seekRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  chipsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  count: {
    alignItems: "center",
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 28,
    minWidth: 28,
    paddingHorizontal: 8,
  },
  countLabel: { fontFamily: FONT, color: SECONDARY, fontSize: 13, fontWeight: "400" },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitle: { fontFamily: FONT, color: INK, fontSize: 26, fontWeight: "400", lineHeight: 32 },
  coin: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  coinText: { fontFamily: FONT, color: PAPER, fontSize: 18, fontWeight: "400" },
  down: { color: DOWN },
  empty: { gap: 4, padding: 8 },
  emptyBody: { fontFamily: FONT, color: MUTED, fontSize: 13, lineHeight: 19 },
  emptyTitle: { fontFamily: FONT, color: INK, fontSize: 15, fontWeight: "400", lineHeight: 22 },
  hairline: { backgroundColor: BORDER, height: 1, width: "100%" },
  list: { paddingHorizontal: 24 },
  loading: { alignItems: "center", gap: 12, paddingVertical: 48 },
  mark: {
    color: INK,
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: "400",
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
  name: { fontFamily: FONT, color: INK, fontSize: 16, fontWeight: "400", lineHeight: 21 },
  pill: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pillActive: { backgroundColor: INDIGO_SOFT },
  pillActiveLabel: { fontFamily: FONT, color: INK, fontSize: 13, fontWeight: "400" },
  pillIdle: { backgroundColor: "transparent" },
  pillIdleLabel: { fontFamily: FONT, color: SECONDARY, fontSize: 13, fontWeight: "400" },
  pressed: { opacity: 0.85 },
  retry: {
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: RADIUS.pill,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryLabel: { fontFamily: FONT, color: INK, fontSize: 14, fontWeight: "400" },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 16,
  },
  rowMain: { flex: 1, gap: 4 },
  rowRight: { alignItems: "flex-end", gap: 4 },
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 12, paddingBottom: 28 },
  searchInput: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    color: INK,
    fontFamily: FONT,
    fontSize: 15,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  symbol: { fontFamily: FONT, color: SECONDARY, fontSize: 14, fontWeight: "400" },
  up: { color: UP },
  volume: { fontFamily: FONT, color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
});

export default MarketsScreen;
