import { useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { coinColor } from "./coinMeta";
import {
  BG,
  BORDER,
  CARD,
  CARD_SOFT,
  DOWN,
  INK,
  MUTED,
  SECONDARY,
  SHEET,
  TEAL,
  UP,
} from "./homeTheme";
import type { PositionRow, TraderProfileProps } from "./types";

const PRESETS = ["100", "250", "500"] as const;

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text
        style={[
          styles.statValue,
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
                <Stat label="30D PNL" value={pnl30d} tone={pnlUp ? "up" : "down"} />
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
                onChangeText={(value) => onAllocationChange?.(value)}
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
    borderRadius: 9999,
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  avatarText: { color: INK, fontSize: 24, fontWeight: "800" },
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 2, paddingVertical: 4 },
  backLabel: { color: SECONDARY, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  bio: { color: SECONDARY, fontSize: 13, fontWeight: "400", lineHeight: 18 },
  coin: {
    alignItems: "center",
    borderRadius: 9999,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  coinText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  copy: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  copyError: { color: DOWN, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  copyTitle: { color: INK, fontSize: 18, fontWeight: "700", lineHeight: 26 },
  down: { color: DOWN },
  empty: { gap: 4, padding: 8 },
  emptyBody: { color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center" },
  emptyTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 22, textAlign: "center" },
  fieldLabel: { color: SECONDARY, fontSize: 13, fontWeight: "600" },
  followers: { color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  follow: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  followActive: { backgroundColor: INK },
  followActiveLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  followIdle: { backgroundColor: CARD_SOFT },
  followIdleLabel: { color: INK, fontSize: 15, fontWeight: "600" },
  hairline: { backgroundColor: BORDER, height: 1, width: "100%" },
  handle: { color: INK, fontSize: 22, fontWeight: "800", letterSpacing: -0.4, lineHeight: 30 },
  header: { alignItems: "center", flexDirection: "row", gap: 14 },
  headerMain: { flex: 1, gap: 2 },
  input: {
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    color: INK,
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
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  loading: { alignItems: "center", gap: 12, paddingVertical: 48 },
  pnl: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  pressed: { opacity: 0.6 },
  presets: { flexDirection: "row", gap: 8 },
  preset: {
    alignItems: "center",
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: 9999,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  presetLabel: { color: SECONDARY, fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] },
  preview: { color: MUTED, fontSize: 12, lineHeight: 17 },
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
    paddingVertical: 12,
  },
  rowDetail: { color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  rowMain: { flex: 1, gap: 2 },
  rowPrice: { color: INK, fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] },
  rowRight: { alignItems: "flex-end", gap: 6 },
  rowTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 14, padding: 20, paddingBottom: 32 },
  sectionTitle: { color: INK, fontSize: 17, fontWeight: "700", lineHeight: 24 },
  side: { borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  sideLabel: { fontSize: 12, fontWeight: "600", lineHeight: 15 },
  sideLong: { backgroundColor: "rgba(52, 211, 153, 0.16)" },
  sideShort: { backgroundColor: "rgba(248, 113, 113, 0.16)" },
  start: {
    alignItems: "center",
    backgroundColor: INK,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  startLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", lineHeight: 20 },
  stat: { flex: 1, gap: 2 },
  statLabel: { color: MUTED, fontSize: 11, fontWeight: "600", letterSpacing: 0.6, lineHeight: 14 },
  statRow: { flexDirection: "row", gap: 12 },
  statValue: { color: INK, fontSize: 17, fontWeight: "700", fontVariant: ["tabular-nums"], lineHeight: 22 },
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
