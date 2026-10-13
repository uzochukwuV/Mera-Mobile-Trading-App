import type { ReactElement, ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../ui";
import { palette, radii, spacing } from "../theme";
import type { TournamentRow, TournamentsProps } from "./types";

const DEFAULT_TOURNAMENTS: TournamentRow[] = [
  { id: "summer-sprint", name: "Summer Sprint", status: "Live", entrants: "128", prize: "1,000 aUSD", rank: "12" },
  { id: "autumn-open", name: "Autumn Open", status: "Upcoming", entrants: "64", prize: "500 aUSD" },
  { id: "spring-cup", name: "Spring Cup", status: "Ended", entrants: "256", prize: "2,000 aUSD", rank: "4" },
];

type TagVariant = "forest" | "sunlit" | "fog";

function Tag({ variant, children }: { variant: TagVariant; children: ReactNode }) {
  return (
    <View style={[styles.tag, tagStyles[variant]]}>
      <Text style={[styles.tagLabel, tagLabelStyles[variant]]}>{children}</Text>
    </View>
  );
}

const tagStyles = {
  forest: { backgroundColor: palette.forest },
  sunlit: { backgroundColor: palette.sunlitCream },
  fog: { backgroundColor: palette.surfaceMuted },
} as const;

const tagLabelStyles = {
  forest: { color: palette.textInverse },
  sunlit: { color: palette.emberBrown },
  fog: { color: palette.graphite },
} as const;

function statusVariant(status: TournamentRow["status"]): TagVariant {
  if (status === "Live") return "forest";
  if (status === "Upcoming") return "sunlit";
  return "fog";
}

export function TournamentsScreen(props: TournamentsProps = {}): ReactElement {
  const {
    tournaments = DEFAULT_TOURNAMENTS,
    joinedIds = [],
    onJoin,
    onSelect,
  } = props;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Contests</Text>

        {tournaments.map((t) => {
          const joined = joinedIds.includes(t.id);
          return (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              onPress={() => onSelect?.(t.id)}
              style={({ pressed }) => [pressed ? styles.pressed : null]}
            >
              <Card style={styles.card}>
                <View style={styles.headRow}>
                  <Text style={styles.name}>{t.name}</Text>
                  <Tag variant={statusVariant(t.status)}>{t.status}</Tag>
                </View>
                <Text style={styles.meta}>
                  {t.entrants} entrants · {t.prize}
                </Text>
                {t.rank ? <Text style={styles.rank}>You rank {t.rank}</Text> : null}
                <View style={styles.actionRow}>
                  {joined ? (
                    <Tag variant="fog">Joined ✓</Tag>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onJoin?.(t.id)}
                      style={({ pressed }) => [styles.join, pressed ? styles.pressed : null]}
                    >
                      <Text style={styles.joinLabel}>Join</Text>
                    </Pressable>
                  )}
                </View>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: { alignItems: "flex-start" },
  card: { gap: spacing.xs },
  headRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  join: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: palette.border,
    borderRadius: radii.button,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  joinLabel: { color: palette.graphite, fontSize: 12, fontWeight: "500", lineHeight: 16 },
  meta: { color: palette.graphite, fontSize: 12, fontWeight: "500", lineHeight: 15 },
  name: { color: palette.ink, flex: 1, fontSize: 18, fontWeight: "600", lineHeight: 26 },
  pressed: { opacity: 0.85 },
  rank: { color: palette.slate, fontSize: 12, fontWeight: "500", lineHeight: 15 },
  screen: { backgroundColor: palette.bg, flex: 1 },
  scroll: { gap: spacing.md, paddingBottom: spacing.xl, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  tag: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagLabel: { fontSize: 12, fontWeight: "500", lineHeight: 15 },
  title: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.37,
    lineHeight: 31,
  },
});

export default TournamentsScreen;
