import { ReactElement } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AMBER, AMBER_SOFT, BG, BORDER, CARD, DOWN, DOWN_SOFT, FONT, INK, MUTED, RADIUS, SECONDARY, UP, UP_SOFT } from "./homeTheme";
import { PillButton } from "./ui";
import { TournamentRow, TournamentsProps } from "./types";

function StatusTag({ status }: { status: TournamentRow["status"] }) {
  const tone =
    status === "Live"
      ? { bg: UP_SOFT, fg: UP }
      : status === "Upcoming"
        ? { bg: AMBER_SOFT, fg: AMBER }
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contests</Text>
        {tournaments.length > 0 ? (
          <View style={styles.count}>
            <Text style={styles.countLabel}>{tournaments.length}</Text>
          </View>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
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
            <Ionicons name="trophy-outline" size={28} color={MUTED} />
            <Text style={styles.emptyTitle}>Couldn't load contests</Text>
            <Text style={styles.emptyBody}>{loadError}</Text>
            {onRetry ? (
              <PillButton label="Try again" variant="secondary" onPress={onRetry} />
            ) : null}
          </View>
        ) : isEmpty ? (
          <View style={styles.loading}>
            <Ionicons name="trophy-outline" size={28} color={MUTED} />
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
                accessibilityLabel={`${t.name}, ${t.status}`}
                onPress={() => onSelect?.(t.id)}
                style={({ pressed }) => [
                  styles.card,
                  pressed ? styles.pressed : null,
                ]}
              >
                <View style={styles.headRow}>
                  <View style={styles.trophy}>
                    <Ionicons name="trophy" size={20} color={AMBER} />
                  </View>
                  <View style={styles.headMain}>
                    <Text style={styles.name} numberOfLines={1}>
                      {t.name}
                    </Text>
                    <Text style={styles.meta}>
                      {t.entrants} entrants · {t.prize}
                    </Text>
                  </View>
                  <StatusTag status={t.status} />
                </View>
                {t.rank ? (
                  <View style={styles.rankRow}>
                    <Ionicons name="medal-outline" size={14} color={AMBER} />
                    <Text style={styles.rank}>You rank {t.rank}</Text>
                  </View>
                ) : null}
                {joined ? (
                  <View style={styles.joined}>
                    <Ionicons name="checkmark" size={14} color={UP} />
                    <Text style={styles.joinedLabel}>Joined</Text>
                  </View>
                ) : t.status === "Ended" ? null : (
                  <PillButton
                    label={joining ? "Joining…" : `Join · ${t.prize}`}
                    busy={joining}
                    onPress={() => onJoin?.(t.id)}
                  />
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: BG, flex: 1 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitle: { fontFamily: FONT, color: INK, fontSize: 26, fontWeight: "400", lineHeight: 32 },
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
  countLabel: { fontFamily: FONT, color: SECONDARY, fontSize: 13, fontWeight: "400" },
  scroll: { gap: 12, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 8 },
  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  pressed: { opacity: 0.85 },
  headRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  trophy: {
    alignItems: "center",
    backgroundColor: AMBER_SOFT,
    borderRadius: RADIUS.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  headMain: { flex: 1, gap: 4 },
  name: { fontFamily: FONT, color: INK, fontSize: 17, fontWeight: "400", lineHeight: 22 },
  meta: { fontFamily: FONT, color: SECONDARY, fontSize: 13, fontWeight: "400", lineHeight: 18 },
  rankRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  rank: { fontFamily: FONT, color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  joined: {
    alignItems: "center",
    borderColor: BORDER,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 12,
  },
  joinedLabel: { fontFamily: FONT, color: SECONDARY, fontSize: 14, fontWeight: "400", lineHeight: 20 },
  tag: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagDot: { borderRadius: RADIUS.pill, height: 6, width: 6 },
  tagLabel: { fontFamily: FONT, fontSize: 12, fontWeight: "400", lineHeight: 15 },
  loading: { alignItems: "center", gap: 8, paddingVertical: 48 },
  emptyTitle: { fontFamily: FONT, color: INK, fontSize: 15, fontWeight: "400", lineHeight: 22, textAlign: "center" },
  emptyBody: { fontFamily: FONT, color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center" },
  notice: {
    backgroundColor: DOWN_SOFT,
    borderRadius: RADIUS.card,
    padding: 12,
  },
  noticeText: { fontFamily: FONT, color: DOWN, fontSize: 13, fontWeight: "400", lineHeight: 18, textAlign: "center" },
});

export default TournamentsScreen;
