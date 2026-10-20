import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ReactElement, useState } from "react";
import { BG, BORDER, CARD, DOWN, DOWN_SOFT, FONT, INK, MUTED, ON_ACCENT, PAPER, RADIUS, SECONDARY, SHEET, TEAL } from "./homeTheme";
import { CopySettingsForm, CopySettingsProps } from "./types";
import { normalizeAmountInput } from "../amount";

function Field({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType="decimal-pad"
        onChangeText={(value) => onChange(normalizeAmountInput(value))}
        placeholder="0"
        placeholderTextColor={MUTED}
        style={styles.input}
        value={value}
      />
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

export function CopySettingsScreen(props: CopySettingsProps = {}): ReactElement {
  const {
    handle = "trader",
    initial,
    saving = false,
    saveError = null,
    onSave,
    onBack,
  } = props;
  const [allocation, setAllocation] = useState(initial?.allocation ?? "");
  const [maxLeverage, setMaxLeverage] = useState(initial?.maxLeverage ?? "3");
  const [maxNotional, setMaxNotional] = useState(initial?.maxNotional ?? "5000");
  const [dailyLoss, setDailyLoss] = useState(initial?.dailyLoss ?? "50");
  const [slippage, setSlippage] = useState(initial?.slippage ?? "50");
  const [stopLoss, setStopLoss] = useState(initial?.stopLoss ?? "2000");

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
        <Text style={styles.title}>Copy settings</Text>
        <Text style={styles.subtitle}>
          Copying {handle} · changes apply to new orders
        </Text>

        {saveError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{saveError}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Field
            label="Allocation (aUSD)"
            hint="Capital assigned to this trader"
            value={allocation}
            onChange={setAllocation}
          />
          <Field
            label="Max leverage"
            hint="Caps position sizing per trade"
            value={maxLeverage}
            onChange={setMaxLeverage}
          />
          <Field
            label="Max notional per trade (USD)"
            hint="Largest single mirrored order"
            value={maxNotional}
            onChange={setMaxNotional}
          />
          <Field
            label="Daily loss limit (USD)"
            hint="Copying pauses past this daily loss"
            value={dailyLoss}
            onChange={setDailyLoss}
          />
          <Field
            label="Slippage (bps)"
            hint="Worst acceptable fill vs signal"
            value={slippage}
            onChange={setSlippage}
          />
          <Field
            label="Stop loss (bps)"
            hint="Emergency exit per position"
            value={stopLoss}
            onChange={setStopLoss}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() =>
            onSave?.({
              allocation,
              maxLeverage,
              maxNotional,
              dailyLoss,
              slippage,
              stopLoss,
            })
          }
          style={[styles.save, saving ? styles.saving : null]}
        >
          <Text style={styles.saveLabel}>
            {saving ? "Saving…" : "Save settings"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

export type { CopySettingsForm };

const styles = StyleSheet.create({
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 12, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 8 },
  back: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingVertical: 8,
  },
  backLabel: { fontFamily: FONT, color: SECONDARY, fontSize: 14, fontWeight: "400" },
  title: { fontFamily: FONT, color: INK, fontSize: 26, fontWeight: "400", lineHeight: 32 },
  subtitle: { fontFamily: FONT, color: MUTED, fontSize: 13, fontWeight: "400", lineHeight: 18 },
  errorCard: {
    backgroundColor: DOWN_SOFT,
    borderColor: DOWN_SOFT,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  errorText: { fontFamily: FONT, color: DOWN, fontSize: 13, fontWeight: "400", lineHeight: 19 },
  card: {
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  field: { gap: 4 },
  label: { fontFamily: FONT, color: INK, fontSize: 14, fontWeight: "400" },
  input: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    color: INK,
    fontFamily: FONT,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  hint: { fontFamily: FONT, color: MUTED, fontSize: 12, lineHeight: 16 },
  save: {
    alignItems: "center",
    backgroundColor: TEAL,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    minHeight: 56,
    paddingVertical: 16,
  },
  saving: { opacity: 0.6 },
  saveLabel: { fontFamily: FONT, color: ON_ACCENT, fontSize: 16, fontWeight: "400" },
});
