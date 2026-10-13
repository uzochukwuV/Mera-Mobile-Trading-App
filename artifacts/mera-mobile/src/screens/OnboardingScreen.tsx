import type { ReactElement } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, LinkButton } from "../Button";
import { Spinner } from "../ui";
import { palette, radii, shadows, spacing } from "../theme";
import type { OnboardingProps } from "./types";

// Icon-led utilities — single monochrome glyph + one-word metadata each.
// No paragraphs: the row carries trust the way avatar stacks do.
const UTILITIES = [
  { glyph: "◉", label: "Secure" },
  { glyph: "◐", label: "Limits" },
  { glyph: "✦", label: "Live" },
] as const;

// S1 per appflow: the passkey ceremony is the sole visible auth. S2
// (anonymous identity) and S2b (wallet link) are silent — the screen stays
// quiet about them and never mentions email. `locked` renders from stored
// address metadata; biometrics only fire on an explicit Unlock tap.
export function OnboardingScreen(props: OnboardingProps = {}): ReactElement {
  const {
    stage = "welcome",
    address,
    statusText,
    error = null,
    busy = false,
    onSignIn,
    onRecover,
    onUnlock,
    onSignOut,
    onTour,
    onRetry,
  } = props;

  const locked = stage === "locked";

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        {/* App preview frame — white card floating on parchment */}
        <View style={styles.frame}>
          <Image
            accessibilityLabel="Pera"
            resizeMode="cover"
            source={require("../../assets/images/icon.png")}
            style={styles.icon}
          />
          {/* Brand punctuation — the single rationed orange moment */}
          <View style={styles.brandDot} />
        </View>

        {/* Tag pill — sunlit wash, ember-brown metadata */}
        <View style={styles.tag}>
          <Text style={styles.tagLabel}>
            {locked ? "Welcome back" : "Passkey secured"}
          </Text>
        </View>

        {locked && address ? (
          <View style={styles.addressPill}>
            <Text style={styles.addressText}>{address}</Text>
          </View>
        ) : (
          <View style={styles.utilityRow}>
            {UTILITIES.map((item) => (
              <View key={item.label} style={styles.utilityItem}>
                <View style={styles.utilityCircle}>
                  <Text style={styles.utilityGlyph}>{item.glyph}</Text>
                </View>
                <Text style={styles.utilityLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}

        {error ? (
          <View style={styles.errorCard} accessibilityRole="alert">
            {error.code ? (
              <Text style={styles.errorCode}>{error.code}</Text>
            ) : null}
            <Text style={styles.errorMessage}>{error.message}</Text>
            <LinkButton title="Try again" onPress={() => onRetry?.()} />
          </View>
        ) : null}
      </View>

      {/* Thumb-zone pair — filled pill + ghost pill, even 12px gap */}
      <View style={styles.bottom}>
        <View style={styles.actions}>
          {locked ? (
            <Button
              title={busy ? "Unlocking…" : "Unlock"}
              primary
              disabled={busy}
              onPress={() => onUnlock?.()}
            />
          ) : (
            <Button
              title={busy ? "Waiting for passkey…" : "Sign in with Mera"}
              primary
              disabled={busy}
              onPress={() => onSignIn?.()}
            />
          )}
          {locked ? (
            <Button
              title="Sign out"
              disabled={busy}
              onPress={() => onSignOut?.()}
            />
          ) : (
            <Button
              title="Recover Mera wallet"
              disabled={busy}
              onPress={() => onRecover?.()}
            />
          )}
        </View>
        {busy && statusText ? (
          <View style={styles.statusRow}>
            <Spinner />
            <Text style={styles.caption}>{statusText}</Text>
          </View>
        ) : (
          <Text style={styles.caption}>No email · No passwords</Text>
        )}
        {onTour && !busy ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => onTour?.()}
            style={styles.tour}
          >
            <Text style={styles.tourLabel}>Preview the tour ›</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
    width: "100%",
  },
  addressPill: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.pill,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addressText: {
    color: palette.ink,
    fontFamily: "Menlo",
    fontSize: 13,
    fontWeight: "600",
  },
  bottom: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
    width: "100%",
  },
  brandDot: {
    backgroundColor: palette.campfire,
    borderColor: palette.surface,
    borderRadius: radii.full,
    borderWidth: 2,
    height: 14,
    position: "absolute",
    right: 14,
    top: 14,
    width: 14,
  },
  caption: {
    color: palette.ash,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
    lineHeight: 15,
    textAlign: "center",
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  errorCard: {
    alignItems: "flex-start",
    backgroundColor: palette.errorSoft,
    borderRadius: radii.lg,
    gap: 4,
    marginTop: spacing.lg,
    maxWidth: 320,
    padding: spacing.md,
  },
  errorCode: {
    color: palette.error,
    fontFamily: "Menlo",
    fontSize: 12,
    fontWeight: "600",
  },
  errorMessage: {
    color: palette.graphite,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 21,
  },
  frame: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    position: "relative",
    ...shadows.card,
  },
  icon: {
    borderRadius: radii.sm,
    height: 112,
    width: 112,
  },
  screen: {
    backgroundColor: palette.bg,
    flex: 1,
    gap: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
  },
  tag: {
    backgroundColor: palette.sunlitCream,
    borderRadius: radii.pill,
    marginTop: spacing.lg,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tour: { alignItems: "center", paddingVertical: 4 },
  tourLabel: {
    color: palette.graphite,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  tagLabel: {
    color: palette.emberBrown,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 15,
  },
  utilityCircle: {
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.full,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  utilityGlyph: {
    color: palette.graphite,
    fontSize: 20,
    fontWeight: "600",
  },
  utilityItem: {
    alignItems: "center",
    gap: spacing.xs,
  },
  utilityLabel: {
    color: palette.slate,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 15,
  },
  utilityRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
});

export default OnboardingScreen;
