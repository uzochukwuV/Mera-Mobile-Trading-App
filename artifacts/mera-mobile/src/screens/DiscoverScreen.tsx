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
import { tintForName } from "./coinMeta";
import {
  BG,
  BORDER,
  CARD,
  DOWN,
  INK,
  MUTED,
  PAPER,
  RADIUS,
  SECONDARY,
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Traders</Text>
        {leaders.length > 0 ? (
          <View style={styles.count}>
            <Text style={styles.countLabel}>{leaders.length}</Text>
          </View>
        ) : null}
      </View>
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
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  avatarText: { fontSize: 17, fontWeight: "700" },
  chip: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipActive: { backgroundColor: INK },
  chipActiveLabel: { color: PAPER, fontSize: 13, fontWeight: "700", lineHeight: 18 },
  chipInactive: { backgroundColor: CARD },
  chipInactiveLabel: { color: SECONDARY, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  chips: { flexDirection: "row", gap: 8, paddingHorizontal: 20 },
  down: { color: DOWN },
  emptyBody: { color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center" },
  emptyTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 22, textAlign: "center" },
  followers: { color: MUTED, fontSize: 13, fontWeight: "400", lineHeight: 19 },
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
    borderRadius: RADIUS.pill,
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
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitle: { color: INK, fontSize: 26, fontWeight: "700", lineHeight: 32 },
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
  countLabel: { color: SECONDARY, fontSize: 13, fontWeight: "700" },
  up: { color: UP },
  winRate: { color: MUTED, fontSize: 13, fontWeight: "400", lineHeight: 19 },
});

export default DiscoverScreen;
