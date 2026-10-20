import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SectionHead } from "./TabChrome";
import { coinColor, coinName, tintForName } from "./coinMeta";
import { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { AMBER, AMBER_SOFT, BG, BORDER, CARD, CARD_SOFT, DOWN, DOWN_SOFT, FONT, INDIGO, INDIGO_SOFT, INK, MONO, MUTED, ON_ACCENT, PAPER, RADIUS, SECONDARY, SHADOW_SOFT, SHEET, SMOKE, UP, UP_SOFT } from "./homeTheme";
import { PillButton } from "./ui";
import { normalizeAmountInput, parseAmount } from "../amount";
import { PullToRefresh } from "./PullToRefresh";
import { LabelInput } from "./LabelInput";
import { AssetSwap } from "./AssetSwap";
import { Checklist, ChecklistItem } from "./Checklist";
import { DynamicIsland } from "./DynamicIsland";
import { ApiError } from "../api";
import { ActivityRow, CopyRow, DashboardProps, PositionRow } from "./types";

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
        <Ionicons name={icon} size={22} color={INK} />
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

/** 0x1234…abcd for the swap panel's one-line values. */
function shortAddress(a: string): string {
  const s = a.trim();
  return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}

export function DashboardScreen(props: DashboardProps = {}): ReactElement {
  const {
    equity = "0.00",
    changePct,
    equitySeries,
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
  // The card takes a number; the API hands back a formatted string.
  const balanceNum = Number(equity.replace(/,/g, "")) || 0;

  // ── the hero's history ─────────────────────────────────────────
  // The three windows are tails of ONE recorded series, not three
  // invented resolutions: 1H is the last hour of readings and 1D is
  // all of them, so choosing a window changes the span of the change,
  // never the shape of the line. When the server has no snapshots yet
  // the honest fallback is the two-point "day's start → now" line the
  // known change implies; with neither, the card draws the balance
  // flat rather than pretend a curve.
  const history =
    equitySeries && equitySeries.length >= 2 ? equitySeries : null;
  const heroSeries = useMemo(() => {
    if (history) return history.map((point) => point.e);
    if (
      typeof changePct === "number" &&
      Number.isFinite(changePct) &&
      balanceNum > 0
    ) {
      return [balanceNum / (1 + changePct / 100), balanceNum];
    }
    return undefined;
  }, [history, changePct, balanceNum]);

  const heroTimes = useMemo(
    () => history?.map((point) => point.t),
    [history],
  );

  // Each window takes however many readings fall inside it, counted
  // from the timestamps rather than assumed from a fixed cadence — so
  // a denser or sparser series still answers "the last hour" exactly.
  // `span` tells the truth about a young account too: when the record
  // starts after the window does, it says when, instead of implying a
  // full hour of history that was never recorded.
  const heroWindows = useMemo(() => {
    if (!history) return undefined;
    const end = history[history.length - 1].t;
    const start = history[0].t;
    const within = (ms: number) =>
      Math.max(2, history.filter((point) => point.t >= end - ms).length);
    const span = (ms: number, fallback: string) => {
      if (start > end - ms) {
        const clock = new Date(start).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        return `since ${clock}`;
      }
      return fallback;
    };
    return [
      {
        id: "1h",
        label: "1H",
        take: within(60 * 60_000),
        span: span(60 * 60_000, "past hour"),
      },
      {
        id: "4h",
        label: "4H",
        take: within(4 * 60 * 60_000),
        span: span(4 * 60 * 60_000, "past 4 hours"),
      },
      {
        id: "1d",
        label: "1D",
        take: within(24 * 60 * 60_000),
        span: span(24 * 60 * 60_000, "today"),
      },
    ];
  }, [history]);

  // ── the get-started list ──────────────────────────────────
  // Four steps, each read off state we already have rather than
  // tracked separately. Ticking one is completing it, so there is
  // nothing to keep in step.
  const setupItems: ChecklistItem[] = [
    {
      id: "passkey",
      label: "Create your passkey",
      done: Boolean(walletAddress),
    },
    { id: "fund", label: "Fund your aUSD balance", done: balanceNum > 0 },
    { id: "connect", label: "Connect Perpl", done: Boolean(perplConnected) },
    {
      id: "trade",
      label: "Place your first trade",
      done: positions.length > 0 || activity.length > 0,
    },
  ];
  const setupDone = setupItems.every((item) => item.done);

  // The card is only interesting while it is unfinished. When the
  // last step lands we keep it up long enough for the rows to fall,
  // then let it go — a checklist that congratulates you forever is
  // a checklist nobody reads.
  const wasDone = useRef(setupDone);
  const [holdFinished, setHoldFinished] = useState(false);
  useEffect(() => {
    if (setupDone && !wasDone.current) {
      setHoldFinished(true);
      wasDone.current = true;
      const timer = setTimeout(() => setHoldFinished(false), 3400);
      return () => clearTimeout(timer);
    }
    wasDone.current = setupDone;
    return;
  }, [setupDone]);
  const showSetup = !setupDone || holdFinished;

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
        <View style={styles.islandRow}>
          <DynamicIsland
            accessibilityLabel={
              perplConnected ? "Perpl connected" : "Perpl not connected"
            }
            compact={
              <>
                <View
                  style={[
                    styles.islandDot,
                    { backgroundColor: perplConnected ? UP : MUTED },
                  ]}
                />
                <Text style={styles.islandCompactLabel}>
                  {perplConnected ? "Perpl live" : "Perpl off"}
                </Text>
              </>
            }
            expanded={
              <View style={styles.islandBody}>
                <Text style={styles.islandTitle}>
                  {perplConnected ? "Perpl connected" : "Perpl not connected"}
                </Text>
                <Text style={styles.islandSub}>
                  {perplConnected
                    ? "Monad Testnet · orders settle in ~1s"
                    : "Connect to place real orders"}
                </Text>
                {!perplConnected ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Connect Perpl"
                    onPress={() => onConnectPerpl?.()}
                    style={styles.islandBtn}
                  >
                    <Text style={styles.islandBtnLabel}>Connect</Text>
                  </Pressable>
                ) : null}
              </View>
            }
            openHeight={112}
          />
        </View>

        <PullToRefresh
          balance={balanceNum}
          caption="TOTAL EQUITY · aUSD"
          series={heroSeries}
          times={heroTimes}
          windows={heroWindows}
          onRefresh={onRefresh}
        />

        <View style={styles.heroMeta}>
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

        {showSetup ? (
          <View style={styles.setup}>
            <View style={styles.setupHead}>
              <Text style={styles.setupCaption}>GET STARTED</Text>
              <Text style={styles.setupProgress}>
                {setupItems.filter((item) => item.done).length}/
                {setupItems.length}
              </Text>
            </View>
            <Checklist
              items={setupItems}
              onPressItem={(id) => {
                if (id === "connect") onConnectPerpl?.();
                else if (id === "trade") onMarkets?.();
                else if (id === "fund") {
                  setCopied(false);
                  setReceiveOpen(true);
                }
              }}
            />
          </View>
        ) : null}

        {riskNotice ? (
          <View style={styles.riskBanner}>
            <Ionicons name="warning" size={16} color={AMBER} />
            <Text style={styles.riskText}>{riskNotice}</Text>
          </View>
        ) : null}

        {perplConnected === false ? (
          <View style={styles.connectCard}>
            <View style={styles.connectIcon}>
              <Ionicons name="link" size={20} color={INK} />
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
            <ActivityIndicator size="large" color={INK} />
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
                        <Text style={[styles.coinText, { color: INK }]}>
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
          <AssetSwap
            from={{
              label: "From",
              value: `${available ?? "0.00"} aUSD`,
              sub: "Your wallet · Monad Testnet",
            }}
            to={{
              label: "To",
              value:
                sendTo.trim().length > 0
                  ? shortAddress(sendTo)
                  : "Recipient address",
              sub: "aUSD transfer",
              mono: sendTo.trim().length > 0,
            }}
            onFlip={() => {
              setSendOpen(false);
              setCopied(false);
              setReceiveOpen(true);
            }}
            flipLabel="Switch to receive"
          />
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
              <LabelInput
                accessibilityLabel="Recipient address"
                editable={!sendBusy}
                label="To address"
                monospace
                onChangeText={(value) => {
                  setSendTo(value);
                  setSendError(null);
                }}
                value={sendTo}
              />
              <LabelInput
                accessibilityLabel="Amount in aUSD"
                editable={!sendBusy}
                keyboardType="decimal-pad"
                label="Amount (aUSD)"
                onChangeText={(value) => {
                  setSendAmount(normalizeAmountInput(value));
                  setSendError(null);
                }}
                value={sendAmount}
              />
              {sendError ? (
                <Text style={styles.sendError}>{sendError}</Text>
              ) : null}
              <PillButton
                label={sendBusy ? "Sending…" : "Send"}
                busy={sendBusy}
                onPress={() => {
                  const amount = parseAmount(sendAmount);
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
          <AssetSwap
            from={{
              label: "Asset",
              value: "aUSD",
              sub: "Monad Testnet",
            }}
            to={{
              label: "To",
              value: "Your wallet",
              sub: walletAddress
                ? shortAddress(walletAddress)
                : "Sign in to see your address",
              mono: Boolean(walletAddress),
            }}
            onFlip={() => {
              setReceiveOpen(false);
              setSendTo("");
              setSendAmount("");
              setSendError(null);
              setSendHash(null);
              setSendOpen(true);
            }}
            flipLabel="Switch to send"
          />
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
  headerTitle: { fontFamily: FONT, color: INK, fontSize: 28, fontWeight: "400", letterSpacing: -0.4, lineHeight: 32 },
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
  badgeLabel: { fontFamily: FONT, color: ON_ACCENT, fontSize: 11, fontWeight: "400", lineHeight: 14 },
  scroll: { gap: 16, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 8 },
  hero: {
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: RADIUS.card,
    gap: 8,
    paddingVertical: 24,
    ...SHADOW_SOFT,
  },
  heroCaption: {
    color: MUTED,
    fontFamily: FONT,
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 0.6,
    lineHeight: 14,
  },
  heroValue: {
    color: INK,
    fontFamily: FONT,
    fontSize: 40,
    fontWeight: "400",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.8,
    lineHeight: 42,
  },
  heroRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  heroMeta: { alignItems: "center", gap: 8 },
  setup: {
    backgroundColor: CARD,
    borderRadius: RADIUS.card,
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    ...SHADOW_SOFT,
  },
  setupHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 4,
    paddingHorizontal: 4,
  },
  setupCaption: {
    color: MUTED,
    fontFamily: FONT,
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 0.6,
    lineHeight: 14,
  },
  setupProgress: {
    color: SECONDARY,
    fontFamily: FONT,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
  },
  islandRow: { alignItems: "flex-start", flexDirection: "row" },
  islandDot: { borderRadius: 4, height: 7, marginRight: 8, width: 7 },
  islandCompactLabel: {
    color: PAPER,
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  islandBody: { gap: 4 },
  islandTitle: {
    color: PAPER,
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: -0.2,
    lineHeight: 19,
  },
  islandSub: { fontFamily: FONT, color: SMOKE, fontSize: 12, lineHeight: 16 },
  islandBtn: {
    alignSelf: "flex-start",
    backgroundColor: PAPER,
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  islandBtnLabel: { fontFamily: FONT, color: INK, fontSize: 12, fontWeight: "400" },
  pnlPill: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pnlLabel: { fontFamily: FONT, fontSize: 12, fontWeight: "400", lineHeight: 15 },
  heroAvailable: { fontFamily: FONT, color: SECONDARY, fontSize: 13, lineHeight: 19 },
  heroUpdated: { fontFamily: FONT, color: MUTED, fontSize: 11, lineHeight: 14 },
  actions: { flexDirection: "row", gap: 8 },
  transferRow: { flexDirection: "row", gap: 8 },
  transferHalf: { flex: 1 },
  fieldLabel: { fontFamily: FONT, color: INK, fontSize: 14, fontWeight: "400", lineHeight: 20 },
  input: {
    backgroundColor: PAPER,
    borderColor: BORDER,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    color: INK,
    fontFamily: FONT,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendError: { fontFamily: FONT, color: DOWN, fontSize: 13, fontWeight: "400", lineHeight: 18 },
  successCard: { alignItems: "center", gap: 8, paddingVertical: 12 },
  successTitle: { fontFamily: FONT, color: INK, fontSize: 18, fontWeight: "400", lineHeight: 24 },
  hash: { color: MUTED, fontFamily: MONO, fontSize: 12, lineHeight: 16 },
  addressBox: {
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.input,
    padding: 16,
  },
  addressText: { color: INK, fontFamily: MONO, fontSize: 13, lineHeight: 20 },
  action: {
    alignItems: "center",
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.card,
    flex: 1,
    gap: 8,
    paddingVertical: 16,
  },
  actionIcon: {
    alignItems: "center",
    backgroundColor: PAPER,
    borderRadius: RADIUS.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  actionLabel: { fontFamily: FONT, color: INK, fontSize: 12, fontWeight: "400", lineHeight: 15 },
  riskBanner: {
    alignItems: "center",
    backgroundColor: AMBER_SOFT,
    borderRadius: RADIUS.card,
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  riskText: { fontFamily: FONT, color: AMBER, flex: 1, fontSize: 13, fontWeight: "400", lineHeight: 19 },
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
  connectMain: { flex: 1, gap: 4 },
  connectTitle: { fontFamily: FONT, color: INK, fontSize: 15, fontWeight: "400", lineHeight: 20 },
  connectBody: { fontFamily: FONT, color: SECONDARY, fontSize: 13, lineHeight: 18 },
  connectButton: {
    backgroundColor: INDIGO,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  connectButtonLabel: { fontFamily: FONT, color: ON_ACCENT, fontSize: 13, fontWeight: "400" },
  loading: { alignItems: "center", gap: 12, paddingVertical: 48 },
  loadingText: { fontFamily: FONT, color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center" },
  empty: { alignItems: "center", gap: 4, paddingVertical: 20 },
  emptyTitle: { fontFamily: FONT, color: INK, fontSize: 15, fontWeight: "400", lineHeight: 22 },
  emptyBody: { fontFamily: FONT, color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center" },
  hairline: { backgroundColor: BORDER, height: 1, width: "100%" },
  pressed: { opacity: 0.85 },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
  },
  rowMain: { flex: 1, gap: 4 },
  rowRight: { alignItems: "flex-end", gap: 4 },
  rowTitle: { fontFamily: FONT, color: INK, fontSize: 15, fontWeight: "400", lineHeight: 20 },
  rowDetail: { fontFamily: FONT, color: MUTED, fontSize: 12, lineHeight: 16 },
  rowAmount: {
    color: INK,
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: "400",
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
  rowPnl: { fontFamily: FONT, fontSize: 12, fontWeight: "400", lineHeight: 15 },
  up: { color: UP },
  down: { color: DOWN },
  coin: {
    alignItems: "center",
    borderRadius: RADIUS.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  coinText: { fontFamily: FONT, color: PAPER, fontSize: 17, fontWeight: "400" },
  list: {
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pauseAll: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 16,
  },
  pauseAllLabel: { fontFamily: FONT, color: DOWN, fontSize: 14, fontWeight: "400" },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusPillLabel: { fontFamily: FONT, fontSize: 12, fontWeight: "400", lineHeight: 15 },
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
  sheetTitle: { fontFamily: FONT, color: INK, fontSize: 19, fontWeight: "400", lineHeight: 26 },
  sheetBody: { fontFamily: FONT, color: SECONDARY, fontSize: 14, lineHeight: 21 },
});

export default DashboardScreen;
