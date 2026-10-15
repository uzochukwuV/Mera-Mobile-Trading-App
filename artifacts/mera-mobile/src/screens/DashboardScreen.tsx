import { useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SectionHead } from "./TabChrome";
import { coinColor, coinName, tintForName } from "./coinMeta";
import {
  AMBER,
  AMBER_SOFT,
  BG,
  BORDER,
  CARD,
  CARD_SOFT,
  DOWN,
  DOWN_SOFT,
  INDIGO,
  INDIGO_SOFT,
  INK,
  MUTED,
  ON_ACCENT,
  PAPER,
  RADIUS,
  SECONDARY,
  SHADOW_SOFT,
  SHEET,
  UP,
  UP_SOFT,
} from "./homeTheme";
import { PillButton } from "./ui";
import { ApiError } from "../api";
import type {
  ActivityRow,
  CopyRow,
  DashboardProps,
  PositionRow,
} from "./types";

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Filled" || status === "Active"
      ? { bg: UP_SOFT, fg: UP }
      : status === "Failed"
        ? { bg: DOWN_SOFT, fg: DOWN }
        : status === "Partial" || status === "Paused"
          ? { bg: AMBER_SOFT, fg: AMBER }
          : { bg: CARD_SOFT, fg: SECONDARY };
  return (
    <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
      <Text style={[styles.statusPillLabel, { color: tone.fg }]}>{status}</Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color={INDIGO} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ title, body, icon }: { title: string; body: string; icon: keyof typeof Ionicons.glyphMap }): ReactElement {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={28} color={MUTED} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

export function DashboardScreen(props: DashboardProps = {}): ReactElement {
  const {
    equity = "0.00",
    available,
    walletAddress,
    onSendAusd,
    lastUpdatedSecondsAgo = 0,
    unread = 0,
    realizedPnlToday = "+0.00",
    realizedPnlUp = true,
    riskNotice = null,
    positions = [],
    copies = [],
    activity = [],
    loading = false,
    loadError = null,
    refreshing = false,
    onRefresh,
    perplConnected,
    onConnectPerpl,
    onKillSwitch,
    onCopyTrader,
    onMarkets,
    onManageCopies,
    onSeeActivity,
  } = props;

  const [killOpen, setKillOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendBusy, setSendBusy] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendHash, setSendHash] = useState<string | null>(null);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const isEmpty =
    positions.length === 0 && copies.length === 0 && activity.length === 0;
  const updatedLabel =
    lastUpdatedSecondsAgo < 60
      ? `Updated ${lastUpdatedSecondsAgo}s ago`
      : `Updated ${Math.floor(lastUpdatedSecondsAgo / 60)}m ago`;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Activity${unread > 0 ? `, ${unread} unread` : ""}`}
          hitSlop={8}
          onPress={() => onSeeActivity?.()}
          style={styles.bell}
        >
          <Ionicons name="notifications-outline" size={24} color={INK} />
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>
                {unread > 9 ? "9+" : String(unread)}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

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
        <View style={styles.hero}>
          <Text style={styles.heroCaption}>TOTAL EQUITY · aUSD</Text>
          <Text style={styles.heroValue}>{equity}</Text>
          <View style={styles.heroRow}>
            <View
              style={[
                styles.pnlPill,
                { backgroundColor: realizedPnlUp ? UP_SOFT : DOWN_SOFT },
              ]}
            >
              <Ionicons
                name={realizedPnlUp ? "arrow-up" : "arrow-down"}
                size={12}
                color={realizedPnlUp ? UP : DOWN}
              />
              <Text
                style={[
                  styles.pnlLabel,
                  { color: realizedPnlUp ? UP : DOWN },
                ]}
              >
                {realizedPnlToday} today
              </Text>
            </View>
            {available !== undefined ? (
              <Text style={styles.heroAvailable}>{available} available</Text>
            ) : null}
          </View>
          <Text style={styles.heroUpdated}>{updatedLabel}</Text>
        </View>

        <View style={styles.actions}>
          <QuickAction icon="stats-chart" label="Markets" onPress={() => onMarkets?.()} />
          <QuickAction icon="people" label="Copy" onPress={() => onCopyTrader?.()} />
          <QuickAction icon="time" label="Activity" onPress={() => onSeeActivity?.()} />
        </View>

        <View style={styles.transferRow}>
          <View style={styles.transferHalf}>
            <PillButton
              label="Send"
              icon={<Ionicons name="arrow-up" size={18} color={PAPER} />}
              onPress={() => {
                setSendTo("");
                setSendAmount("");
                setSendError(null);
                setSendHash(null);
                setSendOpen(true);
              }}
            />
          </View>
          <View style={styles.transferHalf}>
            <PillButton
              label="Receive"
              variant="secondary"
              icon={<Ionicons name="arrow-down" size={18} color={INK} />}
              onPress={() => {
                setCopied(false);
                setReceiveOpen(true);
              }}
            />
          </View>
        </View>

        {riskNotice ? (
          <View style={styles.riskBanner}>
            <Ionicons name="warning" size={16} color={AMBER} />
            <Text style={styles.riskText}>{riskNotice}</Text>
          </View>
        ) : null}

        {perplConnected === false ? (
          <View style={styles.connectCard}>
            <View style={styles.connectIcon}>
              <Ionicons name="link" size={20} color={INDIGO} />
            </View>
            <View style={styles.connectMain}>
              <Text style={styles.connectTitle}>Connect Perpl to trade</Text>
              <Text style={styles.connectBody}>
                Enroll a trading key to start.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Connect Perpl"
              onPress={() => onConnectPerpl?.()}
              style={({ pressed }) => [
                styles.connectButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.connectButtonLabel}>Connect</Text>
            </Pressable>
          </View>
        ) : null}

        {loading && isEmpty ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={INDIGO} />
            <Text style={styles.loadingText}>Loading live data…</Text>
          </View>
        ) : loadError && isEmpty ? (
          <View style={styles.loading}>
            <Text style={styles.emptyTitle}>Couldn't load dashboard</Text>
            <Text style={styles.loadingText}>{loadError}</Text>
            {onRefresh ? (
              <PillButton label="Try again" variant="secondary" onPress={onRefresh} />
            ) : null}
          </View>
        ) : (
          <>
            <SectionHead title="Positions" action={positions.length > 0 ? `${positions.length}` : ""} onAction={undefined} />
            <View style={styles.list}>
              {positions.length === 0 ? (
                <EmptyState
                  icon="wallet-outline"
                  title="No open positions"
                  body="Fund your wallet to start trading."
                />
              ) : (
                positions.map((row, index) => (
                  <View key={`${row.symbol}-${index}`}>
                    {index > 0 ? <View style={styles.hairline} /> : null}
                    <View style={styles.row}>
                      <View
                        style={[styles.coin, { backgroundColor: coinColor(row.symbol) }]}
                      >
                        <Text style={styles.coinText}>{row.symbol.slice(0, 1)}</Text>
                      </View>
                      <View style={styles.rowMain}>
                        <Text style={styles.rowTitle}>
                          {coinName(row.symbol)}{" "}
                          <Text style={styles.rowDetail}>{row.symbol}</Text>
                        </Text>
                        <Text style={styles.rowDetail}>{row.mark}</Text>
                      </View>
                      <View style={styles.rowRight}>
                        <Text style={styles.rowAmount}>{row.size}</Text>
                        <Text
                          style={[
                            styles.rowPnl,
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

            <SectionHead title="Copying" action="Manage" onAction={onManageCopies} />
            <View style={styles.list}>
              {copies.length === 0 ? (
                <EmptyState
                  icon="people-outline"
                  title="Not copying anyone"
                  body="Pick a trader to start."
                />
              ) : (
                copies.map((row, index) => (
                  <View key={row.handle}>
                    {index > 0 ? <View style={styles.hairline} /> : null}
                    <View style={styles.row}>
                      <View style={[styles.coin, { backgroundColor: INDIGO_SOFT }]}>
                        <Text style={[styles.coinText, { color: INDIGO }]}>
                          {row.handle.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.rowMain}>
                        <Text style={styles.rowTitle}>{row.handle}</Text>
                        <Text style={styles.rowDetail}>{row.allocation} aUSD</Text>
                      </View>
                      <StatusPill status={row.status} />
                    </View>
                  </View>
                ))
              )}
              {copies.length > 0 ? (
                <>
                  <View style={styles.hairline} />
                  <Pressable
                    accessibilityLabel="Pause all copying"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => setKillOpen(true)}
                    style={styles.pauseAll}
                  >
                    <Ionicons name="pause" size={14} color={DOWN} />
                    <Text style={styles.pauseAllLabel}>Pause all</Text>
                  </Pressable>
                </>
              ) : null}
            </View>

            <SectionHead title="Activity" action="See all" onAction={onSeeActivity} />
            <View style={styles.list}>
              {activity.length === 0 ? (
                <EmptyState
                  icon="pulse-outline"
                  title="No recent activity"
                  body="Fills and risk events land here."
                />
              ) : (
                activity.slice(0, 5).map((row, index) => (
                  <View key={row.id}>
                    {index > 0 ? <View style={styles.hairline} /> : null}
                    <View style={styles.row}>
                      <View style={styles.rowMain}>
                        <Text style={styles.rowTitle}>{row.title}</Text>
                        <Text style={styles.rowDetail}>{row.detail}</Text>
                      </View>
                      <StatusPill status={row.status} />
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => setSendOpen(false)}
        transparent
        visible={sendOpen}
      >
        <Pressable style={styles.backdrop} onPress={() => setSendOpen(false)} />
        <View style={styles.sheetModal}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Send aUSD</Text>
          {available !== undefined ? (
            <Text style={styles.sheetBody}>Available: {available} aUSD</Text>
          ) : null}
          {sendHash ? (
            <>
              <View style={styles.successCard}>
                <Ionicons name="checkmark-circle" size={28} color={UP} />
                <Text style={styles.successTitle}>Sent</Text>
                <Text style={styles.hash} numberOfLines={1}>
                  {sendHash}
                </Text>
              </View>
              <PillButton label="Done" onPress={() => setSendOpen(false)} />
            </>
          ) : (
            <>
              <Text style={styles.fieldLabel}>To address</Text>
              <TextInput
                accessibilityLabel="Recipient address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!sendBusy}
                onChangeText={(value) => {
                  setSendTo(value);
                  setSendError(null);
                }}
                placeholder="0x…"
                placeholderTextColor={MUTED}
                style={styles.input}
                value={sendTo}
              />
              <Text style={styles.fieldLabel}>Amount (aUSD)</Text>
              <TextInput
                accessibilityLabel="Amount in aUSD"
                editable={!sendBusy}
                keyboardType="decimal-pad"
                onChangeText={(value) => {
                  setSendAmount(value);
                  setSendError(null);
                }}
                placeholder="0.00"
                placeholderTextColor={MUTED}
                style={styles.input}
                value={sendAmount}
              />
              {sendError ? (
                <Text style={styles.sendError}>{sendError}</Text>
              ) : null}
              <PillButton
                label={sendBusy ? "Sending…" : "Send"}
                busy={sendBusy}
                onPress={() => {
                  const amount = Number(sendAmount);
                  if (!onSendAusd) {
                    setSendError("Sign in to send.");
                    return;
                  }
                  setSendBusy(true);
                  setSendError(null);
                  onSendAusd(sendTo.trim(), amount)
                    .then((hash) => setSendHash(hash))
                    .catch((caught) => {
                      setSendError(
                        caught instanceof ApiError
                          ? caught.message
                          : caught instanceof Error
                            ? caught.message
                            : "Couldn't send.",
                      );
                    })
                    .finally(() => setSendBusy(false));
                }}
              />
              <PillButton
                label="Cancel"
                variant="ghost"
                onPress={() => setSendOpen(false)}
              />
            </>
          )}
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setReceiveOpen(false)}
        transparent
        visible={receiveOpen}
      >
        <Pressable style={styles.backdrop} onPress={() => setReceiveOpen(false)} />
        <View style={styles.sheetModal}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Receive aUSD</Text>
          <Text style={styles.sheetBody}>
            Share this address. Monad Testnet only.
          </Text>
          <View style={styles.addressBox}>
            <Text style={styles.addressText} selectable>
              {walletAddress ?? "Sign in to see your address."}
            </Text>
          </View>
          {walletAddress ? (
            <PillButton
              label={copied ? "Copied ✓" : "Copy address"}
              variant={copied ? "secondary" : "primary"}
              onPress={() => {
                import("expo-clipboard")
                  .then(({ setStringAsync }) => setStringAsync(walletAddress))
                  .then(() => setCopied(true))
                  .catch(() => undefined);
              }}
            />
          ) : null}
          <PillButton
            label="Done"
            variant="ghost"
            onPress={() => setReceiveOpen(false)}
          />
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setKillOpen(false)}
        transparent
        visible={killOpen}
      >
        <Pressable style={styles.backdrop} onPress={() => setKillOpen(false)} />
        <View style={styles.sheetModal}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Pause all copying?</Text>
          <Text style={styles.sheetBody}>
            Open copy orders are cancelled and no new copies are placed until
            you resume. Manual positions stay untouched.
          </Text>
          <PillButton
            label="Pause everything"
            variant="danger"
            onPress={() => {
              setKillOpen(false);
              onKillSwitch?.();
            }}
          />
          <PillButton
            label="Keep running"
            variant="ghost"
            onPress={() => setKillOpen(false)}
          />
        </View>
      </Modal>
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
  headerTitle: { color: INK, fontSize: 26, fontWeight: "700", lineHeight: 32 },
  bell: { padding: 4, position: "relative" },
  badge: {
    alignItems: "center",
    backgroundColor: INDIGO,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    minHeight: 18,
    minWidth: 18,
    paddingHorizontal: 4,
    position: "absolute",
    right: 0,
    top: 0,
  },
  badgeLabel: { color: PAPER, fontSize: 11, fontWeight: "700", lineHeight: 14 },
  scroll: { gap: 16, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 8 },
  hero: {
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: RADIUS.card,
    gap: 6,
    paddingVertical: 24,
    ...SHADOW_SOFT,
  },
  heroCaption: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    lineHeight: 14,
  },
  heroValue: {
    color: INK,
    fontSize: 34,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
    lineHeight: 41,
  },
  heroRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  pnlPill: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pnlLabel: { fontSize: 12, fontWeight: "600", lineHeight: 15 },
  heroAvailable: { color: SECONDARY, fontSize: 13, lineHeight: 19 },
  heroUpdated: { color: MUTED, fontSize: 11, lineHeight: 14 },
  actions: { flexDirection: "row", gap: 8 },
  transferRow: { flexDirection: "row", gap: 8 },
  transferHalf: { flex: 1 },
  fieldLabel: { color: INK, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  input: {
    backgroundColor: PAPER,
    borderColor: BORDER,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    color: INK,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sendError: { color: DOWN, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  successCard: { alignItems: "center", gap: 6, paddingVertical: 12 },
  successTitle: { color: INK, fontSize: 18, fontWeight: "700", lineHeight: 24 },
  hash: { color: MUTED, fontFamily: "Menlo", fontSize: 12, lineHeight: 16 },
  addressBox: {
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.input,
    padding: 14,
  },
  addressText: { color: INK, fontFamily: "Menlo", fontSize: 13, lineHeight: 20 },
  action: {
    alignItems: "center",
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.card,
    flex: 1,
    gap: 6,
    paddingVertical: 14,
  },
  actionIcon: {
    alignItems: "center",
    backgroundColor: PAPER,
    borderRadius: RADIUS.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  actionLabel: { color: INK, fontSize: 12, fontWeight: "600", lineHeight: 15 },
  riskBanner: {
    alignItems: "center",
    backgroundColor: AMBER_SOFT,
    borderRadius: RADIUS.card,
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  riskText: { color: AMBER, flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 19 },
  connectCard: {
    alignItems: "center",
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  connectIcon: {
    alignItems: "center",
    backgroundColor: INDIGO_SOFT,
    borderRadius: RADIUS.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  connectMain: { flex: 1, gap: 2 },
  connectTitle: { color: INK, fontSize: 15, fontWeight: "700", lineHeight: 20 },
  connectBody: { color: SECONDARY, fontSize: 13, lineHeight: 18 },
  connectButton: {
    backgroundColor: INDIGO,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  connectButtonLabel: { color: PAPER, fontSize: 13, fontWeight: "700" },
  loading: { alignItems: "center", gap: 12, paddingVertical: 48 },
  loadingText: { color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center" },
  empty: { alignItems: "center", gap: 4, paddingVertical: 20 },
  emptyTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 22 },
  emptyBody: { color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center" },
  hairline: { backgroundColor: BORDER, height: 1, width: "100%" },
  pressed: { opacity: 0.85 },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
  },
  rowMain: { flex: 1, gap: 2 },
  rowRight: { alignItems: "flex-end", gap: 4 },
  rowTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  rowDetail: { color: MUTED, fontSize: 12, lineHeight: 16 },
  rowAmount: {
    color: INK,
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
  rowPnl: { fontSize: 12, fontWeight: "600", lineHeight: 15 },
  up: { color: UP },
  down: { color: DOWN },
  coin: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  coinText: { color: PAPER, fontSize: 17, fontWeight: "800" },
  list: {
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pauseAll: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    paddingVertical: 14,
  },
  pauseAllLabel: { color: DOWN, fontSize: 14, fontWeight: "600" },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillLabel: { fontSize: 12, fontWeight: "600", lineHeight: 15 },
  backdrop: { backgroundColor: "rgba(0, 0, 0, 0.6)", flex: 1 },
  handle: {
    alignSelf: "center",
    backgroundColor: BORDER,
    borderRadius: RADIUS.pill,
    height: 4,
    marginBottom: 8,
    width: 40,
  },
  sheetModal: {
    backgroundColor: CARD,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 12,
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  sheetTitle: { color: INK, fontSize: 19, fontWeight: "700", lineHeight: 26 },
  sheetBody: { color: SECONDARY, fontSize: 14, lineHeight: 21 },
});

export default DashboardScreen;
