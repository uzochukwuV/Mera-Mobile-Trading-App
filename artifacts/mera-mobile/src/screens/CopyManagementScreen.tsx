import { useEffect, useState, type ReactElement } from "react";
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
import { ApiError, getRiskEvents, orderTimeLabel, type RiskEvent } from "../api";
import { tintForName } from "./coinMeta";
import {
  AMBER,
  AMBER_SOFT,
  BG,
  BORDER,
  CARD,
  DOWN,
  DOWN_SOFT,
  INK,
  MUTED,
  RADIUS,
  SECONDARY,
  TEAL,
  UP,
  UP_SOFT,
} from "./homeTheme";
import type { CopyManagementProps, CopySettingRow } from "./types";

function StatusTag({ status }: { status: CopySettingRow["status"] }) {
  const active = status === "Active";
  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: active ? UP_SOFT : AMBER_SOFT },
      ]}
    >
      <View
        style={[
          styles.tagDot,
          { backgroundColor: active ? UP : AMBER },
        ]}
      />
      <Text style={[styles.tagLabel, { color: active ? UP : AMBER }]}>
        {status}
      </Text>
    </View>
  );
}

function MiniButton({
  title,
  onPress,
  danger,
}: {
  title: string;
  onPress?: () => void;
  danger?: boolean;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.mini,
        danger ? styles.miniDanger : styles.miniGhost,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.miniLabel, danger ? styles.miniLabelDanger : styles.miniLabelGhost]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function CopyManagementScreen(props: CopyManagementProps = {}): ReactElement {
  const {
    copies = [],
    loading = false,
    loadError = null,
    refreshing = false,
    onRefresh,
    onPause,
    onResume,
    onStop,
    onEdit,
    onKillSwitch,
    onBack,
  } = props;
  const isEmpty = copies.length === 0;
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Guardrail history: why a copy paused or an order was skipped.
  useEffect(() => {
    let stale = false;
    getRiskEvents(20)
      .then((rows) => {
        if (!stale) setEvents(rows);
      })
      .catch((caught) => {
        if (!stale) {
          setEventsError(
            caught instanceof ApiError ? caught.message : "Couldn't load guardrail activity",
          );
        }
      });
    return () => {
      stale = true;
    };
  }, []);

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
        <Text style={styles.title}>Copying</Text>

        {loading && isEmpty ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={INK} />
            <Text style={styles.emptyBody}>Loading copies…</Text>
          </View>
        ) : loadError && isEmpty ? (
          <View style={styles.loading}>
            <Text style={styles.emptyTitle}>Couldn't load copies</Text>
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
        ) : (
          <>
            {loadError ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>{loadError}</Text>
              </View>
            ) : null}
            {isEmpty ? (
              <View style={styles.card}>
                <Text style={styles.emptyTitle}>Not copying anyone</Text>
                <Text style={styles.emptyBody}>
                  Find a trader on the Traders tab to start.
                </Text>
              </View>
            ) : (
              copies.map((copy) => {
                const tint = tintForName(copy.handle);
                return (
                  <View key={copy.leaderId} style={styles.card}>
                    <View style={styles.rowTop}>
                      <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
                        <Text style={[styles.avatarText, { color: tint.fg }]}>
                          {copy.handle.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.rowMain}>
                        <Text style={styles.handle}>{copy.handle}</Text>
                        <Text style={styles.allocation}>
                          {copy.allocation} aUSD
                        </Text>
                      </View>
                      <StatusTag status={copy.status} />
                    </View>
                    <View style={styles.actions}>
                      {copy.status === "Active" ? (
                        <MiniButton title="Pause" onPress={() => onPause?.(copy.leaderId)} />
                      ) : (
                        <MiniButton title="Resume" onPress={() => onResume?.(copy.leaderId)} />
                      )}
                      <MiniButton title="Stop" danger onPress={() => onStop?.(copy.leaderId)} />
                      <MiniButton title="Edit" onPress={() => onEdit?.(copy.leaderId)} />
                    </View>
                  </View>
                );
              })
            )}

            <View style={styles.card}>
              <Text style={styles.dangerTitle}>Guardrail activity</Text>
              {eventsError ? (
                <Text style={styles.emptyBody}>{eventsError}</Text>
              ) : events.length === 0 ? (
                <Text style={styles.emptyBody}>
                  No guardrail events yet — pauses and skipped orders show up here.
                </Text>
              ) : (
                events.map((event) => {
                  const reason =
                    typeof event.detail?.reason === "string"
                      ? event.detail.reason
                      : typeof event.detail?.message === "string"
                        ? event.detail.message
                        : null;
                  return (
                    <View key={event.id}>
                      <View style={styles.hairline} />
                      <View style={styles.eventRow}>
                        <View style={styles.rowMain}>
                          <Text style={styles.eventType}>
                            {event.type.replace(/_/g, " ")}
                          </Text>
                          {reason ? (
                            <Text style={styles.eventDetail} numberOfLines={2}>
                              {reason}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={styles.eventTime}>
                          {orderTimeLabel(event.created_at)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.dangerTitle}>Stop everything</Text>
              <Text style={styles.dangerBody}>Pauses every copy at once.</Text>
              <Pressable
                accessibilityRole="button"
                onPress={onKillSwitch}
                style={({ pressed }) => [styles.kill, pressed ? styles.pressed : null]}
              >
                <Text style={styles.killLabel}>Stop everything</Text>
              </Pressable>
            </View>

            <Text style={styles.footnote}>Stopping keeps history.</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", gap: 8 },
  avatar: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  avatarText: { fontSize: 17, fontWeight: "700" },
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 2, paddingVertical: 4 },
  backLabel: { color: SECONDARY, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  allocation: { color: MUTED, fontSize: 12, fontVariant: ["tabular-nums"], fontWeight: "400", lineHeight: 16 },
  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  dangerBody: { color: MUTED, fontSize: 13, lineHeight: 19 },
  dangerTitle: { color: INK, fontSize: 18, fontWeight: "700", lineHeight: 24 },
  down: { color: DOWN },
  emptyBody: { color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center" },
  emptyTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 22, textAlign: "center" },
  footnote: { color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16, textAlign: "center" },
  handle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  kill: {
    alignItems: "center",
    borderColor: DOWN,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: "100%",
  },
  killLabel: { color: DOWN, fontSize: 16, fontWeight: "600", lineHeight: 22 },
  loading: { alignItems: "center", gap: 12, paddingVertical: 48 },
  mini: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  miniDanger: { backgroundColor: "transparent", borderColor: DOWN },
  miniGhost: { backgroundColor: "transparent", borderColor: BORDER },
  miniLabel: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  miniLabelDanger: { color: DOWN },
  miniLabelGhost: { color: SECONDARY },
  notice: {
    backgroundColor: DOWN_SOFT,
    borderColor: DOWN_SOFT,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  noticeText: { color: DOWN, fontSize: 13, fontWeight: "600", lineHeight: 18, textAlign: "center" },
  pressed: { opacity: 0.6 },
  retry: {
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: RADIUS.pill,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryLabel: { color: TEAL, fontSize: 14, fontWeight: "600" },
  rowMain: { flex: 1, gap: 2 },
  rowTop: { alignItems: "center", flexDirection: "row", gap: 12 },
  hairline: { backgroundColor: BORDER, height: 1, width: "100%" },
  eventRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8,
  },
  eventType: {
    color: INK,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    textTransform: "capitalize",
  },
  eventDetail: { color: MUTED, fontSize: 12, lineHeight: 16 },
  eventTime: { color: MUTED, fontSize: 12, lineHeight: 16 },
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 14, padding: 20, paddingBottom: 32 },
  tag: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagDot: { borderRadius: RADIUS.pill, height: 6, width: 6 },
  tagLabel: { fontSize: 12, fontWeight: "600", lineHeight: 15 },
  title: { color: INK, fontSize: 26, fontWeight: "700", letterSpacing: -0.4, lineHeight: 32 },
  up: { color: UP },
});

export default CopyManagementScreen;
