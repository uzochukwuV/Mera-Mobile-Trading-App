// Asset swap — a React Native port of Bencho's "Asset swap".
//
// MIT licensed, part of Bencho (https://bencho.dev). The web block
// flips the arrow to reverse the swap and taps a coin to pick another;
// here the two sides are passed in and the arrow turns through 180°,
// which is the part worth keeping: the reversal is one object turning,
// not two labels changing.
//
// Tokens, mapped to Pera (see PullToRefresh for the full table):
//   --card      → CARD_SOFT (the two slabs)
//   --fill-on   → INK
//   --pane-edge → BORDER
//   --font-ui   → the system face

import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ReactElement, useRef } from "react";
import { BORDER, CARD_SOFT, FONT, INK, MONO, MUTED, PAPER, RADIUS } from "./homeTheme";

export type SwapSide = {
  /** the small caption above the figure, e.g. "From" */
  label: string;
  /** the main line */
  value: string;
  /** a quieter second line */
  sub?: string;
  /** set for addresses and keys */
  mono?: boolean;
};

export type AssetSwapProps = {
  from: SwapSide;
  to: SwapSide;
  onFlip?: () => void;
  /** the arrow's accessibility label */
  flipLabel?: string;
};

export function AssetSwap({
  from,
  to,
  onFlip,
  flipLabel = "Switch direction",
}: AssetSwapProps): ReactElement {
  // ── the arrow is a rotation, not a second icon ────────────
  // A swap that swapped glyphs would be a state change; a shape
  // that turns says "this went round", which is what happened.
  const turn = useRef(new Animated.Value(0)).current;
  const turns = useRef(0);

  const flip = (): void => {
    if (!onFlip) return;
    turns.current += 1;
    Animated.timing(turn, {
      toValue: turns.current,
      duration: 420,
      easing: Easing.bezier(0.24, 1.34, 0.38, 1),
      useNativeDriver: true,
    }).start();
    onFlip();
  };

  const rotate = turn.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={styles.panel}>
      <Side side={from} />
      <Side side={to} />

      {/* ── the arrow, ON the seam ─────────────────────────
          It sits half over each slab so the two read as one
          object with a turning part in the middle, rather than
          as two cards and a button between them. */}
      <View style={styles.flipWrap} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={flipLabel}
          disabled={!onFlip}
          onPress={flip}
          style={({ pressed }) => [
            styles.flip,
            pressed && onFlip ? styles.flipPressed : null,
            !onFlip && styles.flipIdle,
          ]}
        >
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="swap-vertical" size={18} color={INK} />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

function Side({ side }: { side: SwapSide }): ReactElement {
  return (
    <View style={styles.slab}>
      <Text style={styles.sideLabel}>{side.label}</Text>
      <Text
        numberOfLines={1}
        style={[styles.sideValue, side.mono && styles.sideValueMono]}
      >
        {side.value}
      </Text>
      {side.sub !== undefined ? (
        <Text numberOfLines={1} style={styles.sideSub}>
          {side.sub}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { position: "relative", gap: 8 },
  slab: {
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.input,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sideLabel: {
    color: MUTED,
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 1,
    lineHeight: 14,
    textTransform: "uppercase",
  },
  sideValue: {
    color: INK,
    fontFamily: FONT,
    fontSize: 18,
    fontWeight: "400",
    letterSpacing: -0.3,
    lineHeight: 24,
    marginTop: 4,
  },
  sideValueMono: { fontFamily: MONO, fontSize: 14, letterSpacing: 0 },
  sideSub: { fontFamily: FONT, color: MUTED, fontSize: 12, lineHeight: 16, marginTop: 1 },
  flipWrap: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    marginTop: -20,
    zIndex: 2,
  },
  flip: {
    alignItems: "center",
    backgroundColor: PAPER,
    borderColor: BORDER,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  flipPressed: { transform: [{ scale: 0.94 }] },
  flipIdle: { opacity: 0.5 },
});
