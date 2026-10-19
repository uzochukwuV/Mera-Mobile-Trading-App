// Label input — a React Native port of Bencho's "Label input".
//
// MIT licensed, part of Bencho (https://bencho.dev). The web block
// lifts the label into the top edge of the field on focus with CSS
// transitions; here the same lift is an Animated value driving the
// label's top offset and size, so it reads as one object moving
// rather than two labels swapping.
//
// Tokens, mapped to Pera (see PullToRefresh for the full table):
//   --fill-on  → INK
//   --fill-slab → PAPER (the field's surface)
//   --ink-3/4  → MUTED
//   --pane-edge → BORDER

import { Animated, Easing, KeyboardTypeOptions, Platform, StyleSheet, Text, TextInput, TextStyle, View } from "react-native";
import { ReactElement, useEffect, useRef, useState } from "react";
import { BORDER, FONT, INK, MONO, MUTED, PAPER, RADIUS } from "./homeTheme";

export type LabelInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: KeyboardTypeOptions;
  editable?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  maxLength?: number;
  accessibilityLabel?: string;
  monospace?: boolean;
};

export function LabelInput({
  label,
  value,
  onChangeText,
  keyboardType,
  editable = true,
  autoCapitalize = "none",
  autoCorrect = false,
  maxLength,
  accessibilityLabel,
  monospace = false,
}: LabelInputProps): ReactElement {
  const [focused, setFocused] = useState(false);
  const raised = focused || value.length > 0;
  const lift = useRef(new Animated.Value(raised ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(lift, {
      toValue: raised ? 1 : 0,
      duration: 180,
      // the block's transition is 180ms with a standard ease; the
      // cubic keeps the label's arrival unhurried at the top
      easing: Easing.out(Easing.cubic),
      // font size and top are layout properties, so this cannot run
      // on the native driver — the field is small enough that the JS
      // thread has the budget
      useNativeDriver: false,
    }).start();
  }, [raised, lift]);

  const labelTop = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 7],
  });
  const labelSize = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 11],
  });

  return (
    <View
      style={[
        styles.field,
        { borderColor: focused ? INK : BORDER },
        !editable && styles.fieldDisabled,
      ]}
    >
      <Animated.Text
        pointerEvents="none"
        style={[
          styles.label,
          {
            top: labelTop,
            fontFamily: FONT,
            fontSize: labelSize,
            color: focused ? INK : MUTED,
          },
        ]}
      >
        {label}
      </Animated.Text>
      <TextInput
        accessibilityLabel={accessibilityLabel ?? label}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={editable}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onBlur={() => setFocused(false)}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        style={[
          styles.input,
          Platform.OS === "web" ? webNoOutline : null,
          monospace && styles.inputMono,
          !editable && styles.inputDisabled,
        ]}
        value={value}
      />
    </View>
  );
}

// react-native-web draws the browser's focus ring inside the field, on
// top of the border that already says "focused". Native has no such
// thing, so this is web-only.
const webNoOutline = { outlineStyle: "none" } as unknown as TextStyle;

const styles = StyleSheet.create({
  field: {
    backgroundColor: PAPER,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    height: 60,
    justifyContent: "flex-end",
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  fieldDisabled: { opacity: 0.6 },
  label: {
    position: "absolute",
    left: 14,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  input: {
    color: INK,
    fontFamily: FONT,
    fontSize: 16,
    padding: 0,
  },
  inputMono: { fontFamily: MONO, fontSize: 14 },
  inputDisabled: { color: MUTED },
});
