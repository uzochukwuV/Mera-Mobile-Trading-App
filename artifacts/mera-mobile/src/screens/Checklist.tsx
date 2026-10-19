// Checklist — a React Native port of Bencho's "Checklist".
//
// MIT licensed, part of Bencho (https://bencho.dev). The web block is
// framer-motion; here each row owns one spring (the same `useSpring`
// the pull card uses) and the fall is a per-row Animated sequence.
//
// ONE SPRING PER ROW, AND EVERYTHING IS READ OFF IT. The box filling,
// the tick drawing, the rule crossing the words and the words giving up
// their ink are four readings of a single number, not four things
// animated toward the same moment. The fill takes the raw value, so it
// swells past full and settles; the TICK and the RULE take it clamped —
// a tick that overshoots draws itself past its own end, which is a
// glitch rather than a bounce.
//
// Tokens, mapped to Pera (see PullToRefresh for the full table):
//   --fill-on   → INK
//   --fill-slab → PAPER
//   --pane-edge → BORDER
//   --ok        → UP

import Svg, { Path } from "react-native-svg";
import { Animated, Easing, LayoutChangeEvent, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ReactElement, useEffect, useRef, useState } from "react";
import { clamp, mix, useSpring, useStillness } from "../motion/spring";
import { BORDER, FONT, INK, MUTED, PAPER, UP } from "./homeTheme";

/* the inset, the same on all four sides — see `padV` */
const PAD = 14;
const ROW = 40;
const BOX = 18;
const CORNER = 20;
const BOUNCE = 50;
/* the rule follows the tick rather than racing it */
const LAG = 0.12;
const RUN = 0.72;
/* how long the FURTHEST fall takes; the others are shorter in
 * proportion, because they are all under one gravity */
const DROP_MS = 460;
const REBOUND = 8;
const MAX_LEAN = 6;
const REACH = 40;
const DRIFT = [-5, 4, -2, 5, -3];
const MAX = 5;

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type ChecklistProps = {
  items: ChecklistItem[];
  /** a row was pressed. Omit to make the list read-only. */
  onPressItem?: (id: string) => void;
  /** corner, 0..40 */
  corner?: number;
  /** how far the box swells past full, 0..100 */
  bounce?: number;
  /** the box, px */
  box?: number;
  /** add-a-task affordance. Omit and the spare row is not drawn. */
  onAdd?: (label: string) => void;
};

const leanOf = (over: number): number => MAX_LEAN * (1 - Math.exp(-over / REACH));
const sin = (deg: number): number => Math.sin((deg * Math.PI) / 180);

