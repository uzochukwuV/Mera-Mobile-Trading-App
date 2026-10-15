import type { ReactElement } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import {
  BORDER,
  CARD,
  DOWN,
  DOWN_SOFT,
  INK,
  ON_ACCENT,
  PAPER,
  RADIUS,
  SECONDARY,
} from "./homeTheme";
import type { OnboardingProps } from "./types";

// Simple white onboarding: app icon centered, two buttons pinned below.
// - "Get Mera wallet" creates a new passkey (onCreate, falls back to onSignIn).
// - "Recover wallet" recovers via a synced passkey (onRecover, falls back to onSignIn).
// Locked stage reuses the same layout: Unlock + Sign out.
export function OnboardingScreen(props: OnboardingProps = {}): ReactElement {
  const {
    stage = "welcome",
    address,
    statusText,
    error = null,
    busy = false,
    onCreate,
    onSignIn,
    onRecover,
    onUnlock,
    onSignOut,
    onContinue,
    onRetry,
  } = props;

  const locked = stage === "locked";
  const getWallet = onCreate ?? onSignIn;
  const recoverWallet = onRecover ?? onSignIn;

  const primary = locked
    ? { title: busy ? "Unlocking…" : "Unlock", onPress: onUnlock }
    : { title: busy ? "Creating wallet…" : "Get Mera wallet", onPress: getWallet };
  const secondary = locked
    ? { title: "Sign out", onPress: onSignOut }
    : { title: busy ? "Recovering…" : "Recover wallet", onPress: recoverWallet };

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <Image
          accessibilityLabel="Mera"
          resizeMode="contain"
          source={require("../../assets/images/icon.png")}
          style={styles.icon}
        />
        {locked && address ? (
          <Text style={styles.address}>{address}</Text>
        ) : null}
        {error ? (
          <View style={styles.errorCard} accessibilityRole="alert">
            <Text style={styles.errorMessage}>{error.message}</Text>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => onRetry?.()}
              style={styles.retry}
            >
              <Text style={styles.retryLabel}>Try again</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.bottom}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={primary.title}
          disabled={busy || !primary.onPress}
          onPress={() => primary.onPress?.()}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
            busy ? styles.disabled : null,
          ]}
        >
          <Text style={styles.primaryLabel}>{primary.title}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={secondary.title}
          disabled={busy || !secondary.onPress}
          onPress={() => secondary.onPress?.()}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed ? styles.pressed : null,
            busy ? styles.disabled : null,
          ]}
        >
          <Text style={styles.secondaryLabel}>{secondary.title}</Text>
        </Pressable>
        {busy && statusText ? (
          <Text style={styles.status}>{statusText}</Text>
        ) : null}
        {onContinue && !busy ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue without wallet"
            hitSlop={8}
            onPress={() => onContinue?.()}
            style={styles.skip}
          >
            <Text style={styles.skipLabel}>Continue without wallet</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  address: {
    color: SECONDARY,
    fontFamily: "Menlo",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 16,
  },
  bottom: {
    gap: 12,
    paddingBottom: 8,
    width: "100%",
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  disabled: { opacity: 0.5 },
  errorCard: {
    backgroundColor: DOWN_SOFT,
    borderColor: BORDER,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    gap: 8,
    marginTop: 20,
    maxWidth: 320,
    padding: 12,
  },
  errorMessage: {
    color: DOWN,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  icon: {
    borderRadius: 28,
    height: 120,
    width: 120,
  },
  pressed: { opacity: 0.85 },
  primaryButton: {
    alignItems: "center",
    backgroundColor: INK,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: "100%",
  },
  primaryLabel: {
    color: ON_ACCENT,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  retry: { alignItems: "center", paddingVertical: 4 },
  retryLabel: {
    color: INK,
    fontSize: 14,
    fontWeight: "600",
  },
  screen: {
    backgroundColor: PAPER,
    flex: 1,
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: "100%",
  },
  secondaryLabel: {
    color: INK,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  skip: { alignItems: "center", paddingVertical: 8 },
  skipLabel: {
    color: SECONDARY,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textDecorationLine: "underline",
  },
  status: {
    color: SECONDARY,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
});

export default OnboardingScreen;
