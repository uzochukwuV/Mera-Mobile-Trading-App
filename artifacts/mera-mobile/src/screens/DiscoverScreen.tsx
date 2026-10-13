import type { ReactElement } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../ui";
import { palette, radii, spacing, text } from "../theme";
import type { DiscoverProps, LeaderRow } from "./types";

const SORT_OPTIONS = ["PnL", "24h", "Win rate", "Sharpe", "Followers"] as const;

const DEFAULT_LEADERS: LeaderRow[] = [
  { id: "satoshi-trades", handle: "satoshi-trades", pnl30d: "+1,240.50", pnlUp: true, winRate: "68%", followers: "1,204" },
  { id: "macro-desk", handle: "macro-desk", pnl30d: "+860.10", pnlUp: true, winRate: "61%", followers: "982" },
  { id: "degen-alice", handle: "degen-alice", pnl30d: "+412.75", pnlUp: true, winRate: "57%", followers: "731" },
  { id: "steady-bob", handle: "steady-bob", pnl30d: "-96.40", pnlUp: false, winRate: "49%", followers: "518" },
  { id: "quant-owl", handle: "quant-owl", pnl30d: "-210.05", pnlUp: false, winRate: "44%", followers: "306" },
];

export function DiscoverScreen(props: DiscoverProps): ReactElement {
  const {
    leaders = DEFAULT_LEADERS,
    sort = "PnL",
    onSortChange,
    onSelectTrader,
  } = props;
  const selected = sort ?? "PnL";

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
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
        <Card style={styles.list}>
          {leaders.map((row, index) => (
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
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
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
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  avatarText: { color: palette.ink, fontSize: 15, fontWeight: "600" },
  chevron: { color: palette.graphite, fontSize: 18, fontWeight: "600" },
  chip: {
    alignItems: "center",
    borderRadius: radii.pill,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipActive: { backgroundColor: palette.primary },
  chipActiveLabel: { color: palette.textInverse, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  chipInactive: { backgroundColor: palette.surfaceMuted },
  chipInactiveLabel: { color: palette.graphite, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  chips: { flexDirection: "row", gap: spacing.xs },
  down: { color: palette.down },
  followers: { color: palette.ash, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  hairline: { backgroundColor: palette.border, height: 1, width: "100%" },
  handle: { color: palette.ink, fontSize: 14, fontWeight: "600", lineHeight: 19 },
  list: { padding: spacing.sm },
  pnl: {
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
  pressed: { opacity: 0.85 },
  rank: { color: palette.ash, fontSize: 13, fontWeight: "500", width: 20 },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowMain: { flex: 1, gap: 2 },
  rowRight: { alignItems: "flex-end", gap: 2 },
  screen: { backgroundColor: palette.bg, flex: 1 },
  scroll: { gap: spacing.md, paddingBottom: spacing.xl, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  title: { ...text.title },
  up: { color: palette.up },
  winRate: { color: palette.ash, fontSize: 12, fontWeight: "400", lineHeight: 16 },
});

export default DiscoverScreen;
