import { useState, type ReactElement, type ReactNode } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TopFilterBar } from "./TabChrome";
import { coinColor, coinName, tintForName } from "./coinMeta";
import type {
  ActivityRow,
  CopyRow,
  DashboardProps,
  PositionRow,
} from "./types";

const DEFAULT_POSITIONS: PositionRow[] = [
  { symbol: "BTC", side: "Long", size: "0.12", mark: "84,031.20", pnl: "+142.30", pnlUp: true },
  { symbol: "ETH", side: "Short", size: "1.40", mark: "2,531.16", pnl: "-28.12", pnlUp: false },
];

const DEFAULT_COPIES: CopyRow[] = [
  { handle: "satoshi-trades", allocation: "500.00", status: "Active" },
  { handle: "macro-desk", allocation: "250.00", status: "Paused" },
];

const DEFAULT_ACTIVITY: ActivityRow[] = [
  { id: "1", title: "Qash Transfer Completed", detail: "Your transfer of NGN 2,392 to VICTOR UZ…", status: "Filled", tone: "ok" },
  { id: "2", title: "Copy fill · ETH short", detail: "0.80 · macro-desk", status: "Partial", tone: "warning" },
  { id: "3", title: "Order submitted", detail: "SOL long · 2.00", status: "Submitted", tone: "neutral" },
  { id: "4", title: "Risk event", detail: "Daily loss limit hit", status: "Failed", tone: "error" },
];

// Light theme — local to Home (mirrors homeTheme).
const BG = "#F1F3F6";
const SHEET = "#FFFFFF";
const CARD = "#FFFFFF";
const CARD_SOFT = "#E9EDF2";
const BORDER = "#E2E7EE";
const INK = "#13171D";
const SECONDARY = "#5B6472";
const MUTED = "#8A94A6";
const TEAL = "#0E7C6B";
const ORANGE = "#FF6B1A";
const UP = "#178A4C";
const DOWN = "#D92D20";
const AMBER = "#B45309";
const PROMO = "#B8189C";
const PROMO_2 = "#4C1D95";

const { width: SCREEN_W } = Dimensions.get("window");
const PROMO_W = SCREEN_W - 40 - 28;
const PROMO_GAP = 12;

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Filled" || status === "Active"
      ? { bg: "rgba(52, 211, 153, 0.14)", fg: UP }
      : status === "Failed"
        ? { bg: "rgba(248, 113, 113, 0.14)", fg: DOWN }
        : status === "Partial" || status === "Paused"
          ? { bg: "rgba(251, 191, 36, 0.14)", fg: AMBER }
          : { bg: CARD_SOFT, fg: SECONDARY };
  return (
    <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
      <Text style={[styles.statusPillLabel, { color: tone.fg }]}>{status}</Text>
    </View>
  );
}

