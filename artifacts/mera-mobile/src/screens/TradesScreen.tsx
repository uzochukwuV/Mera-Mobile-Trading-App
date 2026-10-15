import { useState, type ReactElement } from "react";
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
import { coinColor } from "./coinMeta";
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
import type { TradeFillRow, TradesProps } from "./types";

type Filter = "All" | "Copy" | "Manual" | "Exchange";
const FILTERS: Filter[] = ["All", "Copy", "Manual", "Exchange"];

function StatusTag({ status }: { status: TradeFillRow["status"] }) {
  const tone =
    status === "Filled"
      ? { bg: "rgba(52, 211, 153, 0.14)", fg: UP }
      : status === "Partial"
        ? { bg: "rgba(251, 191, 36, 0.14)", fg: "#FBBF24" }
        : status === "Open"
          ? { bg: CARD, fg: SECONDARY }
          : { bg: "rgba(248, 113, 113, 0.14)", fg: DOWN };
  return (
    <View style={[styles.tag, { backgroundColor: tone.bg }]}>
      <Text style={[styles.tagLabel, { color: tone.fg }]}>{status}</Text>
    </View>
  );
}

function sectionOf(row: TradeFillRow): string {
  return row.time === "Yesterday" || row.time === "" ? "Earlier" : "Today";
}

function RowContent({ row }: { row: TradeFillRow }): ReactElement {
  return (
    <>
      <View
        style={[
          styles.badge,
          { backgroundColor: coinColor(row.market) },
        ]}
      >
        <Text style={styles.badgeText}>
          {row.market.slice(0, 1)}
        </Text>
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle}>
          {row.market} {row.side}
        </Text>
        <Text style={styles.rowDetail}>
          {row.size} · {row.time} · {row.source}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text
          style={[
            styles.amount,
            row.side === "Long" ? styles.up : styles.down,
          ]}
        >
          {row.price}
        </Text>
        <StatusTag status={row.status} />
      </View>
    </>
  );
}

export function TradesScreen(props: TradesProps): ReactElement {
  const {
    fills = [],
    realizedPnlToday = "+0.00",
    realizedPnlUp = true,
    loading = false,
    loadError = null,
    refreshing = false,
    onRefresh,
    onSelectFill,
    onBack,
  } = props;

  const [filter, setFilter] = useState<Filter>("All");
  const visible =
    filter === "All" ? fills : fills.filter((row) => row.source === filter);

  const sections: Array<{ title: string; rows: TradeFillRow[] }> = [];
  for (const row of visible) {
    const title = sectionOf(row);
    const section = sections.find((entry) => entry.title === title);
    if (section) {
      section.rows.push(row);
    } else {
      sections.push({ title, rows: [row] });
    }
  }

  return (
    <View style={styles.screen}>
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
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onBack?.()}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={20} color={SECONDARY} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Trades</Text>

        <View style={styles.summary}>
          <Text style={styles.caption}>REALIZED TODAY</Text>
          <Text style={[styles.pnl, realizedPnlUp ? styles.up : styles.down]}>
            {realizedPnlToday}
          </Text>
        </View>

        <View style={styles.chips}>
          {FILTERS.map((option) => {
            const active = filter === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setFilter(option)}
                style={({ pressed }) => [
                  styles.chip,
                  active ? styles.chipActive : styles.chipIdle,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text
                  style={active ? styles.chipActiveLabel : styles.chipIdleLabel}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading && fills.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={TEAL} />
            <Text style={styles.emptyBody}>Loading trades…</Text>
          </View>
        ) : loadError && fills.length === 0 ? (
          <View style={styles.loading}>
            <Text style={styles.emptyTitle}>Couldn't load trades</Text>
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
        ) : visible.length === 0 ? (
          <View style={styles.list}>
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No trades yet</Text>
              <Text style={styles.emptyBody}>
                Copy fills and manual orders land here.
              </Text>
            </View>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionCount}>
                  {section.rows.length} transactions
                </Text>
              </View>
              <View style={styles.list}>
                {section.rows.map((row, index) => (
                  <View key={row.id}>
                    {index > 0 ? <View style={styles.hairline} /> : null}
                    {onSelectFill ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onSelectFill?.(row.id)}
                      style={({ pressed }) => [
                        styles.row,
                        pressed ? styles.pressed : null,
                      ]}
                    >
                      <RowContent row={row} />
                    </Pressable>
                    ) : (
                    <View style={styles.row}>
                      <RowContent row={row} />
                    </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 2, paddingVertical: 4 },
  backLabel: { color: SECONDARY, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  badge: {
    alignItems: "center",
    borderRadius: 9999,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  badgeText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  caption: { color: MUTED, fontSize: 11, fontWeight: "600", letterSpacing: 1, lineHeight: 14 },
  chip: {
    alignItems: "center",
    borderRadius: 9999,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipActive: { backgroundColor: INK },
  chipActiveLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", lineHeight: 18 },
  chipIdle: { backgroundColor: CARD },
  chipIdleLabel: { color: SECONDARY, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  chips: { flexDirection: "row", gap: 8 },
  down: { color: DOWN },
  empty: { gap: 4, padding: 8 },
  emptyBody: { color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center" },
  emptyTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 22, textAlign: "center" },
  hairline: { backgroundColor: BORDER, height: 1, width: "100%" },
  list: {
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  loading: { alignItems: "center", gap: 12, paddingVertical: 48 },
  pnl: {
    fontSize: 26,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
    lineHeight: 32,
  },
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
    paddingVertical: 12,
  },
  rowDetail: { color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  rowMain: { flex: 1, gap: 2 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  rowTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 14, padding: 20, paddingBottom: 32 },
  section: { gap: 8 },
  sectionCount: { color: MUTED, fontSize: 12, fontWeight: "500", lineHeight: 15 },
  sectionHeader: { alignItems: "baseline", flexDirection: "row", gap: 8 },
  sectionTitle: { color: INK, fontSize: 16, fontWeight: "700", lineHeight: 22 },
  summary: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    padding: 16,
  },
  tag: {
    alignSelf: "flex-start",
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagLabel: { fontSize: 12, fontWeight: "600", lineHeight: 15 },
  title: { color: INK, fontSize: 24, fontWeight: "800", letterSpacing: -0.4, lineHeight: 32 },
  up: { color: UP },
});

export default TradesScreen;
