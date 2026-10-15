import { useState, type ReactElement } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BG,
  BORDER,
  CARD,
  CARD_SOFT,
  DOWN,
  DOWN_SOFT,
  INK,
  MUTED,
  ON_ACCENT,
  RADIUS,
  SECONDARY,
} from "./homeTheme";
import { describeError, revealMnemonic } from "../wallet";
import type { ExportProps } from "./types";

export function ExportScreen(props: ExportProps = {}): ReactElement {
  const { credentialId, onBack } = props;
  const [phrase, setPhrase] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleReveal(): Promise<void> {
    if (!credentialId) return;
    setBusy(true);
    setError(null);
    try {
      setPhrase(await revealMnemonic(credentialId));
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusy(false);
    }
  }

  function handleHide(): void {
    setPhrase(null);
    setCopied(false);
    onBack?.();
  }

  async function handleCopy(): Promise<void> {
    if (!phrase) return;
    try {
      const { setStringAsync } = await import("expo-clipboard");
      await setStringAsync(phrase);
      setCopied(true);
    } catch {
      setError("Copy failed — write the words down manually.");
    }
  }

  const words =
    phrase
      ?.trim()
      .split(/\s+/)
      .map((word, index) => ({ position: index + 1, word })) ?? [];

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

        <Text style={styles.title}>Recovery phrase</Text>

        <View style={styles.warning}>
          <Ionicons name="warning" size={20} color={DOWN} />
          <Text style={styles.warningText}>
            Anyone with these words controls your funds. Never share them,
            never screenshot them into the cloud.
          </Text>
        </View>

        {!credentialId ? (
          <View style={styles.card}>
            <Text style={styles.emptyBody}>
              No wallet on this device to export.
            </Text>
          </View>
        ) : phrase === null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reveal recovery phrase"
            disabled={busy}
            onPress={() => void handleReveal()}
            style={({ pressed }) => [
              styles.primary,
              busy || pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.primaryLabel}>
              {busy ? "Waiting for passkey…" : "Reveal phrase"}
            </Text>
          </Pressable>
        ) : (
          <>
            <View style={styles.grid}>
              {words.map(({ position, word }) => (
                <View key={position} style={styles.word}>
                  <Text style={styles.num}>{position}</Text>
                  <Text style={styles.wordText}>{word}</Text>
                </View>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => void handleCopy()}
              style={({ pressed }) => [
                styles.secondary,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.secondaryLabel}>
                {copied ? "Copied ✓" : "Copy phrase"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleHide}
              style={styles.link}
            >
              <Text style={styles.linkLabel}>Hide and go back</Text>
            </Pressable>
          </>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 2, paddingVertical: 4 },
  backLabel: { color: SECONDARY, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  emptyBody: { color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center" },
  error: { color: DOWN, fontSize: 13, fontWeight: "600", lineHeight: 18, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  link: { alignItems: "center", paddingVertical: 8 },
  linkLabel: { color: SECONDARY, fontSize: 14, fontWeight: "600" },
  num: { color: MUTED, fontSize: 11, fontWeight: "600", minWidth: 18, textAlign: "right" },
  pressed: { opacity: 0.6 },
  primary: {
    alignItems: "center",
    backgroundColor: INK,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  primaryLabel: { color: ON_ACCENT, fontSize: 16, fontWeight: "600", lineHeight: 20 },
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 14, padding: 20, paddingBottom: 32 },
  secondary: {
    alignItems: "center",
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  secondaryLabel: { color: INK, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  title: { color: INK, fontSize: 26, fontWeight: "700", letterSpacing: -0.4, lineHeight: 32 },
  warning: {
    alignItems: "flex-start",
    backgroundColor: DOWN_SOFT,
    borderColor: BORDER,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  warningText: { color: DOWN, flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 19 },
  word: {
    alignItems: "baseline",
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "46%",
    flexDirection: "row",
    flexGrow: 1,
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  wordText: { color: INK, fontFamily: "Menlo", fontSize: 14 },
});

export default ExportScreen;
