import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ReactElement, useState } from "react";
import { BG, BORDER, CARD, CARD_SOFT, DOWN, DOWN_SOFT, FONT, INDIGO_SOFT, INK, MONO, MUTED, ON_ACCENT, RADIUS, SECONDARY, SHEET, TEAL } from "./homeTheme";
import { ConnectPerplProps } from "./types";

function truncate(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ConnectPerplScreen(props: ConnectPerplProps): ReactElement {
  const {
    address,
    busy = false,
    error = null,
    onEnrollNew,
    onImportKey,
    onGoFund,
    onRetry,
    onBack,
  } = props;
  const [showImport, setShowImport] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  const importReady =
    apiKey.trim().length >= 8 && /^0x[0-9a-fA-F]{64}$/.test(privateKey.trim());

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

        <Text style={styles.title}>Connect trading</Text>
        <Text style={styles.subtitle}>
          Enroll a trading key for this wallet. One passkey signature — the key
          itself is generated on this device.
        </Text>

        <View style={styles.card}>
          <Text style={styles.caption}>WALLET</Text>
          <View style={styles.walletRow}>
            <Text style={styles.mono}>{truncate(address)}</Text>
            <View style={styles.eipTag}>
              <Text style={styles.eipLabel}>EIP-712</Text>
            </View>
          </View>
          <View style={styles.steps}>
            {["Payload", "Sign", "Confirm"].map((label, index) => (
              <View
                key={label}
                style={[styles.step, busy && index === 1 ? styles.stepActive : null]}
              >
                <Text
                  style={[
                    styles.stepLabel,
                    busy && index === 1 ? styles.stepLabelActive : null,
                  ]}
                >
                  {index + 1} · {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            {error.code ? (
              <Text style={styles.errorCode}>{error.code}</Text>
            ) : null}
            <Text style={styles.errorMessage}>{error.message}</Text>
            {onRetry ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={onRetry}
                style={styles.retry}
              >
                <Text style={styles.retryLabel}>Try again</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enroll new trading key"
          disabled={busy}
          onPress={() => onEnrollNew?.()}
          style={({ pressed }) => [
            styles.primary,
            busy || pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.primaryLabel}>
            {busy ? "Waiting for passkey…" : "Enroll new trading key"}
          </Text>
        </Pressable>

        {showImport ? (
          <View style={styles.card}>
            <Text style={styles.caption}>IMPORT FROM PERPL WEB UI</Text>
            <Text style={styles.hint}>
              Create a key at testnet.perpl.xyz/apikeys, then paste the token
              and private key here.
            </Text>
            <Text style={styles.fieldLabel}>API token</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              onChangeText={setApiKey}
              placeholder="Paste X-API-Key token"
              placeholderTextColor={MUTED}
              style={styles.input}
              value={apiKey}
            />
            <Text style={styles.fieldLabel}>Private key (0x…64 hex)</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              onChangeText={setPrivateKey}
              placeholder="0x…"
              placeholderTextColor={MUTED}
              secureTextEntry
              style={[styles.input, styles.monoInput]}
              value={privateKey}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Import trading key"
              disabled={busy || !importReady}
              onPress={() =>
                onImportKey?.({
                  apiKey: apiKey.trim(),
                  privateKey: privateKey.trim(),
                })
              }
              style={({ pressed }) => [
                styles.secondary,
                busy || !importReady || pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.secondaryLabel}>Import key</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            hitSlop={8}
            onPress={() => setShowImport(true)}
            style={styles.link}
          >
            <Text style={styles.linkLabel}>Have a key already? Import it</Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          hitSlop={8}
          onPress={() => onGoFund?.()}
          style={styles.link}
        >
          <Text style={styles.linkLabel}>I haven't funded yet →</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 4, paddingVertical: 4 },
  backLabel: { fontFamily: FONT, color: SECONDARY, fontSize: 15, fontWeight: "400", lineHeight: 20 },
  caption: { fontFamily: FONT, color: MUTED, fontSize: 11, fontWeight: "400", letterSpacing: 1, lineHeight: 14 },
  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  eipLabel: { fontFamily: FONT, color: INK, fontSize: 11, fontWeight: "400" },
  eipTag: {
    backgroundColor: INDIGO_SOFT,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  errorCard: {
    backgroundColor: DOWN_SOFT,
    borderColor: BORDER,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  errorCode: { color: DOWN, fontFamily: MONO, fontSize: 12, lineHeight: 14 },
  errorMessage: { fontFamily: FONT, color: SECONDARY, fontSize: 13, lineHeight: 19 },
  fieldLabel: { fontFamily: FONT, color: SECONDARY, fontSize: 13, fontWeight: "400" },
  hint: { fontFamily: FONT, color: MUTED, fontSize: 13, lineHeight: 19 },
  input: {
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    color: INK,
    fontFamily: FONT,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  link: { alignItems: "center", paddingVertical: 8 },
  linkLabel: { fontFamily: FONT, color: INK, fontSize: 14, fontWeight: "400" },
  mono: { color: INK, flex: 1, fontFamily: MONO, fontSize: 13, lineHeight: 18 },
  monoInput: { fontFamily: MONO },
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
  primaryLabel: { fontFamily: FONT, color: ON_ACCENT, fontSize: 16, fontWeight: "400", lineHeight: 20 },
  retry: { alignSelf: "flex-start", paddingVertical: 4 },
  retryLabel: { fontFamily: FONT, color: INK, fontSize: 14, fontWeight: "400" },
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 16, padding: 20, paddingBottom: 32 },
  secondary: {
    alignItems: "center",
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  secondaryLabel: { fontFamily: FONT, color: INK, fontSize: 14, fontWeight: "400", lineHeight: 20 },
  step: {
    backgroundColor: SHEET,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stepActive: { backgroundColor: INK },
  stepLabel: { fontFamily: FONT, color: MUTED, fontSize: 12, fontWeight: "400" },
  stepLabelActive: { color: ON_ACCENT },
  steps: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  subtitle: { fontFamily: FONT, color: SECONDARY, fontSize: 15, lineHeight: 22 },
  title: { fontFamily: FONT, color: INK, fontSize: 26, fontWeight: "400", letterSpacing: -0.4, lineHeight: 32 },
  walletRow: { alignItems: "center", flexDirection: "row", gap: 12 },
});

export default ConnectPerplScreen;
