import { useState, type ReactElement, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Button } from "../Button";
import { BottomSheet, Card } from "../ui";
import { palette, radii, spacing, text } from "../theme";
import type {
  ActivityRow,
  CopyRow,
  DashboardProps,
  PositionRow,
} from "./types";

const DEFAULT_POSITIONS: PositionRow[] = [
  { symbol: "BTC", side: "Long", size: "0.12", mark: "67,410.5", pnl: "+142.30", pnlUp: true },
  { symbol: "ETH", side: "Short", size: "1.40", mark: "3,512.8", pnl: "-28.12", pnlUp: false },
  { symbol: "SOL", side: "Long", size: "8.50", mark: "172.44", pnl: "+12.05", pnlUp: true },
];

const DEFAULT_COPIES: CopyRow[] = [
  { handle: "satoshi-trades", allocation: "500.00", status: "Active" },
  { handle: "macro-desk", allocation: "250.00", status: "Paused" },
];

const DEFAULT_ACTIVITY: ActivityRow[] = [
  { id: "1", title: "Copy fill · BTC long", detail: "0.05 · satoshi-trades", status: "Filled", tone: "ok" },
  { id: "2", title: "Copy fill · ETH short", detail: "0.80 · macro-desk", status: "Partial", tone: "warning" },
  { id: "3", title: "Order submitted", detail: "SOL long · 2.00", status: "Submitted", tone: "neutral" },
  { id: "4", title: "Risk event", detail: "Daily loss limit hit", status: "Failed", tone: "error" },
];

const TABS = [
  { label: "Home", glyph: "●" },
  { label: "Markets", glyph: "◐" },
  { label: "Traders", glyph: "○" },
  { label: "Contests", glyph: "✦" },
  { label: "Account", glyph: "◉" },
] as const;

type TagVariant = "ink" | "forest" | "ember" | "fog" | "sunlit";

function Tag({
  variant,
  dot,
  children,
}: {
  variant: TagVariant;
  dot?: boolean;
  children: ReactNode;
}) {
  const style = tagStyles[variant];
  return (
    <View style={[styles.tag, style.container]}>
      {dot ? <View style={[styles.tagDot, style.dot]} /> : null}
      <Text style={[styles.tagLabel, style.label]}>{children}</Text>
    </View>
  );
}

const tagStyles = {
  ink: {
    container: { backgroundColor: palette.surfaceStrong },
    dot: { backgroundColor: palette.text },
    label: { color: palette.text },
  },
  forest: {
    container: { backgroundColor: palette.forest },
    dot: { backgroundColor: palette.textInverse },
    label: { color: palette.textInverse },
  },
  ember: {
    container: { backgroundColor: palette.error },
    dot: { backgroundColor: palette.textInverse },
    label: { color: palette.textInverse },
  },
  fog: {
    container: { backgroundColor: palette.surfaceMuted },
    dot: { backgroundColor: palette.slate },
    label: { color: palette.graphite },
  },
  sunlit: {
    container: { backgroundColor: palette.sunlitCream },
    dot: { backgroundColor: palette.emberBrown },
    label: { color: palette.emberBrown },
  },
} as const;

