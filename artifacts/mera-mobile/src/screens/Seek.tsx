// Seek — a React Native port of Bencho's "Seek".
//
// MIT licensed, part of Bencho (https://bencho.dev). The web block
// leans toward the cursor; a touch screen has no cursor, so the magnet
// is dropped and the rest is kept exactly:
//
// ONE OBJECT, NOT TWO. There is a single box whose WIDTH is the state,
// and the lens and the field are both inside it the whole time. The
// lens sits at a fixed inset from the left edge — at the closed width
// that inset happens to centre it — so the lens travelling across the
// page is not an animation anybody wrote. It is the box growing around
// a mark that stayed put.
//
// Height never changes and the corner is fully round at every width, so
// the shape is one rule rather than a tween with two ends. At 64 it is
// a circle; at 320 a pill; those are the same statement.
//
// The press is a real beat: compress for a moment before expanding,
// because a thing that yields before it moves reads as having been
// pushed, and a thing that only moves reads as having been triggered.

import { Animated, Platform, Pressable, StyleSheet, TextInput, TextStyle, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ReactElement, useEffect, useRef, useState } from "react";
import { clamp, useSpring, useStillness } from "../motion/spring";
import { CARD_SOFT, FONT, INK, MUTED, SECONDARY } from "./homeTheme";

/* the closed object: a circle, so the width IS the height */
const SHUT = 64;
/* the lens, and its inset. (64 - 28) / 2 is 18, which is also the
 * padding the open field wants — one number doing both jobs */
const LENS = 24;
const INSET = (SHUT - LENS) / 2;

export type SeekProps = {
  value: string;
  onChangeText: (value: string) => void;
  /** the field's resting width when open, px */
  width?: number;
  placeholder?: string;
  /** called when it opens or shuts, e.g. to clear the query */
  onOpenChange?: (open: boolean) => void;
  accessibilityLabel?: string;
};

export function Seek({
  value,
  onChangeText,
  width = 300,
  placeholder = "Search",
  onOpenChange,
  accessibilityLabel = "Search",
}: SeekProps): ReactElement {
  const still = useStillness();
  const [open, setOpen] = useState(false);
  const [press, setPress] = useState(false);
  const field = useRef<TextInput | null>(null);
  const beat = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (beat.current) clearTimeout(beat.current);
    },
    [],
  );

  // ── the width is the state ────────────────────────────────
  // Tuned toward the top of the range: this is a control, and a
  // control that wobbles reads as decoration. What the spring is
  // for is the tiny overshoot at the end — enough that the object
  // arrives rather than stops.
  const span = Math.max(SHUT, width);
  const target = open ? span : SHUT;
  const w = useSpring(target, 78, still);

  // how far through the transformation, 0 shut and 1 open
  const p = clamp((w - SHUT) / Math.max(1, span - SHUT), 0, 1);
  // the placeholder and the caret arrive in the last third, once
  // there is somewhere for them to be
  const say = clamp((p - 0.55) / 0.45, 0, 1);

  // ── opening: compress, then expand, then focus ────────────
  // 90ms is long enough to be felt as the object yielding and
  // short enough that nobody waits for it. Focus lands with the
  // expansion rather than at the end of it, so the caret is
  // already there when the field arrives.
  const start = (): void => {
    if (open) return;
    setPress(true);
    if (beat.current) clearTimeout(beat.current);
    beat.current = setTimeout(
      () => {
        setPress(false);
        setOpen(true);
        onOpenChange?.(true);
        field.current?.focus();
      },
      still ? 0 : 90,
    );
  };

  // Away with nothing typed and it goes back. Away with something
  // typed and it stays: the value IS the reason the field exists,
  // and closing over it would either hide it or throw it away.
  const away = (): void => {
    if (value.trim()) return;
    setOpen(false);
    onOpenChange?.(false);
  };

  const scale = press ? 0.94 : 1;

  return (
    <View
      style={[
        styles.skin,
        {
          width: w,
          transform: [{ scale }],
        },
      ]}
    >
      <View style={styles.lens} pointerEvents="none">
        <Ionicons name="search" size={LENS} color={INK} />
      </View>

      <TextInput
        ref={field}
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        onBlur={away}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        pointerEvents={open ? "auto" : "none"}
        style={[
          styles.field,
          Platform.OS === "web" ? webNoOutline : null,
          { opacity: say },
        ]}
        value={value}
      />

      {/* The way in, and only while there is a way in. When the
          field is open this is the field's own job, and a second
          target over it would swallow the tap that places the caret. */}
      {!open ? (
        <Pressable
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          onPress={start}
          style={styles.hit}
        />
      ) : null}
    </View>
  );
}

// react-native-web draws the browser's focus ring inside the pill, on
// top of the shape that already says "open". Native has no such thing.
const webNoOutline = { outlineStyle: "none" } as unknown as TextStyle;

const styles = StyleSheet.create({
  skin: {
    backgroundColor: CARD_SOFT,
    borderRadius: 32,
    height: SHUT,
    overflow: "hidden",
    position: "relative",
  },
  lens: {
    alignItems: "center",
    height: SHUT,
    justifyContent: "center",
    left: INSET,
    position: "absolute",
    top: 0,
    width: LENS,
  },
  field: {
    bottom: 0,
    color: INK,
    fontFamily: FONT,
    fontSize: 17,
    left: INSET + LENS + 10,
    padding: 0,
    position: "absolute",
    right: 18,
    top: 0,
  },
  hit: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
});
