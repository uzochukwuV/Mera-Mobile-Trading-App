import type { ReactElement } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { TopFilterBar } from "./TabChrome";
import {
  AMBER,
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
import type { TournamentRow, TournamentsProps } from "./types";

function StatusTag({ status }: { status: TournamentRow["status"] }) {
  const tone =
    status === "Live"
      ? { bg: "rgba(52, 211, 153, 0.14)", fg: UP }
      : status === "Upcoming"
        ? { bg: "rgba(251, 191, 36, 0.14)", fg: AMBER }
        : { bg: CARD, fg: SECONDARY };
  return (
    <View style={[styles.tag, { backgroundColor: tone.bg }]}>
      {status === "Live" ? (
        <View style={[styles.tagDot, { backgroundColor: UP }]} />
      ) : null}
      <Text style={[styles.tagLabel, { color: tone.fg }]}>{status}</Text>
    </View>
  );
}

export function TournamentsScreen(props: TournamentsProps = {}): ReactElement {
  const {
    tournaments = [],
    joinedIds = [],
    joiningId = null,
    loading = false,
    loadError = null,
    onJoin,
    onSelect,
    onRetry,
  } = props;
  const isEmpty = tournaments.length === 0;

  return (
    <View style={styles.screen}>
      <TopFilterBar />
      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Contests</Text>
          {loadError && !isEmpty ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{loadError}</Text>
            </View>
          ) : null}
          {loading && isEmpty ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={INK} />
              <Text style={styles.emptyBody}>Loading contests…</Text>
            </View>
          ) : loadError && isEmpty ? (
            <View style={styles.loading}>
              <Text style={styles.emptyTitle}>Couldn't load contests</Text>
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
          ) : isEmpty ? (
            <View style={styles.loading}>
              <Text style={styles.emptyTitle}>No contests right now</Text>
              <Text style={styles.emptyBody}>Check back soon.</Text>
            </View>
          ) : (
          tournaments.map((t) => {
            const joined = joinedIds.includes(t.id);
            const joining = joiningId === t.id;
            return (
              <Pressable
                key={t.id}
                accessibilityRole="button"
                onPress={() => onSelect?.(t.id)}
                style={({ pressed }) => [
                  styles.card,
                  pressed ? styles.pressed : null,
                ]}
              >
                <View style={styles.headRow}>
                  <Text style={styles.name}>{t.name}</Text>
                  <StatusTag status={t.status} />
                </View>
                <Text style={styles.meta}>
                  {t.entrants} entrants · {t.prize}
                </Text>
                {t.rank ? (
                  <Text style={styles.rank}>You rank {t.rank}</Text>
                ) : null}
                <View style={styles.actionRow}>
                  {joined ? (
                    <View style={styles.joined}>
                      <Text style={styles.joinedLabel}>Joined ✓</Text>
                    </View>
                  ) : t.status === "Ended" ? null : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Join ${t.name}`}
                      disabled={joining}
                      onPress={() => onJoin?.(t.id)}
                      style={({ pressed }) => [
                        styles.join,
                        joining || pressed ? styles.pressed : null,
                      ]}
                    >
                      <Text style={styles.joinLabel}>
                        {joining ? "Joining…" : "Join"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          })
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: { alignItems: "flex-start", marginTop: 4 },
  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginHorizontal: 20,
    padding: 16,
  },
  headRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  emptyBody: { color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center" },
  emptyTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 22, textAlign: "center" },
  join: {
    alignItems: "center",
    backgroundColor: INK,
    borderRadius: 9999,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  joinLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", lineHeight: 18 },
  joined: {
    alignItems: "center",
    backgroundColor: SHEET,
    borderRadius: 9999,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  joinedLabel: { color: SECONDARY, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  loading: { alignItems: "center", gap: 12, paddingVertical: 48 },
  meta: { color: SECONDARY, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  name: { color: INK, flex: 1, fontSize: 18, fontWeight: "700", lineHeight: 26 },
  notice: {
    backgroundColor: "rgba(217, 45, 32, 0.08)",
    borderColor: "rgba(217, 45, 32, 0.30)",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  noticeText: { color: DOWN, fontSize: 13, fontWeight: "600", lineHeight: 18, textAlign: "center" },
  pressed: { opacity: 0.85 },
  rank: { color: MUTED, fontSize: 12, fontWeight: "500", lineHeight: 16 },
  retry: {
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 9999,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryLabel: { color: INK, fontSize: 14, fontWeight: "600" },
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
  tag: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 9999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagDot: { borderRadius: 9999, height: 6, width: 6 },
  tagLabel: { fontSize: 12, fontWeight: "600", lineHeight: 15 },
  title: {
    color: INK,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 30,
    paddingHorizontal: 20,
  },
});

export default TournamentsScreen;
