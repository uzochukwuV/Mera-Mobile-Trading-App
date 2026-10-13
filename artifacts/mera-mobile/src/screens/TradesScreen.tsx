import { useState, type ReactElement, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../ui";
import { palette, radii, spacing, text } from "../theme";
import type { TradeFillRow, TradesProps } from "./types";

const DEFAULT_FILLS: TradeFillRow[] = [
  {
    id: "1",
    market: "BTC",
    side: "Long",
    size: "0.05",
    price: "67,410.5",
    time: "09:41",
    status: "Filled",
    source: "Copy",
  },
  {
    id: "2",
    market: "ETH",
    side: "Short",
    size: "0.80",
    price: "3,512.8",
    time: "09:12",
    status: "Open",
    source: "Manual",
  },
  {
    id: "3",
    market: "SOL",
    side: "Long",
    size: "2.00",
    price: "172.44",
    time: "08:57",
    status: "Partial",
    source: "Copy",
  },
  {
    id: "4",
    market: "BTC",
    side: "Short",
    size: "0.02",
    price: "67,020.0",
    time: "Yesterday",
    status: "Cancelled",
    source: "Manual",
  },
  {
    id: "5",
    market: "ETH",
    side: "Long",
    size: "1.40",
    price: "3,488.2",
    time: "Yesterday",
    status: "Filled",
    source: "Copy",
  },
];

type Filter = "All" | "Copy" | "Manual";
const FILTERS: Filter[] = ["All", "Copy", "Manual"];

type TagVariant = "forest" | "fog" | "sunlit";

function Tag({
  variant,
  children,
}: {
  variant: TagVariant;
  children: ReactNode;
}) {
  const style = tagStyles[variant];
  return (
    <View style={[styles.tag, style.container]}>
      <Text style={[styles.tagLabel, style.label]}>{children}</Text>
    </View>
  );
}

const tagStyles = {
  forest: {
    container: { backgroundColor: palette.forest },
    label: { color: palette.textInverse },
  },
  fog: {
    container: { backgroundColor: palette.surfaceMuted },
    label: { color: palette.graphite },
  },
  sunlit: {
    container: { backgroundColor: palette.sunlitCream },
    label: { color: palette.emberBrown },
  },
} as const;

function statusVariant(status: TradeFillRow["status"]): TagVariant {
  if (status === "Filled") return "forest";
  if (status === "Partial") return "sunlit";
  return "fog";
}

function sectionOf(row: TradeFillRow): string {
  return row.time === "Yesterday" ? "Yesterday" : "Today";
}

function FillRow({
  row,
  onPress,
}: {
  row: TradeFillRow;
  onPress: () => void;
}): ReactElement {
  const filled = row.status === "Filled";
  const arrow = filled ? "↙" : "↗";
  const long = row.side === "Long";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <View style={styles.badgeWrap}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{row.market.slice(0, 1)}</Text>
        </View>
        <View
          style={[
            styles.arrowDot,
            filled ? styles.arrowDotUp : styles.arrowDotDown,
          ]}
        >
          <Text
            style={[
              styles.arrowGlyph,
              filled ? styles.arrowUp : styles.arrowDown,
            ]}
          >
            {arrow}
          </Text>
        </View>
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
        <Text style={[styles.amount, long ? styles.up : styles.down]}>
          {row.price}
        </Text>
        <Tag variant={statusVariant(row.status)}>{row.status}</Tag>
      </View>
    </Pressable>
  );
}

export function TradesScreen(props: TradesProps): ReactElement {
  const {
    fills = DEFAULT_FILLS,
    realizedPnlToday = "+38.20",
    realizedPnlUp = true,
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onBack?.()}
          style={styles.back}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={text.title}>Trades</Text>

        <Card style={styles.summary}>
          <Text style={text.caption}>Today</Text>
          <Text
            style={[
              styles.pnl,
              realizedPnlUp ? styles.up : styles.down,
            ]}
          >
            {realizedPnlToday}
          </Text>
        </Card>

        <View style={styles.chips}>
          {FILTERS.map((option) => {
            const active = filter === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setFilter(option)}
                style={[
                  styles.chip,
                  active ? styles.chipActive : styles.chipIdle,
                ]}
              >
                <Text
                  style={
                    active ? styles.chipActiveLabel : styles.chipIdleLabel
                  }
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {visible.length === 0 ? (
          <Card style={styles.list} padding={spacing.sm}>
            <View style={styles.empty}>
              <Text style={text.bodyStrong}>No fills yet</Text>
            </View>
          </Card>
        ) : (
          sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionCount}>
                  {section.rows.length} transactions
                </Text>
              </View>
              <Card style={styles.list} padding={spacing.sm}>
                {section.rows.map((row, index) => (
                  <View key={row.id}>
                    {index > 0 ? <View style={styles.hairline} /> : null}
                    <FillRow row={row} onPress={() => onSelectFill?.(row.id)} />
                  </View>
                ))}
              </Card>
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
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  arrowDot: {
    alignItems: "center",
    borderRadius: radii.full,
    bottom: -2,
    height: 18,
    justifyContent: "center",
    position: "absolute",
    right: -2,
    width: 18,
  },
  arrowDotDown: { backgroundColor: palette.errorSoft },
  arrowDotUp: { backgroundColor: palette.okSoft },
  arrowDown: { color: palette.error },
  arrowGlyph: { fontSize: 10, fontWeight: "600", lineHeight: 12 },
  arrowUp: { color: palette.ok },
  back: { alignSelf: "flex-start", paddingVertical: 4 },
  backText: { color: palette.graphite, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  badge: {
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  badgeText: { color: palette.text, fontSize: 15, fontWeight: "600" },
  badgeWrap: { position: "relative" },
  chip: {
    alignItems: "center",
    borderRadius: radii.pill,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipActive: { backgroundColor: palette.primary },
  chipActiveLabel: {
    color: palette.textInverse,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  chipIdle: { backgroundColor: palette.surfaceMuted },
  chipIdleLabel: {
    color: palette.graphite,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  chips: { flexDirection: "row", gap: spacing.xs },
  down: { color: palette.error },
  empty: { padding: spacing.sm },
  hairline: { backgroundColor: palette.border, height: 1, width: "100%" },
  list: { gap: 0 },
  pnl: {
    fontSize: 22,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.37,
    lineHeight: 31,
  },
  pressed: { opacity: 0.85 },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowDetail: {
    color: palette.ash,
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
  },
  rowMain: { flex: 1, gap: 2 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  rowTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },
  screen: { backgroundColor: palette.bg, flex: 1 },
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  section: { gap: spacing.xs },
  sectionCount: {
    color: palette.ash,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 15,
  },
  sectionHeader: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: spacing.xs,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  summary: { padding: spacing.lg },
  tag: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagLabel: { fontSize: 12, fontWeight: "500", lineHeight: 15 },
  up: { color: palette.forest },
});

export default TradesScreen;
