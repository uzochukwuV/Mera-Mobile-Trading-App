import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CARD, CARD_SOFT, INK, SECONDARY, TEAL } from "./homeTheme";

type TopFilterBarProps = {
  onMenu?: () => void;
  onStocks?: () => void;
  onMoreMarkets?: () => void;
  onSearch?: () => void;
  onSupport?: () => void;
};

/** Global filter bar shared by every bottom-tab screen. */
export function TopFilterBar(props: TopFilterBarProps = {}): ReactElement {
  const { onMenu, onStocks, onMoreMarkets, onSearch, onSupport } = props;
  return (
    <View style={styles.topBar}>
      <Pressable
        accessibilityLabel="Menu"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => onMenu?.()}
        style={styles.iconButton}
      >
        <Ionicons name="menu" size={22} color={INK} />
        <View style={styles.menuDot} />
      </Pressable>
      <View style={styles.segment}>
        <View style={styles.segmentActive}>
          <Text style={styles.segmentActiveLabel}>Crypto</Text>
        </View>
        <Pressable
          accessibilityLabel="Stocks"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onStocks?.()}
          style={styles.segmentIdle}
        >
          <Text style={styles.segmentIdleLabel}>Stocks</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="More markets"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onMoreMarkets?.()}
          style={styles.segmentChevron}
        >
          <Ionicons name="chevron-down" size={16} color={SECONDARY} />
        </Pressable>
      </View>
      <View style={styles.topRight}>
        <Pressable
          accessibilityLabel="Search"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onSearch?.()}
          style={styles.iconButton}
        >
          <Ionicons name="search" size={22} color={INK} />
        </Pressable>
        <Pressable
          accessibilityLabel="Support"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onSupport?.()}
          style={styles.iconButton}
        >
          <Ionicons name="headset" size={22} color={INK} />
        </Pressable>
      </View>
    </View>
  );
}

export function SectionHead({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}): ReactElement {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onAction?.()}
        >
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : (
        <View />
      )}
    </View>
  );
}

export function EmptyBlock({
  title,
  body,
}: {
  title: string;
  body: string;
}): ReactElement {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { gap: 4, padding: 8 },
  emptyBody: { color: SECONDARY, fontSize: 13, lineHeight: 19 },
  emptyTitle: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 22 },
  iconButton: { padding: 6, position: "relative" },
  menuDot: {
    backgroundColor: "#F6465D",
    borderRadius: 9999,
    height: 8,
    position: "absolute",
    right: 4,
    top: 4,
    width: 8,
  },
  sectionAction: { color: TEAL, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  sectionHead: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sectionTitle: { color: INK, fontSize: 16, fontWeight: "700", lineHeight: 24 },
  segment: {
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 9999,
    flex: 1,
    flexDirection: "row",
    marginHorizontal: 10,
    padding: 4,
  },
  segmentActive: {
    backgroundColor: INK,
    borderRadius: 9999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  segmentActiveLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  segmentChevron: {
    alignItems: "center",
    backgroundColor: CARD_SOFT,
    borderRadius: 9999,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  segmentIdle: { paddingHorizontal: 14, paddingVertical: 8 },
  segmentIdleLabel: { color: SECONDARY, fontSize: 14, fontWeight: "500" },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topRight: { alignItems: "center", flexDirection: "row", gap: 4 },
});

export default TopFilterBar;