export function DashboardScreen(props: DashboardProps = {}): ReactElement {
  const {
    equity = "0.008",
    available,
    riskNotice = null,
    positions = DEFAULT_POSITIONS,
    copies = DEFAULT_COPIES,
    activity = DEFAULT_ACTIVITY,
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
  const [promoIndex, setPromoIndex] = useState(0);
  const update = activity[0];
  const isEmpty =
    positions.length === 0 && copies.length === 0 && activity.length === 0;

  function handlePromoScroll(e: NativeSyntheticEvent<NativeScrollEvent>): void {
    const index = Math.round(e.nativeEvent.contentOffset.x / (PROMO_W + PROMO_GAP));
    setPromoIndex(Math.max(0, Math.min(1, index)));
  }

  return (
    <View style={styles.screen}>
      <TopFilterBar
        onSearch={() => onSeeActivity?.()}
        onStocks={() => onMarkets?.()}
        onMoreMarkets={() => onMarkets?.()}
      />
      {/* Black sheet */}
      <View style={styles.sheet}>
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
          <Text style={styles.balanceCaption}>aUSD BALANCE</Text>
          <Text style={styles.balance}>{equity}</Text>
          {available !== undefined ? (
            <Text style={styles.walletCaption}>
              {available} aUSD in wallet
            </Text>
          ) : null}
          <Pressable
            accessibilityLabel="See more"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => onSeeActivity?.()}
            style={styles.seeMore}
          >
            <Text style={styles.seeMoreLabel}>See more</Text>
          </Pressable>

          {riskNotice ? (
            <View style={styles.riskBanner}>
              <Text style={styles.riskText}>{riskNotice}</Text>
            </View>
          ) : null}

          {perplConnected === false ? (
            <View style={styles.connectCard}>
              <View style={styles.connectMain}>
                <Text style={styles.connectTitle}>Connect Perpl to trade</Text>
                <Text style={styles.connectBody}>
                  Enroll a trading key, then fund your wallet to start.
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
              <ActivityIndicator size="large" color={TEAL} />
              <Text style={styles.loadingText}>Loading live data…</Text>
            </View>
          ) : loadError && isEmpty ? (
            <View style={styles.loading}>
              <Text style={styles.emptyTitle}>Couldn't load dashboard</Text>
              <Text style={styles.loadingText}>{loadError}</Text>
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
          {/* Promo carousel */}
          <ScrollView
            horizontal
            pagingEnabled={false}
            snapToInterval={PROMO_W + PROMO_GAP}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promoRow}
            onMomentumScrollEnd={handlePromoScroll}
          >
            <View style={[styles.promo, { backgroundColor: PROMO }]}>
              <View style={[styles.promoCircle, styles.promoCircleA]} />
              <View style={[styles.promoCircle, styles.promoCircleB]} />
              <Ionicons
                name="paper-plane"
                size={72}
                color="rgba(255,255,255,0.9)"
                style={styles.promoPlane}
              />
              <Text style={styles.promoTitle}>Qash now has its own app</Text>
              <Text style={styles.promoBody}>
                Download the Qash app for a faster payments experience
              </Text>
              <View style={styles.promoSpacer} />
              <View style={styles.promoButton}>
                <Ionicons name="play" size={14} color="#111111" />
                <Text style={styles.promoButtonLabel}>Get it on Google play</Text>
              </View>
            </View>
            <View style={[styles.promo, { backgroundColor: PROMO_2 }]}>
              <View style={[styles.promoCircle, styles.promoCircleA]} />
              <View style={[styles.promoCircle, styles.promoCircleB]} />
              <Ionicons
                name="people"
                size={64}
                color="rgba(255,255,255,0.9)"
                style={styles.promoPlane}
              />
              <Text style={styles.promoTitle}>Copy the best traders</Text>
              <Text style={styles.promoBody}>
                Follow top performers and mirror their moves automatically
              </Text>
              <View style={styles.promoSpacer} />
              <Pressable
                accessibilityRole="button"
                onPress={() => onCopyTrader?.()}
                style={styles.promoButton}
              >
                <Text style={styles.promoButtonLabel}>Start copying</Text>
              </Pressable>
            </View>
          </ScrollView>
          <View style={styles.dots}>
            {[0, 1].map((i) => (
              <View
                key={i}
                style={[styles.dot, i === promoIndex ? styles.dotActive : null]}
              />
            ))}
          </View>

          <SectionHead title="Stay Updated" action="See all" onAction={onSeeActivity} />
          {update ? (
            <View style={styles.updateCard}>
              <View style={styles.updateIcon}>
                <Ionicons name="megaphone" size={20} color={TEAL} />
              </View>
              <View style={styles.rowMain}>
                <Text style={styles.updateTitle} numberOfLines={1}>
                  🎉 {update.title}
                </Text>
                <Text style={styles.updateDetail} numberOfLines={1}>
                  {update.detail}
                </Text>
              </View>
              <View style={styles.counter}>
                <Text style={styles.counterLabel}>1/{activity.length}</Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.sectionTitleSolo}>Your Wallet</Text>
          <View style={styles.walletList}>
            {positions.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No open positions</Text>
                <Text style={styles.emptyBody}>
                  Fund your wallet to start trading.
                </Text>
              </View>
            ) : (
              positions.map((row, index) => (
                <View key={`${row.symbol}-${index}`}>
                  {index > 0 ? <View style={styles.hairline} /> : null}
                  <View style={styles.walletRow}>
                    <View
                      style={[styles.coin, { backgroundColor: coinColor(row.symbol) }]}
                    >
                      <Text style={styles.coinText}>{row.symbol.slice(0, 1)}</Text>
                    </View>
                    <View style={styles.rowMain}>
                      <Text style={styles.walletName}>
                        {coinName(row.symbol)}{" "}
                        <Text style={styles.walletSymbol}>{row.symbol}</Text>
                      </Text>
                      <Text style={styles.walletFiat}>{row.mark}</Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={styles.walletBalance}>{row.size}</Text>
                      <Text
                        style={[
                          styles.walletChange,
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
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Not copying anyone</Text>
                <Text style={styles.emptyBody}>Pick a trader to start.</Text>
              </View>
            ) : (
              copies.map((row, index) => {
                const tint = tintForName(row.handle);
                return (
                <View key={row.handle}>
                  {index > 0 ? <View style={styles.hairline} /> : null}
                  <View style={styles.row}>
                    <View style={[styles.coin, { backgroundColor: tint.bg }]}>
                      <Text style={[styles.coinText, { color: tint.fg }]}>
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
                );
              })
            )}
            <View style={styles.hairline} />
            <Pressable
              accessibilityLabel="Pause all copying"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setKillOpen(true)}
              style={styles.pauseAll}
            >
              <Text style={styles.pauseAllLabel}>Pause all copying</Text>
            </Pressable>
          </View>

          <SectionHead title="Activity" action="See all" onAction={onSeeActivity} />
          <View style={styles.list}>
            {activity.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No recent activity</Text>
                <Text style={styles.emptyBody}>Fills and risk events land here.</Text>
              </View>
            ) : (
              activity.map((row, index) => (
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
      </View>

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
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setKillOpen(false);
              onKillSwitch?.();
            }}
            style={({ pressed }) => [
              styles.killConfirm,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.killConfirmLabel}>Pause everything</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setKillOpen(false)}
            style={({ pressed }) => [
              styles.keepRunning,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.keepRunningLabel}>Keep running</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

function SectionHead({
  title,
  action,
  onAction,
}: {
  title: string;
  action: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => onAction?.()}
      >
        <Text style={styles.sectionAction}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    flex: 1,
  },
  balance: {
    color: INK,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 34,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  balanceCaption: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    lineHeight: 14,
    textAlign: "center",
  },
  coin: {
    alignItems: "center",
    borderRadius: 9999,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  coinText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  connectBody: { color: "#3F6212", fontSize: 13, lineHeight: 18 },
  connectButton: {
    backgroundColor: "#111111",
    borderRadius: 9999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  connectButtonLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  connectCard: {
    alignItems: "center",
    backgroundColor: "#D9F99D",
    borderRadius: 20,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  connectMain: { flex: 1, gap: 2 },
  connectTitle: { color: "#1A2E05", fontSize: 15, fontWeight: "800", lineHeight: 20 },
  counter: {
    alignSelf: "flex-start",
    backgroundColor: CARD_SOFT,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  counterLabel: { color: SECONDARY, fontSize: 11, fontWeight: "600" },
  dot: {
    backgroundColor: "#3A4456",
    borderRadius: 9999,
    height: 6,
    width: 6,
  },
  dotActive: { backgroundColor: INK },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
  },
  down: { color: DOWN },
  empty: { gap: 4, padding: 8 },
  emptyBody: { color: MUTED, fontSize: 13, lineHeight: 19 },
  emptyTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 22 },
  hairline: { backgroundColor: BORDER, height: 1, width: "100%" },
  handle: {
    alignSelf: "center",
    backgroundColor: "#3A4456",
    borderRadius: 9999,
    height: 4,
    marginBottom: 8,
    width: 40,
  },
  keepRunning: {
    alignItems: "center",
    backgroundColor: CARD_SOFT,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: "100%",
  },
  keepRunningLabel: {
    color: INK,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  killConfirm: {
    alignItems: "center",
    backgroundColor: "#E11D48",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: "100%",
  },
  killConfirmLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  list: {
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  loading: { alignItems: "center", gap: 12, paddingVertical: 48 },
  loadingText: { color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center" },
  pauseAll: { alignItems: "center", paddingVertical: 14 },
  pauseAllLabel: { color: DOWN, fontSize: 14, fontWeight: "600" },
  pressed: { opacity: 0.85 },
  retry: {
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 9999,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryLabel: { color: TEAL, fontSize: 14, fontWeight: "600" },
  riskBanner: {
    backgroundColor: "rgba(251, 191, 36, 0.12)",
    borderColor: "rgba(251, 191, 36, 0.35)",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  riskText: { color: AMBER, fontSize: 13, fontWeight: "600", lineHeight: 19, textAlign: "center" },
  promo: {    borderRadius: 22,
    height: 200,
    overflow: "hidden",
    padding: 20,
    position: "relative",
    width: PROMO_W,
  },
  promoBody: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    maxWidth: "62%",
  },
  promoButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 9999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  promoButtonLabel: { color: "#111111", fontSize: 13, fontWeight: "700" },
  promoCircle: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 9999,
    position: "absolute",
  },
  promoCircleA: { height: 220, right: -60, top: -80, width: 220 },
  promoCircleB: { bottom: -100, height: 180, right: 40, width: 180 },
  promoPlane: { position: "absolute", right: 24, top: 56, transform: [{ rotate: "-18deg" }] },
  promoRow: { gap: PROMO_GAP, paddingRight: 20 },
  promoSpacer: { flex: 1 },
  promoTitle: { color: "#FFFFFF", fontSize: 21, fontWeight: "800", lineHeight: 27, maxWidth: "68%" },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
  },
  rowDetail: { color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  rowMain: { flex: 1, gap: 3 },
  rowRight: { alignItems: "flex-end", gap: 4 },
  rowTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 14, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 6 },
  sectionAction: { color: TEAL, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  sectionHead: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sectionTitle: { color: INK, fontSize: 16, fontWeight: "700", lineHeight: 24 },
  sectionTitleSolo: {
    color: INK,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
    marginTop: 8,
  },
  seeMore: {
    alignSelf: "center",
    backgroundColor: CARD_SOFT,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  seeMoreLabel: { color: SECONDARY, fontSize: 12, fontWeight: "500" },
  sheet: {
    backgroundColor: SHEET,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
    overflow: "hidden",
    paddingTop: 18,
  },
  sheetBody: { color: SECONDARY, fontSize: 14, lineHeight: 21 },
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
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillLabel: { fontSize: 12, fontWeight: "600", lineHeight: 15 },
  up: { color: UP },
  updateCard: {
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  updateDetail: { color: MUTED, fontSize: 12, lineHeight: 17 },
  updateIcon: {
    alignItems: "center",
    backgroundColor: CARD_SOFT,
    borderRadius: 9999,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  updateTitle: { color: INK, fontSize: 15, fontWeight: "700", lineHeight: 20 },
  walletBalance: {
    color: INK,
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
  walletChange: { fontSize: 12, fontWeight: "500", lineHeight: 15 },
  walletFiat: { color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  walletList: { paddingHorizontal: 4 },
  walletCaption: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    textAlign: "center",
  },
  walletName: { color: INK, fontSize: 16, fontWeight: "700", lineHeight: 21 },
  walletRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
  },
  walletSymbol: { color: SECONDARY, fontSize: 14, fontWeight: "500" },
});

export default DashboardScreen;
