import type { ReactElement } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TopFilterBar } from "./TabChrome";
import { tintForName } from "./coinMeta";
import {
  BG,
  BORDER,
  CARD,
  DOWN,
  INK,
  MUTED,
  SECONDARY,
  SHEET,
  UP,
} from "./homeTheme";
import type { DiscoverProps } from "./types";

const SORT_OPTIONS = ["PnL", "24h", "Win rate", "Sharpe", "Followers"] as const;

export function DiscoverScreen(props: DiscoverProps): ReactElement {
  const {
    leaders = [],
    sort = "PnL",
    loading = false,
    loadError = null,
    refreshing = false,
    onRefresh,
    onSortChange,
    onSelectTrader,
  } = props;
  const selected = sort ?? "PnL";
  const isEmpty = leaders.length === 0;

  return (
    <View style={styles.screen}>
      <TopFilterBar />
      <View style={styles.sheet}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={SECONDARY}
              />
            ) : undefined
          }
        >
          <Text style={styles.title}>Traders</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {SORT_OPTIONS.map((option) => {
              const active = selected === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => onSortChange?.(option)}
                  style={({ pressed }) => [
                    styles.chip,
                    active ? styles.chipActive : styles.chipInactive,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text
                    style={active ? styles.chipActiveLabel : styles.chipInactiveLabel}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {loading && isEmpty ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={INK} />
              <Text style={styles.emptyBody}>Loading traders…</Text>
            </View>
          ) : loadError && isEmpty ? (
            <View style={styles.loading}>
              <Text style={styles.emptyTitle}>Couldn't load traders</Text>
              <Text style={styles.emptyBody}>{loadError}</Text>
              {onRefresh ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onRefresh}
                  style={({ pressed }) => [
                    styles.retry,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={styles.retryLabel}>Try again</Text>
                </Pressable>
              ) : null}
            </View>
          ) : isEmpty ? (
            <View style={styles.loading}>
              <Text style={styles.emptyTitle}>No traders yet</Text>
              <Text style={styles.emptyBody}>
                Check back once traders publish profiles.
              </Text>
            </View>
          ) : (
          <View style={styles.list}>
            {leaders.map((row, index) => {
              const tint = tintForName(row.handle);
              return (
                <View key={row.id}>
                  {index > 0 ? <View style={styles.hairline} /> : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onSelectTrader?.(row.id)}
                    style={({ pressed }) => [
                      styles.row,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.rank}>{index + 1}</Text>
                    <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
                      <Text style={[styles.avatarText, { color: tint.fg }]}>
                        {row.handle.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.rowMain}>
                      <Text style={styles.handle}>{row.handle}</Text>
                      <Text style={styles.followers}>
                        {row.followers} followers
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text
                        style={[
                          styles.pnl,
                          row.pnlUp ? styles.up : styles.down,
                        ]}
                      >
                        {row.pnl30d}
                      </Text>
                      <Text style={styles.winRate}>{row.winRate} win</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={MUTED} />
                  </Pressable>
                </View>
              );
            })}
          </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    borderRadius: 9999,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  avatarText: { fontSize: 17, fontWeight: "700" },
  chip: {
    alignItems: "center",
    borderRadius: 9999,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipActive: { backgroundColor: INK },
  chipActiveLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", lineHeight: 18 },
  chipInactive: { backgroundColor: CARD },
  chipInactiveLabel: { color: SECONDARY, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  chips: { flexDirection: "row", gap: 8, paddingHorizontal: 20 },
  down: { color: DOWN },
  emptyBody: { color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center" },
  emptyTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 22, textAlign: "center" },
  followers: { color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  hairline: { backgroundColor: BORDER, height: 1, width: "100%" },
  handle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  list: { marginHorizontal: 20 },
  loading: { alignItems: "center", gap: 12, paddingVertical: 48 },
  pnl: {
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
  pressed: { opacity: 0.85 },
  rank: { color: MUTED, fontSize: 13, fontWeight: "600", width: 20 },
  retry: {
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 9999,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryLabel: { color: INK, fontSize: 14, fontWeight: "600" },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
  },
  rowMain: { flex: 1, gap: 2 },
  rowRight: { alignItems: "flex-end", gap: 2 },
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 12, paddingBottom: 28, paddingTop: 6 },
  sheet: {
    backgroundColor: SHEET,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
    overflow: "hidden",
    paddingTop: 12,
  },
  title: {
    color: INK,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 30,
    paddingHorizontal: 20,
  },
  up: { color: UP },
  winRate: { color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
});

export default DiscoverScreen;
