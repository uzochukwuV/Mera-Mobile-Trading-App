// Liquid toggle — a React Native port of Bencho's "Liquid toggle".
//
// MIT licensed, part of Bencho (https://bencho.dev). The web block is
// framer-motion over an SVG goo filter; here the filter is gone (it had
// one circle left to fuse, and a blur-then-threshold pass over a single
// round shape can only soften its edge) and the spring is RN's
// Animated. What is kept is the idea: ONE body that lengthens along its
// direction of travel and thins across it, so the elasticity is in the
// shape of the thing moving rather than in something left behind.
//
// Tokens, mapped to Pera (see PullToRefresh for the full table):
//   --fill-slab → CARD_SOFT   the track
//   --fill-on   → INK         the handle
//   --pane-edge → BORDER      the hairline

import { Animated, LayoutChangeEvent, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { clamp } from "../motion/spring";
import { ReactElement, useRef, useState } from "react";
import { BORDER, CARD_SOFT, FONT, INK, MUTED, PAPER, RADIUS } from "./homeTheme";

const H = 56;
const PAD = 4;
const GAP = 4;
const DEADZONE = 4;

export type LiquidToggleProps = {
  /** false = left option, true = right option */
  value: boolean;
  onChange: (value: boolean) => void;
  left: string;
  right: string;
  /** the handle's ink. Defaults to INK. */
  ink?: string;
  /** how much the handle lengthens into its own travel, 0..100 */
  stretch?: number;
  accessibilityLabel?: string;
};

export function LiquidToggle({
  value,
  onChange,
  left,
  right,
  ink = INK,
  stretch = 36,
  accessibilityLabel,
}: LiquidToggleProps): ReactElement {
  const [w, setW] = useState(0);
  const [held, setHeld] = useState(false);

  // ── one position, written two ways ────────────────────────
  // The handle's x is an Animated value rather than props state,
  // which is what lets a finger and the spring both drive it without
  // one of them having to know about the other: a drag writes it
  // directly, a release animates it, and nothing re-renders the tree
  // either way.
  const tx = useRef(new Animated.Value(0)).current;
  const sx = useRef(new Animated.Value(1)).current;
  const sy = useRef(new Animated.Value(1)).current;
  const base = useRef(0);
  const dragged = useRef(false);

  const segW = w > 0 ? (w - PAD * 2 - GAP) / 2 : 0;
  const travel = segW + GAP;
  const target = (v: boolean): number => (v ? travel : 0);

  // ── the stretch, and where the numbers come from ──────────
  // The handle's peak speed on a short crossing is about 150px a
  // second, so dividing by 1400 asked it to reach 1400 to mean
  // anything: measured, the stretch peaked at 1.039 — arithmetically
  // present and invisible. 600 puts the peak at about 1.09, and the
  // cap at 0.4 leaves the top of the knob somewhere to go.
  // Area is kept: scaleY is 1/scaleX, so the handle is the same amount
  // of droplet whatever it is doing.
  const lengthen = (v: number): number =>
    1 + Math.min(0.4, Math.abs(v) / 600) * (clamp(stretch, 0, 100) / 100);

  const settle = (v: boolean): void => {
    Animated.spring(tx, {
      // read through the ref, not the closed-over value: the
      // responder below is built once and would otherwise settle
      // against the travel it saw on the first render, which is 0
      toValue: v ? travelRef.current : 0,
      useNativeDriver: true,
      stiffness: 170,
      damping: 21.5,
      mass: 1,
    }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      // a tap belongs to the labels; only a real drag takes the handle
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > DEADZONE,
      onPanResponderGrant: () => {
        dragged.current = false;
        setHeld(true);
        // freeze the spring where the finger found it
        tx.stopAnimation((v) => {
          base.current = v;
        });
      },
      onPanResponderMove: (_e, g) => {
        dragged.current = true;
        tx.setValue(clamp(base.current + g.dx, 0, travelRef.current));
        const l = lengthen(g.vx * 1000);
        sx.setValue(l);
        sy.setValue(1 / l);
      },
      onPanResponderRelease: (_e, g) => {
        setHeld(false);
        sx.setValue(1);
        sy.setValue(1);
        const far = clamp(base.current + g.dx, 0, travelRef.current);
        const next = far > travelRef.current / 2;
        if (next !== valueRef.current) onChange(next);
        else settle(valueRef.current);
      },
      onPanResponderTerminate: () => {
        setHeld(false);
        sx.setValue(1);
        sy.setValue(1);
        settle(valueRef.current);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const travelRef = useRef(travel);
  travelRef.current = travel;
  const valueRef = useRef(value);
  valueRef.current = value;

  // keep the handle under the value whenever the layout or the value
  // changes from outside (a tap, or the first measure)
  const lastW = useRef(-1);
  if (w !== lastW.current) {
    lastW.current = w;
    if (w > 0) tx.setValue(target(value));
  }

  const onLayout = (e: LayoutChangeEvent): void => setW(e.nativeEvent.layout.width);

  const pick = (v: boolean): void => {
    if (v === value) return;
    onChange(v);
    settle(v);
  };

  return (
    <View
      style={styles.track}
      onLayout={onLayout}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      {...pan.panHandlers}
    >
      {w > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              width: segW,
              backgroundColor: ink,
              transform: [
                { translateX: tx },
                { scaleX: sx },
                { scaleY: sy },
              ],
            },
          ]}
        />
      ) : null}

      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: !value }}
        onPress={() => pick(false)}
        style={styles.seg}
      >
        <Text style={[styles.label, !value ? styles.labelOn : styles.labelOff]}>
          {left}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: value }}
        onPress={() => pick(true)}
        style={styles.seg}
      >
        <Text style={[styles.label, value ? styles.labelOn : styles.labelOff]}>
          {right}
        </Text>
      </Pressable>

      {/* held, so the settling spring knows to keep out of the way
          while a finger owns the handle — and so the cursor reads as
          grabbing on the web build */}
      {held ? <View pointerEvents="none" style={styles.heldRing} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    height: H,
    overflow: "hidden",
    padding: PAD,
  },
  thumb: {
    position: "absolute",
    left: PAD,
    top: PAD,
    bottom: PAD,
    borderRadius: RADIUS.pill,
  },
  seg: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    zIndex: 1,
  },
  label: { fontFamily: FONT, fontSize: 15, fontWeight: "400", letterSpacing: -0.1 },
  labelOn: { color: PAPER },
  labelOff: { color: MUTED },
  heldRing: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderColor: BORDER,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
});
