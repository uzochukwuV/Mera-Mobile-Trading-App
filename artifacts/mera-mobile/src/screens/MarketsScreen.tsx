import { useCallback, useEffect, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiError, getMarketsCached, toMarketRow } from "../api";
import { TopFilterBar } from "./TabChrome";
import { coinColor, coinName } from "./coinMeta";
import {
  BG,
  BORDER,
  CARD,
  DOWN,
  INK,
  MUTED,
  SECONDARY,
  SHEET,
  TEAL,
  UP,
} from "./homeTheme";
import type { MarketRow, MarketsProps } from "./types";

type Scope = "mine" | "all";

function formatChange(changePct: number): string {
  return `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;
}

export function MarketsScreen(props: MarketsProps = {}): ReactElement {
  const { markets: marketsOverride, heldSymbols, search = "", refreshToken = 0, onSearchChange, onSelectMarket } = props;
  const [scope, setScope] = useState<Scope>("mine");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortDesc, setSortDesc] = useState(true);
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
  const query = (search ?? "").trim().toUpperCase();

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
      <TopFilterBar
        onSearch={() => setSearchOpen((open) => !open)}
        onStocks={() => setScope("all")}
        onMoreMarkets={() => setScope("all")}
      />
      <View style={styles.sheet}>
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
          <View style={styles.chipsRow}>
            <Pressable
              accessibilityLabel="Search tokens"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setSearchOpen((open) => !open)}
              style={({ pressed }) => [
                styles.circleButton,
                searchOpen ? styles.circleActive : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Ionicons
                name="search"
                size={20}
                color={searchOpen ? TEAL : SECONDARY}
              />
            </Pressable>
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
                color={scope === "mine" ? TEAL : MUTED}
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
                color={scope === "all" ? TEAL : MUTED}
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

          {searchOpen ? (
            <TextInput
              accessibilityLabel="Search tokens"
              autoFocus
              onChangeText={onSearchChange ?? (() => {})}
              placeholder="Search tokens"
              placeholderTextColor={MUTED}
              style={styles.searchInput}
              value={search ?? ""}
            />
          ) : null}

          <View style={styles.list}>
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={TEAL} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  change: { fontSize: 12, fontWeight: "500", lineHeight: 15 },
  circleActive: { borderColor: TEAL },
  circleButton: {
    alignItems: "center",
    backgroundColor: CARD,
    borderColor: "transparent",
    borderRadius: 9999,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  chipsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  coin: {
    alignItems: "center",
    borderRadius: 9999,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  coinText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  down: { color: DOWN },
  empty: { gap: 4, padding: 8 },
  emptyBody: { color: MUTED, fontSize: 13, lineHeight: 19 },
  emptyTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 22 },
  hairline: { backgroundColor: BORDER, height: 1, width: "100%" },
  list: { paddingHorizontal: 24 },
  loading: { alignItems: "center", gap: 12, paddingVertical: 48 },
  mark: {
    color: INK,
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
  name: { color: INK, fontSize: 16, fontWeight: "700", lineHeight: 21 },
  pill: {
    alignItems: "center",
    borderRadius: 9999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pillActive: { backgroundColor: "rgba(94, 234, 212, 0.12)" },
  pillActiveLabel: { color: TEAL, fontSize: 13, fontWeight: "600" },
  pillIdle: { backgroundColor: "transparent" },
  pillIdleLabel: { color: SECONDARY, fontSize: 13, fontWeight: "500" },
  pressed: { opacity: 0.85 },
  retry: {
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 9999,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryLabel: { color: TEAL, fontSize: 14, fontWeight: "600" },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
  },
  rowMain: { flex: 1, gap: 3 },
  rowRight: { alignItems: "flex-end", gap: 4 },
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 12, paddingBottom: 28 },
  searchInput: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    color: INK,
    fontSize: 15,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sheet: {
    backgroundColor: SHEET,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
    overflow: "hidden",
    paddingTop: 12,
  },
  symbol: { color: SECONDARY, fontSize: 14, fontWeight: "500" },
  up: { color: UP },
  volume: { color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
});

export default MarketsScreen;
