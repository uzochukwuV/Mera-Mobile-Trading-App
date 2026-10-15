import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BG,
  BORDER,
  CARD,
  INK,
  MUTED,
  SECONDARY,
  SHEET,
  TEAL,
  UP,
} from "./homeTheme";
import type { ReactElement } from "react";
import type { StandingsEntry, TournamentStandingsProps } from "./types";

function medal(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export function TournamentStandingsScreen(
  props: TournamentStandingsProps = {},
): ReactElement {
  const {
    name = "Tournament",
    status,
    prize,
    entries = [],
    myRank = null,
    loading = false,
    loadError = null,
    onBack,
    onRetry,
  } = props;
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? entries : entries.slice(0, 10);

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
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>
          {[status, prize ? `${prize} prize` : null, myRank ? `Your rank #${myRank}` : null]
            .filter((part) => part !== null)
            .join(" · ")}
        </Text>

        {loading && entries.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={TEAL} />
            <Text style={styles.emptyBody}>Loading standings…</Text>
          </View>
        ) : loadError && entries.length === 0 ? (
          <View style={styles.loading}>
            <Text style={styles.emptyTitle}>Couldn't load standings</Text>
            <Text style={styles.emptyBody}>{loadError}</Text>
            {onRetry ? (
              <Pressable
                accessibilityRole="button"
                onPress={onRetry}
                style={styles.retry}
              >
                <Text style={styles.retryLabel}>Try again</Text>
              </Pressable>
            ) : null}
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyTitle}>No standings yet</Text>
            <Text style={styles.emptyBody}>
              Scores appear once the round starts.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.list}>
              {visible.map((row, index) => {
                const rank = Number(row.rank) || index + 1;
                const prize = medal(rank);
                return (
                  <View key={`${row.handle}-${rank}`}>
                    {index > 0 ? <View style={styles.hairline} /> : null}
                    <View style={styles.row}>
                      <Text style={styles.rank}>
                        {prize ?? `#${rank}`}
                      </Text>
                      <View style={styles.rowMain}>
                        <Text style={styles.handle}>{row.handle}</Text>
                        <Text style={styles.detail}>PnL {row.netPnl}</Text>
                      </View>
                      <Text style={styles.score}>{row.score}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            {entries.length > 10 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowAll((all) => !all)}
                style={styles.more}
              >
                <Text style={styles.moreLabel}>
                  {showAll ? "Show less" : `Show all ${entries.length}`}
                </Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

export type { StandingsEntry };

const styles = StyleSheet.create({
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 12, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 6 },
  back: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    paddingVertical: 6,
  },
  backLabel: { color: SECONDARY, fontSize: 14, fontWeight: "500" },
  title: { color: INK, fontSize: 22, fontWeight: "800", lineHeight: 28 },
  subtitle: { color: MUTED, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  loading: { alignItems: "center", gap: 12, paddingVertical: 48 },
  emptyTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 22 },
  emptyBody: { color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center" },
  retry: {
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 9999,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryLabel: { color: TEAL, fontSize: 14, fontWeight: "600" },
  card: {
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    padding: 16,
  },
  list: {
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  hairline: { backgroundColor: BORDER, height: 1, width: "100%" },
  row: { alignItems: "center", flexDirection: "row", gap: 10, paddingVertical: 10 },
  rank: { fontSize: 15, fontWeight: "700", minWidth: 40, color: INK },
  rowMain: { flex: 1, gap: 2 },
  handle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  detail: { color: MUTED, fontSize: 12, lineHeight: 16 },
  score: { color: UP, fontSize: 14, fontWeight: "700" },
  more: { alignItems: "center", paddingVertical: 10 },
  moreLabel: { color: TEAL, fontSize: 14, fontWeight: "600" },
});
