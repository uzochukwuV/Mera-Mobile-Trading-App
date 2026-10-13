import type { ReactNode } from "react";
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { palette, radii, spacing, text } from "../theme";

type TextFieldProps = {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  mono?: boolean;
  right?: ReactNode;
  editable?: boolean;
};

function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  keyboardType,
  secureTextEntry,
  mono = false,
  right,
  editable = true,
}: TextFieldProps) {
  const hasError = Boolean(error);

  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={text.caption}>{label}</Text>
          {right ? <View>{right}</View> : null}
        </View>
      ) : null}
      <TextInput
        editable={editable}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textTertiary}
        secureTextEntry={secureTextEntry}
        style={[
          styles.input,
          mono ? styles.mono : null,
          hasError ? styles.inputError : null,
          !editable ? styles.inputDisabled : null,
        ]}
        value={value}
      />
      {hasError ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={text.small}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  error: { color: palette.error, fontSize: 12, lineHeight: 16 },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: palette.text,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  inputDisabled: { opacity: 0.6 },
  inputError: { borderColor: palette.error },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mono: { fontFamily: "Menlo", fontSize: 13 },
  wrap: { gap: spacing.xs },
});

export { TextField };