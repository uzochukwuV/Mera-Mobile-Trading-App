import type { ReactElement } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BG,
  BORDER,
  CARD,
  DOWN,
  INK,
  MUTED,
  SECONDARY,
} from "./homeTheme";
import type { WithdrawProps } from "./types";

/**
 * Withdrawals are wallet-signed and irreversible. The contract call is
 * made from the Perpl testnet site for now; this screen stages the
 * scary-confirm copy and the live balance.
 */
export function WithdrawScreen(props: WithdrawProps = {}): ReactElement {
  const { balance = "0.00", onOpenSite, onBack } = props;

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

        <Text style={styles.title}>Withdraw funds</Text>

        <View style={styles.warning}>
          <Ionicons name="warning" size={20} color={DOWN} />
          <Text style={styles.warningText}>
            Withdrawals leave the exchange for good and cannot be undone.
            Check the destination twice — testnet or not.
          </Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.caption}>AVAILABLE TO WITHDRAW</Text>
          <Text style={styles.balance}>{balance} aUSD</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open testnet site to withdraw"
          onPress={() => onOpenSite?.()}
          style={({ pressed }) => [
            styles.primary,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.primaryLabel}>Withdraw on testnet site</Text>
        </Pressable>

        <Text style={styles.footnote}>
          Withdrawals are signed by your wallet, never by an API key. In-app
          contract withdrawals arrive with the full funding flow.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 2, paddingVertical: 4 },
  backLabel: { color: SECONDARY, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  balance: {
    color: INK,
    fontSize: 30,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  balanceCard: {
    alignItems: "center",
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
    padding: 20,
  },
  caption: { color: MUTED, fontSize: 11, fontWeight: "600", letterSpacing: 1, lineHeight: 14 },
  footnote: { color: MUTED, fontSize: 12, lineHeight: 17, textAlign: "center" },
  pressed: { opacity: 0.85 },
  primary: {
    alignItems: "center",
    backgroundColor: INK,
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  primaryLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", lineHeight: 20 },
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 14, padding: 20, paddingBottom: 32 },
  subtitle: { color: SECONDARY, fontSize: 14, lineHeight: 21 },
  title: { color: INK, fontSize: 24, fontWeight: "800", letterSpacing: -0.4, lineHeight: 32 },
  warning: {
    alignItems: "flex-start",
    backgroundColor: "rgba(217, 45, 32, 0.08)",
    borderColor: "rgba(217, 45, 32, 0.30)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  warningText: { color: DOWN, flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 19 },
});

export default WithdrawScreen;
