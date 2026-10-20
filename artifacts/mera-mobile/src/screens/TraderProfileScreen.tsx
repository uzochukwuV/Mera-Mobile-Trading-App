import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { coinColor } from "./coinMeta";
import { ReactElement, useState } from "react";
import { BG, BORDER, CARD, CARD_SOFT, DOWN, DOWN_SOFT, FONT, INK, MUTED, ON_ACCENT, PAPER, RADIUS, SECONDARY, SHEET, TEAL, UP, UP_SOFT } from "./homeTheme";
import { PositionRow, TraderProfileProps } from "./types";
import { normalizeAmountInput } from "../amount";

const PRESETS = ["100", "250", "500"] as const;

function Stat({
  label,
  value,
  tone,
  hero,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
  hero?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text
        style={[
          hero ? styles.heroValue : styles.statValue,
          tone === "up" ? styles.up : tone === "down" ? styles.down : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function TraderProfileScreen(props: TraderProfileProps = {}): ReactElement {
  const {
    handle = "trader",
    bio = "",
    pnl30d = "—",
    pnlUp = true,
    pnl24h = "—",
    winRate = "—",
    sharpe = "—",
    maxDrawdown = "—",
    followers = "0",
    following = false,
    busy = false,
    loading = false,
    loadError = null,
    positions = [],
    fills = [],
    allocation = "",
    copyError = null,
    onBack,
    onFollow,
    onUnfollow,
    onAllocationChange,
    onStartCopy,
    onRetry,
  } = props;

  const [allocationFocused, setAllocationFocused] = useState(false);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onBack?.()}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={20} color={SECONDARY} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={INK} />
            <Text style={styles.emptyBody}>Loading trader…</Text>
          </View>
        ) : loadError ? (
          <View style={styles.loading}>
            <Text style={styles.emptyTitle}>Couldn't load trader</Text>
            <Text style={styles.emptyBody}>{loadError}</Text>
            {onRetry ? (
              <Pressable
                accessibilityRole="button"
                onPress={onRetry}
                style={({ pressed }) => [
                  styles.retry,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.retryLabel}>Try again</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {handle.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.headerMain}>
                <Text style={styles.handle} numberOfLines={1}>
                  {handle}
                </Text>
                {bio ? (
                  <Text style={styles.bio} numberOfLines={2}>
                    {bio}
                  </Text>
                ) : null}
                <Text style={styles.followers}>{followers} followers</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => (following ? onUnfollow?.() : onFollow?.())}
              style={({ pressed }) => [
                styles.follow,
                following ? styles.followIdle : styles.followActive,
                busy || pressed ? styles.pressed : null,
              ]}
            >
              <Text
                style={
                  following ? styles.followIdleLabel : styles.followActiveLabel
                }
              >
                {following ? "Following ✓" : "Follow"}
              </Text>
            </Pressable>

            <View style={styles.stats}>
              <View style={styles.statRow}>
                <Stat label="30D PNL" value={pnl30d} tone={pnlUp ? "up" : "down"} hero />
                <Stat label="24H PNL" value={pnl24h} />
              </View>
              <View style={styles.statRow}>
                <Stat label="WIN RATE" value={winRate} />
                <Stat label="SHARPE" value={sharpe} />
              </View>
              <View style={styles.statRow}>
                <Stat label="MAX DRAWDOWN" value={maxDrawdown} />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Live positions</Text>
            <View style={styles.list}>
              {positions.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyBody}>No live positions</Text>
                </View>
              ) : (
                positions.map((row: PositionRow, index: number) => (
                  <View key={`${row.symbol}-${index}`}>
                    {index > 0 ? <View style={styles.hairline} /> : null}
                    <View style={styles.row}>
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
                          <Text
                            style={[
                              styles.sideLabel,
                              row.side === "Long" ? styles.up : styles.down,
                            ]}
                          >
                            {row.side}
                          </Text>
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
            </View>

            <Text style={styles.sectionTitle}>Recent fills</Text>
            <View style={styles.list}>
              {fills.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyBody}>No recent fills</Text>
                </View>
              ) : (
                fills.slice(0, 10).map((fill, index) => (
                  <View key={`${fill.market}-${fill.time}-${index}`}>
                    {index > 0 ? <View style={styles.hairline} /> : null}
                    <View style={styles.row}>
                      <View style={styles.rowMain}>
                        <Text style={styles.rowTitle}>
                          {fill.market} {fill.side}
                        </Text>
                        <Text style={styles.rowDetail}>{fill.time}</Text>
                      </View>
                      <Text style={styles.rowPrice}>{fill.price}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.copy}>
              <Text style={styles.copyTitle}>Copy this trader</Text>
              <Text style={styles.fieldLabel}>Allocation (aUSD)</Text>
              <TextInput
                accessibilityLabel="Allocation in aUSD"
                editable={!busy}
                keyboardType="decimal-pad"
                onBlur={() => setAllocationFocused(false)}
                onChangeText={(value) =>
                  onAllocationChange?.(normalizeAmountInput(value))
                }
                onFocus={() => setAllocationFocused(true)}
                placeholder="0.00"
                placeholderTextColor={MUTED}
                style={[
                  styles.input,
                  allocationFocused ? styles.inputFocused : null,
                ]}
                value={allocation}
              />
              <View style={styles.presets}>
                {PRESETS.map((preset) => (
                  <Pressable
                    key={preset}
                    accessibilityRole="button"
                    disabled={busy}
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
                Each copy targets ≈ allocation × the leader's position share.
                Defaults: 3x max leverage, $50 daily loss limit.
              </Text>
              {copyError ? (
                <Text style={styles.copyError}>{copyError}</Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start copying"
                disabled={busy}
                onPress={() => onStartCopy?.()}
                style={({ pressed }) => [
                  styles.start,
                  busy || pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.startLabel}>
                  {busy ? "Starting…" : following ? "Start copying" : "Follow & start copying"}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.pill,
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  avatarText: { fontFamily: FONT, color: INK, fontSize: 24, fontWeight: "400" },
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 4, paddingVertical: 4 },
  backLabel: { fontFamily: FONT, color: SECONDARY, fontSize: 15, fontWeight: "400", lineHeight: 20 },
  bio: { fontFamily: FONT, color: SECONDARY, fontSize: 13, fontWeight: "400", lineHeight: 18 },
  coin: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  coinText: { fontFamily: FONT, color: PAPER, fontSize: 17, fontWeight: "400" },
  copy: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  copyError: { fontFamily: FONT, color: DOWN, fontSize: 13, fontWeight: "400", lineHeight: 18 },
  copyTitle: { fontFamily: FONT, color: INK, fontSize: 18, fontWeight: "400", lineHeight: 26 },
  down: { color: DOWN },
  empty: { gap: 4, padding: 8 },
  emptyBody: { fontFamily: FONT, color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center" },
  emptyTitle: { fontFamily: FONT, color: INK, fontSize: 15, fontWeight: "400", lineHeight: 22, textAlign: "center" },
  fieldLabel: { fontFamily: FONT, color: SECONDARY, fontSize: 13, fontWeight: "400" },
  followers: { fontFamily: FONT, color: MUTED, fontSize: 13, fontWeight: "400", lineHeight: 19 },
  follow: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  followActive: { backgroundColor: TEAL },
  followActiveLabel: { fontFamily: FONT, color: ON_ACCENT, fontSize: 16, fontWeight: "400" },
  followIdle: { backgroundColor: CARD, borderColor: BORDER, borderWidth: 1 },
  followIdleLabel: { fontFamily: FONT, color: SECONDARY, fontSize: 16, fontWeight: "400" },
  hairline: { backgroundColor: BORDER, height: 1, width: "100%" },
  handle: { fontFamily: FONT, color: INK, fontSize: 26, fontWeight: "400", letterSpacing: -0.4, lineHeight: 32 },
  header: { alignItems: "center", flexDirection: "row", gap: 16 },
  headerMain: { flex: 1, gap: 4 },
  input: {
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    color: INK,
    fontFamily: FONT,
    fontSize: 17,
    fontVariant: ["tabular-nums"],
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputFocused: { borderColor: TEAL },
  list: {
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loading: { alignItems: "center", gap: 12, paddingVertical: 48 },
  pnl: {
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: "400",
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  pressed: { opacity: 0.6 },
  presets: { flexDirection: "row", gap: 8 },
  preset: {
    alignItems: "center",
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  presetLabel: { fontFamily: FONT, color: SECONDARY, fontSize: 13, fontWeight: "400", fontVariant: ["tabular-nums"] },
  preview: { fontFamily: FONT, color: MUTED, fontSize: 12, lineHeight: 17 },
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
    paddingVertical: 12,
  },
  rowDetail: { fontFamily: FONT, color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  rowMain: { flex: 1, gap: 4 },
  rowPrice: { fontFamily: FONT, color: INK, fontSize: 14, fontWeight: "400", fontVariant: ["tabular-nums"] },
  rowRight: { alignItems: "flex-end", gap: 8 },
  rowTitle: { fontFamily: FONT, color: INK, fontSize: 15, fontWeight: "400", lineHeight: 20 },
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 16, padding: 20, paddingBottom: 32 },
  sectionTitle: { fontFamily: FONT, color: INK, fontSize: 18, fontWeight: "400", lineHeight: 24 },
  side: { borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 4 },
  sideLabel: { fontFamily: FONT, fontSize: 12, fontWeight: "400", lineHeight: 15 },
  sideLong: { backgroundColor: UP_SOFT },
  sideShort: { backgroundColor: DOWN_SOFT },
  start: {
    alignItems: "center",
    backgroundColor: INK,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  startLabel: { fontFamily: FONT, color: PAPER, fontSize: 16, fontWeight: "400", lineHeight: 22 },
  stat: { flex: 1, gap: 4 },
  statLabel: { fontFamily: FONT, color: MUTED, fontSize: 11, fontWeight: "400", letterSpacing: 0.6, lineHeight: 14 },
  statRow: { flexDirection: "row", gap: 12 },
  statValue: { fontFamily: FONT, color: INK, fontSize: 17, fontWeight: "400", fontVariant: ["tabular-nums"], lineHeight: 22 },
  heroValue: { fontFamily: FONT, color: INK, fontSize: 34, fontWeight: "400", fontVariant: ["tabular-nums"], lineHeight: 41 },
  stats: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  up: { color: UP },
});

export default TraderProfileScreen;
