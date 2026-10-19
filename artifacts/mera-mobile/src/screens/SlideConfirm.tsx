// Slide to confirm — a React Native port of Bencho's "Slide to confirm".
//
// MIT licensed, part of Bencho (https://bencho.dev). The web block is
// a div track with a framer-motion handle; here the drag is a
// PanResponder and the morph is two Animated values driven together.
//
// THE HANDLE BECOMES THE ANSWER. On commit it does not hand over to a
// tick somewhere else — it unfurls leftward and fills the track it was
// crossing, and the arrow it was carrying becomes a check. One object
// changing shape, which is the case a morph is actually for, and the
// reason this needs no second element to say "done".
//
// The right edge does not move while that happens: the width grows by
// exactly what the offset loses, so PAD + x + width is a number with no
// x in it. The handle arrives, plants itself, and opens out behind it.

import { Animated, Easing, LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { clamp } from "../motion/spring";
import { ReactElement, useEffect, useRef, useState } from "react";
import { CARD_SOFT, FONT, INK, MUTED, PAPER, RADIUS } from "./homeTheme";

const H = 56;
// the inset the handle keeps from the track, all four sides
const PAD = 4;
// the handle is a circle in a 56 track, so it is sized by the HEIGHT
const GRIP = H - PAD * 2;
// how long the finished state stands before it resets. It has to
// reset: a slide that stayed confirmed would leave a control with
// nothing to do.
const HOLD = 1500;
const DEADZONE = 4;

export type SlideConfirmProps = {
  /** the words on the track, e.g. "Slide to Buy Long" */
  label: string;
  /** called when the handle reaches the end. Fires at the distance,
   *  not on release — but reaching it is the whole gesture. */
  onConfirm: () => void;
  /** the handle's ink and the confirmed fill. Defaults to INK. */
  ink?: string;
  /** what rides on the fill — the grip's icon. Defaults to PAPER,
   *  which is right for every dark ink; a light fill needs its own. */
  contrast?: string;
  /** how quickly it takes over once you let go, 0..100 */
  speed?: number;
  /** blocks the gesture, e.g. while a request is in flight */
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function SlideConfirm({
  label,
  onConfirm,
  ink = INK,
  contrast = PAPER,
  speed = 50,
  disabled = false,
  accessibilityLabel,
}: SlideConfirmProps): ReactElement {
  const [span, setSpan] = useState(0);
  const [done, setDone] = useState(false);

  // the live grab. A ref rather than state for the reason every drag
  // uses one: it changes on every frame of a gesture, which is exactly
  // the value that must not render.
  const base = useRef(0);
  const finished = useRef(false);
  // the live offset, updated on every move. The release used to ask
  // stopAnimation for it, which is a callback on the next tick — by
  // which time the responder has often been released and the answer is
  // stale. A ref the drag writes itself cannot be stale.
  const cur = useRef(0);

  const x = useRef(new Animated.Value(0)).current;
  const wid = useRef(new Animated.Value(GRIP)).current;

  // the travel, and the mark — the end IS the commit, and there is no
  // knob. A slide-to-confirm that fires at 60% is one you can trigger
  // by knocking the handle, which is the single thing the gesture
  // exists to prevent. The only honest answer is the end of the track.
  const travel = Math.max(1, span - PAD * 2 - GRIP);
  const travelRef = useRef(travel);
  travelRef.current = travel;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  // the words fade as the capsule comes for them; the block reaches
  // zero at 55% of the travel, and the capsule's edge arrives at the
  // first letter around 30%
  const labelOpacity = x.interpolate({
    inputRange: [0, Math.max(1, travel * 0.55)],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  // the ground already covered — the same ink as the handle, which
  // turns this from a trail into the handle's own body
  const washWidth = x.interpolate({
    inputRange: [0, travel],
    outputRange: [GRIP, travel + GRIP],
    extrapolate: "clamp",
  });

  const reset = (): void => {
    finished.current = false;
    setDone(false);
    base.current = 0;
    cur.current = 0;
    x.setValue(0);
    wid.setValue(GRIP);
  };

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(reset, HOLD);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const commit = (): void => {
    if (finished.current) return;
    finished.current = true;
    setDone(true);
    cur.current = 0;
    onConfirm();
    const ms = 420 - (clamp(speed, 0, 100) / 100) * 220;
    // two values, one duration and one curve. The block pins the
    // right edge by arithmetic rather than by two animations
    // agreeing, and this keeps that promise: PAD + x + width is
    // constant across the pair.
    Animated.parallel([
      Animated.timing(x, {
        toValue: 0,
        duration: ms,
        easing: Easing.bezier(0.22, 0.9, 0.24, 1),
        useNativeDriver: false,
      }),
      Animated.timing(wid, {
        toValue: travelRef.current + GRIP,
        duration: ms,
        easing: Easing.bezier(0.22, 0.9, 0.24, 1),
        useNativeDriver: false,
      }),
    ]).start();
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      // horizontal only: vertical belongs to the page's scroll
      onMoveShouldSetPanResponder: (_e, g) =>
        !disabledRef.current &&
        Math.abs(g.dx) > DEADZONE &&
        Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        base.current = cur.current;
      },
      onPanResponderMove: (_e, g) => {
        cur.current = clamp(base.current + g.dx, 0, travelRef.current);
        x.setValue(cur.current);
      },
      onPanResponderRelease: () => {
        // reaching the end is what commits, so check the value
        if (cur.current >= travelRef.current - 1) commit();
        else {
          base.current = 0;
          cur.current = 0;
          Animated.spring(x, {
            toValue: 0,
            stiffness: 180,
            damping: 22,
            mass: 1,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (cur.current >= travelRef.current - 1) commit();
        else {
          base.current = 0;
          cur.current = 0;
          Animated.spring(x, {
            toValue: 0,
            stiffness: 180,
            damping: 22,
            mass: 1,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent): void => {
    const next = e.nativeEvent.layout.width;
    setSpan(next);
    if (next > 0 && !finished.current) wid.setValue(GRIP);
  };

  // a settled `offset` is not needed by the layout; the accessibility
  // action commits directly, so there is nothing to animate from
  return (
    <View
      style={styles.track}
      onLayout={onLayout}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      accessibilityActions={[{ name: "activate", label: "Confirm" }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === "activate" && !disabled) commit();
      }}
      {...pan.panHandlers}
    >
      {/* the ground already covered, above the label so it WIPES it —
          the words leave under a rounded edge that is the handle's own
          shape, which reads as the thing eating them rather than as a
          wipe */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.wash,
          {
            backgroundColor: ink,
            width: washWidth,
          },
        ]}
      />

      <Animated.Text
        numberOfLines={1}
        pointerEvents="none"
        style={[styles.say, { opacity: labelOpacity }]}
      >
        {label}
      </Animated.Text>

      {/* the handle. It takes the pointer now, and the track still
          wins, so a drag that wanders off the handle keeps reporting. */}
      <Animated.View
        style={[
          styles.grip,
          {
            width: wid,
            backgroundColor: ink,
            transform: [{ translateX: x }],
          },
        ]}
      >
        {done ? (
          <Ionicons name="checkmark" size={22} color={contrast} />
        ) : (
          <Ionicons name="arrow-forward" size={20} color={contrast} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: "relative",
    width: "100%",
    height: H,
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.pill,
    overflow: "hidden",
  },
  wash: {
    position: "absolute",
    left: PAD,
    top: PAD,
    bottom: PAD,
    borderRadius: RADIUS.pill,
  },
  say: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    textAlign: "center",
    textAlignVertical: "center",
    // the absolute fill does not centre text vertically on Android
    // without a line height, so give it the track's own
    lineHeight: H,
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: -0.1,
    color: MUTED,
  },
  grip: {
    position: "absolute",
    left: PAD,
    top: PAD,
    height: GRIP,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    // the wall it lands against, so the squash compresses toward the
    // end of the track rather than about its middle
    transformOrigin: "left center",
  },
});