export function Checklist({
  items,
  onPressItem,
  corner = CORNER,
  bounce = BOUNCE,
  box = BOX,
  onAdd,
}: ChecklistProps): ReactElement {
  const still = useStillness();
  const [runs, setRuns] = useState<number[]>([]);
  const [line, setLine] = useState(18);

  const measure = (i: number, px: number, tall: number): void => {
    setRuns((v) => {
      if (v[i] === px) return v;
      const next = [...v];
      next[i] = px;
      return next;
    });
    setLine((v) => (v === tall ? v : tall));
  };

  const r = clamp(corner, 0, 40);
  const side = clamp(Math.round(box), 14, 28);

  /* ── the whole finish, as one derived boolean ─────────── */
  const fell = items.length > 0 && items.every((t) => t.done);
  const spare = onAdd !== undefined && items.length < MAX;

  const slack = (ROW - side) / 2;
  const padV = Math.max(0, PAD - slack);
  const body = Math.max(side, line);
  const inset = (ROW - body) / 2;
  const slots = items.length + (spare ? 1 : 0);
  const floor = padV + ROW * slots;

  // ── the lean of each slip, from the floor up ───────────
  // The bottom one lies flat. Everything above inherits what it is
  // lying on and adds its own overhang.
  const leans = items.map(() => 0);
  for (let i = items.length - 2; i >= 0; i--) {
    const over = Math.max(0, (runs[i] ?? 0) - (runs[i + 1] ?? 0));
    leans[i] = clamp(leans[i + 1] + leanOf(over), 0, MAX_LEAN);
  }
  // the daylight between slips, computed from the leans at the end
  // of the WORDS rather than at the end of the invisible row
  const mid = (runs.reduce((a, b) => Math.max(a, b), 0) || 1) / 2;
  const touch =
    1 +
    Math.max(
      0,
      ...leans.slice(1).map((below, i) => {
        const ink = Math.max(runs[i] ?? mid, runs[i + 1] ?? mid);
        return Math.max(0, (ink - mid) * (sin(leans[i]) - sin(below)));
      }),
    );

  const seat = floor - inset - body;
  const restTop = (i: number): number => padV + i * ROW;
  const pileTop = (i: number): number =>
    seat - (items.length - 1 - i) * (body + touch);
  const drops = items.map((_, i) => Math.max(0, pileTop(i) - restTop(i)));
  const longest = Math.max(...drops, 1);

  const add = (text: string): void => {
    const label = text.trim();
    if (!label || items.length >= MAX) return;
    onAdd?.(label);
  };

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: r,
          paddingHorizontal: PAD,
          paddingVertical: padV,
        },
      ]}
    >
      {items.map((task, i) => (
        <Row
          key={task.id}
          label={task.label}
          on={task.done}
          side={side}
          bounce={bounce}
          still={still}
          fell={fell}
          drop={drops[i] ?? 0}
          secs={DROP_MS * Math.sqrt((drops[i] ?? 0) / longest)}
          inset={inset}
          drift={DRIFT[i % DRIFT.length]}
          tilt={leans[i] ?? 0}
          index={i}
          layer={fell ? items.length - i : undefined}
          onRun={measure}
          onPress={() => onPressItem?.(task.id)}
        />
      ))}

      {spare ? (
        <AddRow side={side} onAdd={add} />
      ) : null}
    </View>
  );
}

