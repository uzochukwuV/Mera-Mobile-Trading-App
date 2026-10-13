import type { ReactElement } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../Button";
import { Card, TextField } from "../ui";
import { palette, radii, spacing } from "../theme";
import type { PositionRow, TraderProfileProps } from "./types";

const DEFAULT_POSITIONS: PositionRow[] = [
  { symbol: "BTC", side: "Long", size: "0.12", mark: "67,410.5", pnl: "+142.30", pnlUp: true },
  { symbol: "ETH", side: "Short", size: "1.40", mark: "3,512.8", pnl: "-28.12", pnlUp: false },
];

const PRESETS = ["100", "250", "500"] as const;

export function TraderProfileScreen(props: TraderProfileProps): ReactElement {
  const {
    handle = "satoshi-trades",
    bio = "Trend rider · risk first.",
    pnl30d = "+1,240.50",
    pnlUp = true,
    winRate = "68%",
    sharpe = "1.84",
    followers = "1,204",
    following = false,
    busy = false,
    positions = DEFAULT_POSITIONS,
    allocation = "",
    onBack,
    onFollow,
    onUnfollow,
    onAllocationChange,
    onStartCopy,
  } = props;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onBack?.()}
          style={({ pressed }) => [styles.back, pressed ? styles.pressed : null]}
        >
          <Text style={styles.backLabel}>‹ Back</Text>
        </Pressable>

        <Card style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {handle.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerMain}>
              <Text style={styles.handle} numberOfLines={1}>
                {handle}
              </Text>
              <Text style={styles.bio} numberOfLines={1}>
                {bio}
              </Text>
              <Text style={styles.followers}>{followers} followers</Text>
            </View>
          </View>
          <Button
            title={following ? "Following ✓" : "Follow"}
            primary
            onPress={() => (following ? onUnfollow?.() : onFollow?.())}
          />
        </Card>

        <Card style={styles.stats}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>30d PnL</Text>
              <Text style={[styles.statValue, pnlUp ? styles.up : styles.down]}>
                {pnl30d}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Win rate</Text>
              <Text style={styles.statValue}>{winRate}</Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Sharpe</Text>
              <Text style={styles.statValue}>{sharpe}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Followers</Text>
              <Text style={styles.statValue}>{followers}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live positions</Text>
          <Card style={styles.list}>
            {positions.length === 0 ? (
              <Text style={styles.empty}>No live positions</Text>
            ) : (
              positions.map((row, index) => (
                <View key={`${row.symbol}-${index}`}>
                  {index > 0 ? <View style={styles.hairline} /> : null}
                  <View style={styles.row}>
                    <View style={styles.coin}>
                      <Text style={styles.coinText}>
                        {row.symbol.slice(0, 1)}
                      </Text>
                    </View>
                    <View style={styles.rowMain}>
                      <Text style={styles.rowTitle}>{row.symbol}</Text>
                      <Text style={styles.rowDetail}>
                        {row.size}
                        {row.mark ? ` · ${row.mark}` : ""}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <View
                        style={[
                          styles.side,
                          row.side === "Long" ? styles.sideLong : styles.sideShort,
                        ]}
                      >
                        <Text style={styles.sideLabel}>{row.side}</Text>
                      </View>
                      <Text
                        style={[
                          styles.pnl,
                          row.pnlUp ? styles.up : styles.down,
                        ]}
                      >
                        {row.pnl}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>

        <Card style={styles.copy}>
          <Text style={styles.copyTitle}>Copy</Text>
          <TextField
            label="Allocation (aUSD)"
            value={allocation}
            onChangeText={(value) => onAllocationChange?.(value)}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          <View style={styles.presets}>
            {PRESETS.map((preset) => (
              <Pressable
                key={preset}
                accessibilityRole="button"
                onPress={() => onAllocationChange?.(preset)}
                style={({ pressed }) => [
                  styles.preset,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.presetLabel}>{preset}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.preview}>
            ≈ target per $1k leader — allocation × share.
          </Text>
          <Button
            title={busy ? "Starting…" : "Start copying"}
            primary
            disabled={busy}
            onPress={() => onStartCopy?.()}
          />
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
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarText: { color: palette.ink, fontSize: 22, fontWeight: "600" },
  back: { alignSelf: "flex-start", paddingVertical: 4 },
  backLabel: { color: palette.graphite, fontSize: 14, fontWeight: "500" },
  bio: { color: palette.graphite, fontSize: 13, fontWeight: "400", lineHeight: 18 },
  coin: {
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  coinText: { color: palette.ink, fontSize: 15, fontWeight: "600" },
  copy: { gap: spacing.sm, padding: spacing.md },
  copyTitle: { color: palette.ink, fontSize: 18, fontWeight: "600", lineHeight: 26 },
  down: { color: palette.down },
  empty: { color: palette.graphite, fontSize: 13, fontWeight: "400", lineHeight: 18 },
  followers: { color: palette.graphite, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  hairline: { backgroundColor: palette.border, height: 1, width: "100%" },
  handle: { color: palette.ink, fontSize: 22, fontWeight: "600", letterSpacing: -0.37, lineHeight: 31 },
  header: { gap: spacing.md, padding: spacing.md },
  headerMain: { flex: 1, gap: 2 },
  headerRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  list: { padding: spacing.sm },
  pnl: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  pressed: { opacity: 0.85 },
  presets: { flexDirection: "row", gap: spacing.xs },
  preset: {
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.pill,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  presetLabel: {
    color: palette.graphite,
    fontSize: 13,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  preview: { color: palette.graphite, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowDetail: { color: palette.ash, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  rowMain: { flex: 1, gap: 2 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  rowTitle: { color: palette.ink, fontSize: 14, fontWeight: "600", lineHeight: 19 },
  screen: { backgroundColor: palette.bg, flex: 1 },
  scroll: { gap: spacing.md, paddingBottom: spacing.xl, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  section: { gap: spacing.sm },
  sectionTitle: { color: palette.ink, fontSize: 18, fontWeight: "600", lineHeight: 26, paddingHorizontal: 4 },
  side: {
    alignItems: "center",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sideLabel: { color: palette.textInverse, fontSize: 12, fontWeight: "500", lineHeight: 15 },
  sideLong: { backgroundColor: palette.forest },
  sideShort: { backgroundColor: palette.error },
  stat: { flex: 1, gap: 2 },
  statLabel: { color: palette.graphite, fontSize: 12, fontWeight: "500", lineHeight: 15 },
  statRow: { flexDirection: "row", gap: spacing.sm },
  statValue: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
  stats: { gap: spacing.sm, padding: spacing.md },
  up: { color: palette.up },
});

export default TraderProfileScreen;
