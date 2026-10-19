// Dynamic island — a React Native port of Bencho's "Dynamic island".
//
// MIT licensed, part of Bencho (https://bencho.dev). The web block
// switches between four activities; this keeps the shape and the
// transition and lets the caller supply the two contents, which is what
// a real one is: a pill that holds a live activity and opens into it.
//
// ── THE SHAPE IS ONE SPRING, THE CONTENT IS NOT ──────────
// Width, height and corner ride one value, so the pill grows as one
// object and never as a box whose corners catch up later. The contents
// do not morph with it: the compact row and the expanded card are two
// different layouts, and stretching one into the other is the thing
// that looks cheap. They crossfade instead, the old one leaving a beat
// before the new one arrives.
//
// The island is black whatever the page is — it is the screen switched
// off around a camera, not a surface of the app.

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";

import { OBSIDIAN } from "./homeTheme";

const NUDGE = 1.08;

export type DynamicIslandProps = {
  /** the shut state — one line, always legible at 36px */
  compact: ReactNode;
  /** the open card */
  expanded: ReactNode;
  /** controlled open. Omit to let the island own it. */
  open?: boolean;
  onToggle?: (open: boolean) => void;
  width?: number;
  openWidth?: number;
  height?: number;
  openHeight?: number;
  accessibilityLabel?: string;
};

export function DynamicIsland({
  compact,
  expanded,
  open: openProp,
  onToggle,
  width = 132,
  openWidth = 300,
  height = 36,
  openHeight = 96,
  accessibilityLabel = "Activity",
}: DynamicIslandProps): ReactElement {
  const [ownOpen, setOwnOpen] = useState(false);
  const open = openProp ?? ownOpen;
  const setOpen = (next: boolean): void => {
    if (openProp === undefined) setOwnOpen(next);
    onToggle?.(next);
  };

  const p = useRef(new Animated.Value(0)).current;
  const nudge = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(p, {
      toValue: open ? 1 : 0,
      duration: 380,
      easing: Easing.bezier(0.24, 1.2, 0.38, 1),
      // width and height are layout properties; the crossfade rides
      // the same number so the two cannot disagree
      useNativeDriver: false,
    }).start();
    if (!open) return;
    // a new activity arriving while shut swells a touch past its own
    // size and settles, the way the real one nods
    Animated.sequence([
      Animated.timing(nudge, {
        toValue: NUDGE,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(nudge, {
        toValue: 1,
        stiffness: 260,
        damping: 18,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, p, nudge]);

  const w = p.interpolate({ inputRange: [0, 1], outputRange: [width, openWidth] });
  const h = p.interpolate({ inputRange: [0, 1], outputRange: [height, openHeight] });
  const r = p.interpolate({
    inputRange: [0, 1],
    outputRange: [height / 2, 22],
  });
  const compactOpacity = p.interpolate({
    inputRange: [0, 0.35],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const expandedOpacity = p.interpolate({
    inputRange: [0.55, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.island,
        { width: w, height: h, borderRadius: r, transform: [{ scale: nudge }] },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={styles.hit}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.compact, { opacity: compactOpacity }]}
        >
          {compact}
        </Animated.View>
      </Pressable>

      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={[styles.expanded, { opacity: expandedOpacity }]}
      >
        {/* tapping the card anywhere that is not one of its own
            controls tucks it back into the pill */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close activity"
          onPress={() => setOpen(false)}
          style={styles.hit}
        />
        {expanded}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  island: {
    backgroundColor: OBSIDIAN,
    overflow: "hidden",
    position: "relative",
  },
  hit: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  compact: {
    alignItems: "center",
    flexDirection: "row",
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  expanded: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    padding: 16,
  },
});