// Minimal equity sparkline — mock trajectory, UI-only.
function Sparkline({ up }: { up: boolean }) {
  const color = up ? palette.forest : palette.error;
  const line = up
    ? "M0,52 L30,48 L60,50 L90,40 L120,42 L150,32 L180,34 L210,24 L240,26 L270,14 L300,10"
    : "M0,12 L30,16 L60,14 L90,24 L120,22 L150,32 L180,30 L210,40 L240,38 L270,50 L300,54";
  const area = `${line} L300,64 L0,64 Z`;
  return (
    <Svg
      accessibilityLabel="Equity trajectory"
      viewBox="0 0 300 64"
      style={styles.spark}
    >
      <Path d={area} fill={color} opacity={0.08} />
      <Path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DashboardScreen(props: DashboardProps = {}): ReactElement {
  const {
    equity = "1,420.80",
    changePct = 2.41,
    lastUpdatedSecondsAgo = 12,
    unread = 3,
    available = "612.40",
    locked = "120.00",
    realizedPnlToday = "+38.20",
    realizedPnlUp = true,
    riskNotice = null,
    positions = DEFAULT_POSITIONS,
    copies = DEFAULT_COPIES,
    activity = DEFAULT_ACTIVITY,
    onKillSwitch,
    onCopyTrader,
    onMarkets,
    onManageCopies,
    onSeeActivity,
  } = props;

  const [killOpen, setKillOpen] = useState(false);
  const changeUp = changePct >= 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>Home</Text>
          <View style={styles.topRight}>
            <Tag variant="forest" dot>
              Live
            </Tag>
            <Pressable
              accessibilityLabel="Notifications"
              accessibilityRole="button"
              hitSlop={8}
              style={styles.bell}
            >
              <Text style={styles.bellGlyph}>○</Text>
              {unread > 0 ? (
                <View style={styles.unread}>
                  <Text style={styles.unreadText}>{unread}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        {/* Equity hero — left-aligned trading terminal header */}
        <Card style={styles.hero}>
          <Text style={text.caption}>Total equity</Text>
          <View style={styles.equityRow}>
            <Text style={styles.equityValue}>{equity}</Text>
            <Text style={styles.equityUnit}>aUSD</Text>
          </View>
          <View style={styles.heroMeta}>
            <Tag variant={changeUp ? "forest" : "ember"}>
              {changeUp ? "+" : ""}
              {changePct.toFixed(2)}% · 24h
            </Tag>
            <Text style={styles.updated}>
              Updated {lastUpdatedSecondsAgo}s ago
            </Text>
          </View>
          <Sparkline up={changeUp} />
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Available</Text>
              <Text style={styles.statValue}>{available}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Locked</Text>
              <Text style={styles.statValue}>{locked}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Today</Text>
              <Text
                style={[
                  styles.statValue,
                  realizedPnlUp ? styles.up : styles.down,
                ]}
              >
                {realizedPnlToday}
              </Text>
            </View>
          </View>
        </Card>

        {riskNotice ? (
          <View style={styles.riskBanner}>
            <Text style={styles.riskText}>{riskNotice}</Text>
          </View>
        ) : null}

        {/* Quick actions — 4 muted-circle buttons */}
        <View style={styles.quickActions}>
          <View style={styles.quickItem}>
            <Pressable
              accessibilityLabel="Copy a trader"
              accessibilityRole="button"
              hitSlop={4}
              onPress={() => onCopyTrader?.()}
              style={({ pressed }) => [
                styles.quickCircle,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.quickGlyph}>＋</Text>
            </Pressable>
            <Text style={styles.quickLabel}>Copy</Text>
          </View>
          <View style={styles.quickItem}>
            <Pressable
              accessibilityLabel="Markets"
              accessibilityRole="button"
              hitSlop={4}
              onPress={() => onMarkets?.()}
              style={({ pressed }) => [
                styles.quickCircle,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.quickGlyph}>◐</Text>
            </Pressable>
            <Text style={styles.quickLabel}>Markets</Text>
          </View>
          <View style={styles.quickItem}>
            <Pressable
              accessibilityLabel="Activity"
              accessibilityRole="button"
              hitSlop={4}
              onPress={() => onSeeActivity?.()}
              style={({ pressed }) => [
                styles.quickCircle,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.quickGlyph}>◎</Text>
            </Pressable>
            <Text style={styles.quickLabel}>Activity</Text>
          </View>
          <View style={styles.quickItem}>
            <Pressable
              accessibilityLabel="Kill switch"
              accessibilityRole="button"
              hitSlop={4}
              onPress={() => setKillOpen(true)}
              style={({ pressed }) => [
                styles.quickCircle,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={[styles.quickGlyph, styles.quickKillGlyph]}>○</Text>
            </Pressable>
            <Text style={styles.quickLabel}>Kill</Text>
          </View>
        </View>

        <SectionBlock
          title="Positions"
          action="See all"
          empty={positions.length === 0}
          emptyTitle="No open positions"
          emptyBody="Fills appear here with live marks."
        >
          {positions.map((row, index) => (
            <View key={`${row.symbol}-${index}`}>
              {index > 0 ? <View style={styles.hairline} /> : null}
              <View style={styles.row}>
                <View style={styles.coin}>
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
                  <Tag variant={row.side === "Long" ? "forest" : "ember"}>
                    {row.side === "Long" ? "Long" : "Short"}
                  </Tag>
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
          ))}
        </SectionBlock>

        <SectionBlock
          title="Copying"
          action="Manage"
          onAction={onManageCopies}
          empty={copies.length === 0}
          emptyTitle="Not copying anyone"
          emptyBody="Pick a trader to start."
        >
          {copies.map((row, index) => (
            <View key={row.handle}>
              {index > 0 ? <View style={styles.hairline} /> : null}
              <View style={styles.row}>
                <View style={styles.coin}>
                  <Text style={styles.coinText}>
                    {row.handle.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{row.handle}</Text>
                  <Text style={styles.rowDetail}>
                    {row.allocation} aUSD
                  </Text>
                </View>
                <Tag
                  variant={
                    row.status === "Active"
                      ? "forest"
                      : row.status === "Paused"
                        ? "sunlit"
                        : "fog"
                  }
                  dot
                >
                  {row.status}
                </Tag>
              </View>
            </View>
          ))}
        </SectionBlock>

        <SectionBlock
          title="Activity"
          action="See all"
          onAction={onSeeActivity}
          empty={activity.length === 0}
          emptyTitle="No recent activity"
          emptyBody="Fills and risk events land here."
        >
          {activity.map((row, index) => (
            <View key={row.id}>
              {index > 0 ? <View style={styles.hairline} /> : null}
              <View style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{row.title}</Text>
                  <Text style={styles.rowDetail}>{row.detail}</Text>
                </View>
                <Tag
                  variant={
                    row.status === "Filled"
                      ? "forest"
                      : row.status === "Failed"
                        ? "ember"
                        : row.status === "Partial"
                          ? "sunlit"
                          : "fog"
                  }
                >
                  {row.status}
                </Tag>
              </View>
            </View>
          ))}
        </SectionBlock>
      </ScrollView>

      <View style={styles.bottomNav}>
        {TABS.map((tab, index) => {
          const active = index === 0;
          return (
            <Pressable
              key={tab.label}
              accessibilityRole="tab"
              hitSlop={4}
              style={[styles.tab, active ? styles.tabActive : null]}
            >
              <Text
                style={[
                  styles.tabGlyph,
                  active ? styles.tabActiveText : styles.tabIdleText,
                ]}
              >
                {tab.glyph}
              </Text>
              <Text
                style={[
                  styles.tabLabel,
                  active ? styles.tabActiveText : styles.tabIdleText,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <BottomSheet
        visible={killOpen}
        onClose={() => setKillOpen(false)}
        title="Pause all copying?"
      >
        <Text style={text.small}>
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
        <Button title="Keep running" onPress={() => setKillOpen(false)} />
      </BottomSheet>
    </View>
  );
}

function SectionBlock({
  title,
  action,
  onAction,
  empty,
  emptyTitle,
  emptyBody,
  children,
}: {
  title: string;
  action: string;
  onAction?: () => void;
  empty: boolean;
  emptyTitle: string;
  emptyBody: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onAction?.()}
        >
          <Text style={styles.sectionAction}>{action} ›</Text>
        </Pressable>
      </View>
      <Card style={styles.list}>
        {empty ? (
          <View style={styles.empty}>
            <Text style={text.bodyStrong}>{emptyTitle}</Text>
            <Text style={text.small}>{emptyBody}</Text>
          </View>
        ) : (
          children
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  bell: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  bellGlyph: { color: palette.graphite, fontSize: 22, fontWeight: "600" },
  bottomNav: {
    backgroundColor: palette.surface,
    borderTopColor: palette.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 2,
    justifyContent: "space-around",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  coin: {
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  coinText: { color: palette.ink, fontSize: 15, fontWeight: "600" },
  down: { color: palette.down },
  empty: { gap: 4, padding: spacing.sm },
  equityRow: { alignItems: "baseline", flexDirection: "row", gap: spacing.xs },
  equityUnit: { color: palette.slate, fontSize: 13, fontWeight: "500" },
  equityValue: {
    color: palette.ink,
    fontSize: 29,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.52,
    lineHeight: 35,
  },
  hairline: { backgroundColor: palette.border, height: 1, width: "100%" },
  hero: { alignItems: "stretch", gap: spacing.sm, padding: spacing.lg },
  heroMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  killConfirm: {
    alignItems: "center",
    backgroundColor: palette.error,
    borderRadius: radii.button,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: "100%",
  },
  killConfirmLabel: {
    color: palette.textInverse,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  list: { padding: spacing.sm },
  pnl: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  pressed: { opacity: 0.85 },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
  },
  quickCircle: {
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.full,
    height: 56,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
    width: 56,
  },
  quickGlyph: { color: palette.text, fontSize: 20, fontWeight: "600" },
  quickItem: { alignItems: "center", gap: spacing.xs, minWidth: 64 },
  quickKillGlyph: { color: palette.error },
  quickLabel: {
    color: palette.slate,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 15,
  },
  riskBanner: {
    backgroundColor: palette.sunlitCream,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  riskText: { color: palette.emberBrown, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowDetail: { color: palette.ash, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  rowMain: { flex: 1, gap: 2 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  rowTitle: { color: palette.ink, fontSize: 14, fontWeight: "600", lineHeight: 19 },
  screen: { backgroundColor: palette.bg, flex: 1 },
  scroll: { gap: spacing.xl, paddingBottom: spacing.xl, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  section: { gap: spacing.sm },
  sectionAction: { color: palette.graphite, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  sectionHead: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  sectionTitle: { color: palette.ink, fontSize: 18, fontWeight: "600", lineHeight: 26 },
  spark: { height: 64, width: "100%" },
  stat: { flex: 1, gap: 2 },
  statDivider: { backgroundColor: palette.border, height: 32, width: 1 },
  statLabel: {
    color: palette.slate,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.3,
    lineHeight: 14,
    textTransform: "uppercase",
  },
  statValue: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
  stats: {
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.sm,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 4,
    padding: spacing.sm,
  },
  tab: {
    alignItems: "center",
    borderRadius: radii.pill,
    gap: 2,
    minHeight: 52,
    minWidth: 60,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tabActive: { backgroundColor: palette.surfaceMuted },
  tabActiveText: { color: palette.ink },
  tabGlyph: { fontSize: 16, fontWeight: "600", lineHeight: 20 },
  tabIdleText: { color: palette.ash },
  tabLabel: { fontSize: 11, fontWeight: "500", lineHeight: 14 },
  tag: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagDot: { borderRadius: radii.pill, height: 6, width: 6 },
  tagLabel: { fontSize: 12, fontWeight: "500", lineHeight: 15 },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topRight: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  topTitle: { color: palette.ink, fontSize: 22, fontWeight: "600", letterSpacing: -0.37, lineHeight: 31 },
  unread: {
    alignItems: "center",
    backgroundColor: palette.campfire,
    borderRadius: radii.pill,
    height: 18,
    justifyContent: "center",
    minWidth: 18,
    paddingHorizontal: 4,
    position: "absolute",
    right: 2,
    top: 2,
  },
  unreadText: { color: palette.textInverse, fontSize: 10, fontWeight: "600", lineHeight: 12 },
  up: { color: palette.up },
  updated: { color: palette.ash, fontSize: 12, fontWeight: "400", lineHeight: 16 },
});

export default DashboardScreen;