function Row({
  label,
  on,
  side,
  bounce,
  still,
  fell,
  drop,
  secs,
  inset,
  drift,
  tilt,
  layer,
  index,
  onRun,
  onPress,
}: {
  label: string;
  on: boolean;
  side: number;
  bounce: number;
  still: boolean;
  fell: boolean;
  drop: number;
  secs: number;
  inset: number;
  drift: number;
  tilt: number;
  layer?: number;
  index: number;
  onRun: (i: number, px: number, tall: number) => void;
  onPress: () => void;
}): ReactElement {
  // ── the one number ──────────────────────────────────────
  const t = useSpring(on ? 1 : 0, clamp(bounce, 0, 100), still);
  const held = clamp(t, 0, 1);
  const cut = clamp((held - LAG) / RUN, 0, 1);

  // ── the fall ────────────────────────────────────────────
  // Down is a duration with gravity's shape in it; up is a spring,
  // because coming back is the list reasserting itself.
  const y = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // motion turned down: there is no quieter version of a thing
    // falling over, so it does not happen
    if (still) {
      y.setValue(fell ? drop : 0);
      x.setValue(fell ? drift : 0);
      rot.setValue(fell ? tilt : 0);
      return;
    }
    if (fell) {
      const ms = Math.max(1, secs);
      const up = Math.min(REBOUND, drop * 0.22);
      Animated.sequence([
        Animated.timing(y, {
          toValue: drop,
          duration: ms * 0.66,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: drop - up,
          duration: ms * 0.18,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: drop,
          duration: ms * 0.16,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      Animated.parallel([
        Animated.timing(x, {
          toValue: drift,
          duration: ms,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rot, {
          toValue: tilt,
          duration: ms,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(y, {
          toValue: 0,
          stiffness: 380,
          damping: 34,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.spring(x, {
          toValue: 0,
          stiffness: 380,
          damping: 34,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.spring(rot, {
          toValue: 0,
          stiffness: 380,
          damping: 34,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // drop/tilt can change while fallen (a measured width lands a
    // frame late), so they are dependencies rather than constants
  }, [fell, drop, drift, tilt, secs, still, y, x, rot]);

  const rotate = rot.interpolate({
    inputRange: [0, MAX_LEAN],
    outputRange: ["0deg", `${MAX_LEAN}deg`],
  });

  const onLayout = (e: LayoutChangeEvent): void =>
    onRun(index, e.nativeEvent.layout.width, e.nativeEvent.layout.height);

  return (
    <Animated.View
      style={{
        height: ROW,
        zIndex: layer,
        transform: [{ translateY: y }, { translateX: x }, { rotate }],
      }}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: on }}
        accessibilityLabel={label}
        onPress={onPress}
        style={styles.row}
      >
        {/* the box: ring always there, FILL grows inside it */}
        <View
          style={[
            styles.box,
            { width: side, height: side, borderRadius: side * 0.32 },
          ]}
        >
          <View
            style={[
              styles.fill,
              {
                backgroundColor: UP,
                borderRadius: side * 0.32,
                transform: [{ scale: t }],
              },
            ]}
          />
          <Svg width={side} height={side} viewBox="0 0 24 24" style={styles.tick}>
            <Path
              d="M6 12.4 L10.3 16.7 L18 7.6"
              fill="none"
              stroke={PAPER}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={[18, 18]}
              strokeDashoffset={18 * (1 - held)}
            />
          </Svg>
        </View>

        {/* the words, sized to the words so the rule stops there */}
        <View style={styles.sayWrap} onLayout={onLayout}>
          <Text style={[styles.say, { opacity: mix(1, 0.42, held) }]}>
            {label}
          </Text>
          <View
            style={[
              styles.rule,
              { transform: [{ scaleX: cut }] },
            ]}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function AddRow({
  side,
  onAdd,
}: {
  side: number;
  onAdd: (label: string) => void;
}): ReactElement {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  if (!adding) {
    return (
      <View style={styles.addRow}>
        <View
          style={[
            styles.ghost,
            { width: side, height: side, borderRadius: side * 0.32 },
          ]}
        />
        <Pressable onPress={() => setAdding(true)} accessibilityRole="button">
          <Text style={styles.addLabel}>Add a step</Text>
        </Pressable>
      </View>
    );
  }

  // a plain TextInput here, deliberately: the lifting label belongs to
  // a form, and this is a single line inside a list
  return (
    <View style={styles.addRow}>
      <View
        style={[
          styles.ghost,
          { width: side, height: side, borderRadius: side * 0.32 },
        ]}
      />
      <TextInput
        autoFocus
        maxLength={40}
        onBlur={() => {
          onAdd(draft);
          setDraft("");
          setAdding(false);
        }}
        onChangeText={setDraft}
        onSubmitEditing={() => {
          onAdd(draft);
          setDraft("");
          setAdding(false);
        }}
        placeholder="New step"
        placeholderTextColor={MUTED}
        style={styles.field}
        value={draft}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: PAPER, overflow: "hidden" },
  row: {
    alignItems: "center",
    flexDirection: "row",
    height: ROW,
  },
  box: {
    alignItems: "center",
    borderColor: BORDER,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  fill: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  tick: { position: "absolute" },
  sayWrap: { alignSelf: "center", flexShrink: 1 },
  say: { fontFamily: FONT, color: INK, fontSize: 14, lineHeight: 18 },
  rule: {
    backgroundColor: MUTED,
    height: 1.5,
    left: 0,
    position: "absolute",
    right: 0,
    top: 8.5,
  },
  addRow: {
    alignItems: "center",
    flexDirection: "row",
    height: ROW,
  },
  ghost: { borderColor: BORDER, borderStyle: "dashed", borderWidth: 1.5, marginRight: 12 },
  addLabel: { fontFamily: FONT, color: MUTED, fontSize: 14, lineHeight: 18 },
  field: { fontFamily: FONT, color: INK, flex: 1, fontSize: 14, padding: 0 },
});
