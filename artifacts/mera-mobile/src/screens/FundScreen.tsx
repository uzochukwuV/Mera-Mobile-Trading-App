import { ReactElement } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BG, BORDER, CARD, DOWN, FONT, INDIGO_SOFT, INK, MUTED, ON_ACCENT, RADIUS, SECONDARY, TEAL, UP } from "./homeTheme";
import { FundProps } from "./types";

export function FundScreen(props: FundProps = {}): ReactElement {
  const {
    balance = "0.00",
    minDeposit = "100",
    oneClickBusy = false,
    oneClickError = null,
    oneClickDone = false,
    onEnableOneClick,
    onOpenSite,
    onContinue,
    onBack,
  } = props;

  const steps = [
    {
      title: "Get testnet funds",
      body: "Open the Perpl testnet site and use its faucet to fund your wallet with testnet collateral.",
    },
    {
      title: "Create your exchange account",
      body: `On the same site, deposit at least ${minDeposit} aUSD — this creates your on-chain trading account.`,
    },
    {
      title: "Come back and continue",
      body: "Return here and tap continue. Enrollment retries automatically once your account exists.",
    },
  ] as const;

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

        <Text style={styles.title}>Fund your wallet</Text>
        <Text style={styles.subtitle}>
          Trading needs an on-chain exchange account with collateral.
        </Text>

        <View style={styles.balanceCard}>
          <Text style={styles.caption}>WALLET BALANCE</Text>
          <Text style={styles.balance}>{balance} aUSD</Text>
        </View>

        {steps.map((step, index) => (
          <View key={step.title} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberLabel}>{index + 1}</Text>
            </View>
            <View style={styles.stepMain}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
            </View>
          </View>
        ))}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Perpl testnet site"
          onPress={() => onOpenSite?.()}
          style={({ pressed }) => [
            styles.primary,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.primaryLabel}>Open testnet site</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="I've funded, continue"
          onPress={() => onContinue?.()}
          style={({ pressed }) => [
            styles.secondary,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.secondaryLabel}>I've funded — continue</Text>
        </Pressable>

        <View style={styles.oneClick}>
          <Text style={styles.stepTitle}>One-click trading</Text>
          <Text style={styles.stepBody}>
            API orders only fill after your account authorizes the exchange to
            forward them. One wallet signature, once.
          </Text>
          {oneClickDone ? (
            <Text style={styles.doneLabel}>Enabled ✓</Text>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enable one-click trading"
              disabled={oneClickBusy}
              onPress={() => onEnableOneClick?.()}
              style={({ pressed }) => [
                styles.secondary,
                oneClickBusy || pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.secondaryLabel}>
                {oneClickBusy ? "Waiting for signature…" : "Enable one-click trading"}
              </Text>
            </Pressable>
          )}
          {oneClickError ? (
            <Text style={styles.errorLabel}>{oneClickError}</Text>
          ) : null}
        </View>

        <Text style={styles.footnote}>
          Withdrawals always stay wallet-signed and live on a separate screen.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 4, paddingVertical: 4 },
  backLabel: { fontFamily: FONT, color: SECONDARY, fontSize: 15, fontWeight: "400", lineHeight: 20 },
  balance: {
    color: INK,
    fontFamily: FONT,
    fontSize: 34,
    fontWeight: "400",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
    lineHeight: 41,
  },
  balanceCard: {
    alignItems: "center",
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  caption: { fontFamily: FONT, color: MUTED, fontSize: 11, fontWeight: "400", letterSpacing: 1, lineHeight: 14 },
  footnote: { fontFamily: FONT, color: MUTED, fontSize: 11, lineHeight: 14, textAlign: "center" },
  doneLabel: { fontFamily: FONT, color: UP, fontSize: 14, fontWeight: "400", lineHeight: 20 },
  errorLabel: { fontFamily: FONT, color: DOWN, fontSize: 13, fontWeight: "400", lineHeight: 18 },
  oneClick: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  pressed: { opacity: 0.85 },
  primary: {
    alignItems: "center",
    backgroundColor: INK,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  primaryLabel: { fontFamily: FONT, color: ON_ACCENT, fontSize: 16, fontWeight: "400", lineHeight: 20 },
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 16, padding: 20, paddingBottom: 32 },
  secondary: {
    alignItems: "center",
    backgroundColor: INDIGO_SOFT,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  secondaryLabel: { fontFamily: FONT, color: INK, fontSize: 16, fontWeight: "400", lineHeight: 20 },
  stepBody: { fontFamily: FONT, color: MUTED, fontSize: 13, lineHeight: 19 },
  stepMain: { flex: 1, gap: 4 },
  stepNumber: {
    alignItems: "center",
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  stepNumberLabel: { fontFamily: FONT, color: UP, fontSize: 14, fontWeight: "400" },
  stepRow: { alignItems: "flex-start", flexDirection: "row", gap: 12 },
  stepTitle: { fontFamily: FONT, color: INK, fontSize: 15, fontWeight: "400", lineHeight: 20 },
  subtitle: { fontFamily: FONT, color: SECONDARY, fontSize: 15, lineHeight: 22 },
  title: { fontFamily: FONT, color: INK, fontSize: 26, fontWeight: "400", letterSpacing: -0.4, lineHeight: 32 },
});

export default FundScreen;
