// Pull to refresh — a React Native port of Bencho's "Balance" block.
//
// MIT licensed, part of Bencho (https://bencho.dev). Ported to RN by
// hand: the block is DOM + CSS, so the DOM events become a
// PanResponder, the stylesheet becomes StyleSheet, and the gooey SVG
// filter becomes plain Views. Everything else — the maths, the
// thresholds, the reasons the numbers are what they are — is kept.
//
// ── the Bencho tokens, mapped to Pera ───────────────────────────
// The block reads these custom properties and does not define them,
// and the instruction was to map each to whatever this project
// already uses for the same job rather than declare thirteen new
// globals. React Native has no custom properties at all, so the map
// lives here as a const and every colour below reads through it.
//
//   --bg           → PAPER     (#FFFFFF)  the ground
//   --card         → CARD      (#FFFFFF)  a card's surface
//   --ember        → DOWN      (#6D6C6B)  a fall
//   --fill-on      → INK       (#0C0A08)  the ink on the fill
//   --fill-on-rgb  → "9, 9, 11"           the same, as three numbers
//   --fill-slab    → CARD      (#FFFFFF)  the sheet's own surface
//   --font-ui      → system face; RN's default, so nothing to set
//   --ink          → INK       (#0C0A08)
//   --ink-rgb      → "9, 9, 11"
//   --nod-r        → RADIUS.card (20)
//   --ok           → UP        (#0C0A08)  a rise
//   --pane-edge    → BORDER    (#E5E7EB)  a hairline
//   --tip          → not a token at all: it is where the reading sits
//                    down the chart, 0 at the top and 1 at the bottom,
//                    and the component sets it per frame. It has no
//                    global to map and never wanted one.

import { Animated, Easing, LayoutChangeEvent, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { clamp, mix, useSpring, useStillness } from "../motion/spring";
import { BORDER, CARD, DOWN, FONT, INK, MUTED, PAPER, RADIUS, SHADOW_SOFT, UP } from "./homeTheme";

// ── the token map ────────────────────────────────────────────────
const T = {
  bg: PAPER, // --bg
  card: CARD, // --card
  ember: DOWN, // --ember
  fillOn: INK, // --fill-on
  fillOnRgb: "9, 9, 11", // --fill-on-rgb
  fillSlab: CARD, // --fill-slab
  ink: INK, // --ink
  inkRgb: "9, 9, 11", // --ink-rgb
  nodR: RADIUS.card, // --nod-r
  ok: UP, // --ok
  paneEdge: BORDER, // --pane-edge
} as const;

// ── the two colour helpers the stylesheet leaned on ──────────────
// `color-mix(in srgb, A x%, B)` and `rgba(A, x)`, from the -rgb
// tokens. Both keep the block's own numbers.
const rgbOf = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};
/** `color-mix(in srgb, a t%, b)` */
const blend = (a: string, b: string, t: number): string => {
  const A = rgbOf(a);
  const B = rgbOf(b);
  return `rgb(${Math.round(mix(A[0], B[0], t))}, ${Math.round(
    mix(A[1], B[1], t),
  )}, ${Math.round(mix(A[2], B[2], t))})`;
};
/** `color-mix(in srgb, hex a%, transparent)` */
const wash = (hex: string, alpha: number): string => {
  const [r, g, b] = rgbOf(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ── the card's corner. 26 is the page's own, not a card's — 18 was
// the tightest radius on the bench and it made this the one block
// that looked clipped rather than rounded. Pera's card radius is 20.
const CORNER = T.nodR;

// ── the room the rebound compresses into ─────────────────────────
// Negative padding does not exist, so the card carries this much at
// rest and the bounce spends it. Twelve is enough to read as a squash
// and small enough that the resting card is the resting card.
const SQUASH = 8;

// ── how far the card can stretch ─────────────────────────────────
// `tanh` rather than the exponential the first version used, because
// tanh is near-linear where it matters. At 40 of pull the card has
// grown 38, which is the card FOLLOWING the finger; the exponential
// was already lagging by a fifth there, and a card that visibly falls
// behind the thing dragging it reads as slow rather than as elastic.
// It only bends near the top: 68 at the 80px threshold, and 104 at a
// 200px heave against a ceiling of 110.
const GROW = 110;

// six is the default, and the count at which a ring still reads as a
// circle rather than as a polygon.
const DOTS = 6;

// the chart's own height — the thing you scrub should get the room
const PLOT_H = 92;
const PAD = 6;

const DEADZONE = 4;

// ── what it is refreshing ────────────────────────────────────────
// Three windows over the same series. EVERY WINDOW IS REAL: these
// are tails of the recorded series, not different resolutions of
// invented data — so an hour is the last few points and a day is all
// of them. The balance is the same number in all three, because it is
// the same last reading — only the CHANGE differs, which is the whole
// point of choosing a window.
export type PullRead = {
  id: string;
  label: string;
  take: number;
  span: string;
};

const WINDOWS: readonly PullRead[] = [
  { id: "1h", label: "1H", take: 5, span: "past hour" },
  { id: "4h", label: "4H", take: 17, span: "past 4 hours" },
  { id: "1d", label: "1D", take: 34, span: "today" },
];

// ── the figures ──────────────────────────────────────────────────
// fontVariant: ["tabular-nums"] is the feature that matters: the same
// advance for every digit, in the proportional face, so the number
// can change on a refresh or under a scrub without anything after it
// moving. A monospaced face was never the requirement — a stable
// advance was.
const money = (n: number): string => {
  const neg = n < 0;
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${neg ? "−" : ""}${grouped}.${dec}`;
};

// the cents ride at a lighter weight, so split them off
const split = (n: number): [string, string] => {
  const s = money(n);
  const dot = s.lastIndexOf(".");
  return [s.slice(0, dot), s.slice(dot)];
};

const signed = (n: number): string => (n < 0 ? "−" : "+") + money(Math.abs(n));

// ── the line ─────────────────────────────────────────────────────
// A CURVE, not a polyline. The first version joined the readings with
// straight segments and every one of those corners is a lie about data
// that was never sampled. Catmull-Rom converted to cubic béziers: the
// curve passes through every reading exactly, and the control points
// come from the neighbours on either side, so nothing is invented and
// nothing overshoots into a shape the data does not have.
//
// Three things come out of one pass — the stroke, the points, and a
// sampler that will hand back a position anywhere along the curve —
// because they all have to agree. Generating them separately is how a
// scrub dot ends up beside the curve instead of on it.
function curve(
  vals: number[],
  w: number,
  h: number,
  pad: number,
): { d: string; pt: { x: number; y: number }[]; at: (u: number) => { x: number; y: number } } {
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  // A series with no range has no floor to sit on: drawing it at the
  // bottom reads as a chart that failed rather than a line that is
  // simply level. Level is the middle.
  const flat = hi === lo;
  const pt = vals.map((v, i) => ({
    x: (i / (vals.length - 1 || 1)) * w,
    y: flat ? h / 2 : h - pad - ((v - lo) / (hi - lo)) * (h - pad * 2),
  }));

  // the control points, kept rather than thrown away with the string.
  // `at` needs exactly these — see below.
  const seg = pt.slice(0, -1).map((p1, i) => {
    const p0 = pt[i - 1] ?? p1;
    const p2 = pt[i + 1];
    const p3 = pt[i + 2] ?? p2;
    // a sixth of the neighbour span is the standard Catmull-Rom
    // tension — tighter and it corners, looser and it loops
    return {
      p1,
      p2,
      c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
    };
  });

  let d = `M${pt[0].x.toFixed(2)} ${pt[0].y.toFixed(2)}`;
  for (const g of seg) {
    d += ` C${g.c1.x.toFixed(2)} ${g.c1.y.toFixed(2)} ${g.c2.x.toFixed(2)} ${g.c2.y.toFixed(2)} ${g.p2.x.toFixed(2)} ${g.p2.y.toFixed(2)}`;
  }

  // ── anywhere along the line, not just at a reading ────────────
  // The same cubic the path string is made of, evaluated at a
  // fractional index. That is the whole reason the control points are
  // kept: lerping between two readings would put the dot on the CHORD,
  // which is beside the curve wherever it bends.
  const at = (u: number): { x: number; y: number } => {
    const i = clamp(Math.floor(u), 0, seg.length - 1);
    const g = seg[i] ?? seg[0];
    const t = clamp(u - i, 0, 1);
    const m = 1 - t;
    return {
      x:
        m ** 3 * g.p1.x +
        3 * m * m * t * g.c1.x +
        3 * m * t * t * g.c2.x +
        t ** 3 * g.p2.x,
      y:
        m ** 3 * g.p1.y +
        3 * m * m * t * g.c1.y +
        3 * m * t * t * g.c2.y +
        t ** 3 * g.p2.y,
    };
  };

  return { d, pt, at };
}

// Thirty-four readings across a trading day. The scrub says WHEN,
// because a number with no time on it is just a different number.
const OPEN = 9 * 60;
const SHUT = 17 * 60 + 30;
const clock = (i: number, n: number): string => {
  const m = Math.round(OPEN + ((SHUT - OPEN) * i) / (n - 1 || 1));
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
};

// A REAL timestamp, for series that carry their own. Same-day readings
// are just the clock; anything older gets the date, because "yesterday
// at 14:20" is a different claim from "today at 14:20".
const stampLabel = (ms: number): string => {
  const at = new Date(ms);
  const time = at.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (at.toDateString() === new Date().toDateString()) return time;
  return `${at.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
};

export type PullToRefreshProps = {
  /** the figure shown at rest — the last reading of the series */
  balance: number;
  /** the readings drawn on the chart, oldest → newest. The balance is
   *  the last point. Omitted, the chart draws the balance flat, which
   *  is the honest picture when there is no history yet. */
  series?: number[];
  /** epoch-ms stamps for `series`, when they are known. With them the
   *  scrub reports the moment a reading was actually taken instead of
   *  the block's default trading session. Must line up with `series`. */
  times?: number[];
  /** a mark before the figure, e.g. "$" — Pera leaves it empty */
  symbol?: string;
  /** a small caption above the figure */
  caption?: string;
  /** how much the pull fights back, 0..100 */
  resistance?: number;
  /** px before it commits */
  threshold?: number;
  /** how fast the ring turns while it works, 0..100 */
  spin?: number;
  /** how many dots the loading wheel is made of, 3..10 */
  dots?: number;
  /** the card's own corner, 0..40 — and the tabs follow it */
  corner?: number;
  /** the windows shown under the chart */
  windows?: readonly PullRead[];
  /** the work. Called the moment the pull commits, not on release. */
  onRefresh?: () => void | Promise<void>;
  accessibilityLabel?: string;
};

export function PullToRefresh({
  balance,
  series,
  times,
  symbol = "",
  caption,
  resistance = 50,
  threshold = 58,
  spin = 50,
  dots = DOTS,
  corner = CORNER,
  windows = WINDOWS,
  onRefresh,
  accessibilityLabel = "Pull down to refresh.",
}: PullToRefreshProps): ReactElement {
  const still = useStillness();

  const [raw, setRaw] = useState(0);
  const [phase, setPhase] = useState<"idle" | "hold" | "work">("idle");
  // which point the pointer is over, or null for "the latest"
  const [scrub, setScrub] = useState<number | null>(null);
  const [win, setWin] = useState(windows.length - 1);
  const [plotW, setPlotW] = useState(0);
  const [winW, setWinW] = useState(0);

  const off = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(
    () => () => {
      if (off.current) clearTimeout(off.current);
    },
    [],
  );

  // ── the series, and the tail the chosen window draws ───────────
  const day = useMemo(() => {
    if (series && series.length >= 2) return series;
    // no history: a flat line at the balance. Honest, and still
    // scrubbable — the guide resolves to a time and the figure does
    // not move, which is exactly what "we only know the last reading"
    // looks like.
    return [balance, balance];
  }, [series, balance]);

  // Only trust stamps that describe the same readings the chart draws.
  const stamps =
    times && series && times.length === series.length ? times : undefined;

  const last = day.length - 1;
  const take = Math.max(2, Math.min(windows[win]?.take ?? day.length, day.length));
  const shownSeries = day.slice(Math.max(0, day.length - take));
  // WHERE THE WINDOW STARTS IN THE DAY. The scrub's clock maps an
  // index across the whole session, and a tail is not the session: the
  // first point of the 1H window is not nine o'clock. Without this the
  // same reading would report a different time depending on which
  // window you were looking at it in.
  const offset = day.length - shownSeries.length;

  // ── rubber, not a rail ─────────────────────────────────────────
  // A linear pull reaches the threshold at exactly the threshold and
  // tells you nothing on the way; this saturates, so the last twenty
  // pixels cost more than the first twenty and the resistance is the
  // thing you feel rather than the distance.
  //
  // R is where the curve gives up. It has to stay well above the
  // threshold's ceiling or the top of the Resistance range would be a
  // pull that can never commit — a knob with a dead end is a broken
  // knob, not a strong setting.
  const R = 700 - (resistance / 100) * 380;
  const drawn = (R * raw) / (R + raw);
  const target = phase === "work" ? threshold : phase === "hold" ? drawn : 0;
  // Tracking the finger is instant, because it IS the finger. The
  // spring is only ever the journey home.
  const sprung = useSpring(target, 58, still || phase === "hold");
  // Clamped at zero, and not as a matter of taste: the content is at
  // the top of its own scroller and there is nothing above it to
  // reveal.
  const at = Math.max(0, sprung);

  // ── the card stretches with the pull ──────────────────────────
  // It rides `sprung` and not the clamped one — that unclamped tail is
  // the bounce. The spring at tune 58 is under-damped, so on the way
  // home it goes PAST zero before it settles; clamping threw that
  // away. Letting the card compress a few pixels below its resting
  // height is the rebound.
  //
  // The rebound is NOT damped: the whole point of the squash is that
  // it is a short sharp give, and running it through the same curve
  // would flatten the one part of this that is supposed to snap.
  const grow =
    sprung >= 0 ? GROW * Math.tanh(sprung / GROW) : Math.max(-SQUASH, sprung);

  // how far through the gesture we are, and whether it has committed.
  // Both are read off the same number, so the ring and the decision
  // cannot disagree.
  const p = clamp(at / threshold, 0, 1);
  const armed = p >= 1;

  // ── what the card is saying right now ─────────────────────────
  // One index feeds the change, the time and the dot on the line.
  // They cannot drift apart because there is nothing to drift.
  const shown = scrub ?? shownSeries.length - 1;
  const lo = clamp(Math.floor(shown), 0, shownSeries.length - 1);
  const hi = clamp(Math.ceil(shown), 0, shownSeries.length - 1);
  const value = mix(shownSeries[lo], shownSeries[hi], shown - lo);
  const change = value - shownSeries[0];
  const up = change >= 0;
  const pct = (change / (shownSeries[0] || 1)) * 100;
  const [whole, cents] = split(value);

  // ── the outcome, immediately ──────────────────────────────────
  // The ring turning afterwards is a report on something that has
  // already happened. That is the rule the elastic blocks keep and the
  // one worth stating once: ELASTICITY IS FEEDBACK, NEVER LATENCY.
  const refresh = (): void => {
    setPhase("work");
    setScrub(null);
    if (off.current) clearTimeout(off.current);
    void onRefresh?.();
    off.current = setTimeout(() => setPhase("idle"), 1150);
  };

  // ── the gesture ───────────────────────────────────────────────
  // Two bugs lived in the web version and both were the kind that make
  // a component "sometimes not work": no pointer capture, so a pull
  // that left the element stranded mid-gesture; and a rule that threw
  // the whole thing away on one pixel of upward jitter. What replaces
  // them is a commit step, and in RN the axis arbitration does double
  // duty — whichever axis is winning owns the gesture. Upward is the
  // parent's scroll, sideways is the scrub, downward is the pull.
  const cardPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_e, g) => {
          if (phaseRef.current === "work") return false;
          if (g.dy < -DEADZONE) return false; // this is a scroll, not a pull
          if (Math.abs(g.dx) > DEADZONE && Math.abs(g.dx) > Math.abs(g.dy)) {
            return false; // sideways belongs to the plot
          }
          return g.dy > DEADZONE;
        },
        onPanResponderGrant: () => {
          // a pull is not a reading: put the card back on "now"
          setScrub(null);
        },
        onPanResponderMove: (_e, g) => {
          setPhase("hold");
          // clamped rather than cancelled: pulling back past where you
          // started is still the same pull
          setRaw(Math.max(0, g.dy));
        },
        onPanResponderRelease: () => finish(),
        onPanResponderTerminate: () => finish(),
        onPanResponderTerminationRequest: () => false,
      }),
    // finish/refresh read refs and setState only, so the responder is
    // built once and never rebuilt mid-gesture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const finish = (): void => {
    setRaw(0);
    // an uncommitted press never pulled anything, so it has nothing to
    // decide
    if (phaseRef.current !== "hold") return;
    if (armedRef.current) refresh();
    else setPhase("idle");
  };

  const armedRef = useRef(armed);
  armedRef.current = armed;

  const plotPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        // SIDEWAYS IS A SCRUB. Without this the chart could not be
        // dragged along on a touch screen: any sideways travel carries
        // a pixel or two of downward drift with it, which used to be
        // enough to commit a pull and swallow the gesture.
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > DEADZONE && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (e) => scrubTo(e.nativeEvent.locationX),
        onPanResponderRelease: () => setScrub(null),
        onPanResponderTerminate: () => setScrub(null),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── the scrub ─────────────────────────────────────────────────
  // Read as a FRACTION of the plot's own box, so it needs no zoom
  // correction: both sides of the division are the same pixels and the
  // ratio is the same at any scale.
  const scrubTo = (x: number): void => {
    if (phaseRef.current === "work") return;
    const t = clamp(x / (plotW || 1), 0, 1);
    // the reading is CONTINUOUS — the curve between two readings is
    // already an interpolation, so a number read off it agrees with
    // what is drawn.
    setScrub(t * (shownSeries.length - 1));
  };

  // ── the ring ──────────────────────────────────────────────────
  // Six dots on a circle, placed with sine and cosine rather than by
  // rotating each one. The ring turns as one element, linearly, so
  // there is no easing to make one part of the revolution look faster
  // than another.
  //
  // Clamped rather than trusted: this arrives from a prop as readily as
  // from a panel.
  const n = Math.max(3, Math.min(10, Math.round(dots)));
  // ── THE RING GROWS WITH THE COUNT: a fixed radius is only right for
  // one number of dots. The gap between neighbours stays roughly
  // constant, which is the thing that actually reads.
  const ring = 12 + (n - DOTS) * 1.3;
  // HOW FAR APART THE DROPLETS SIT, and the whole effect. Scattered at
  // 15, touching at about 2.6, and opened back out to the ring while it
  // works.
  const spread = phase === "work" ? ring : ring + 3 - p * 3;
  // the ring winds with the finger; while it works the whole group
  // turns instead, on its own clock
  const turn = phase === "work" ? 0 : p * 220;

  // slow. 2.4s a turn at the default and never under 1.4 — a spinner
  // that races reads as panic, and this one is telling you to wait for
  // a moment.
  const rpm = still ? 3000 : 3000 - (spin / 100) * 1200;
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (phase !== "work") {
      rot.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.timing(rot, {
        toValue: 1,
        duration: rpm,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [phase, rpm, rot]);
  const rotate = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // ── the window pill ───────────────────────────────────────────
  // ONE PILL THAT TRAVELS, rather than three backgrounds taking turns
  // fading. Those are two different claims: a pad that lights up on one
  // tab and goes out on another says "this one"; a shape that moves
  // says "this one, and it came from that one".
  //
  // The overshoot is felt rather than watched: 1.16 on the second
  // control point puts it in the low single figures past a tab, and the
  // shorter duration keeps the whole move under the time it takes to
  // look at it.
  const tabW = winW > 0 ? (winW - (windows.length - 1) * 4) / windows.length : 0;
  const pillX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(pillX, {
      toValue: win * (tabW + 4),
      duration: still ? 160 : 420,
      easing: Easing.bezier(0.24, 1.34, 0.38, 1),
      useNativeDriver: true,
    }).start();
  }, [win, tabW, still, pillX]);

  const c = useMemo(
    () =>
      plotW > 0
        ? curve(shownSeries, plotW, PLOT_H, PAD)
        : { d: "", pt: [], at: () => ({ x: 0, y: 0 }) },
    [shownSeries, plotW],
  );
  // on the curve at a fractional index, not at one of the readings
  const dot = c.at(shown);
  const line = up ? UP : DOWN;

  const onPlotLayout = (e: LayoutChangeEvent): void =>
    setPlotW(e.nativeEvent.layout.width);
  const onWinLayout = (e: LayoutChangeEvent): void =>
    setWinW(e.nativeEvent.layout.width);

  const padBottom = SQUASH + grow;

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: clamp(corner, 0, 40),
          paddingBottom: padBottom,
          marginBottom: -padBottom,
        },
      ]}
      accessible
      accessibilityLabel={`${caption ?? "Balance"} ${whole}${cents}. ${accessibilityLabel}`}
      accessibilityActions={[{ name: "activate", label: "Refresh" }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === "activate" && phase !== "work") {
          refresh();
        }
      }}
      {...cardPan.panHandlers}
    >
      {/* ── the indicator ──────────────────────────────────────
          Under the sheet, revealed as the sheet is pulled down off
          it — the arrangement every real one uses, and the reason it
          needs no container of its own.

          The opacity is OUTSIDE the scatter: fading the droplets
          themselves would fade the blob from the edges in and then
          drop it whole. */}
      <Animated.View
        style={[
          styles.goo,
          {
            opacity: phase === "work" ? 1 : p,
            transform: [
              { scale: phase === "work" ? 1 : 0.82 + p * 0.18 },
              { rotate },
            ],
          },
        ]}
        pointerEvents="none"
      >
        {Array.from({ length: n }, (_, i) => {
          const a = (((i / n) * 360 + turn) * Math.PI) / 180;
          return (
            <View
              key={i}
              style={[
                styles.drop,
                {
                  transform: [
                    { translateX: Math.sin(a) * spread },
                    { translateY: -Math.cos(a) * spread },
                  ],
                },
              ]}
            />
          );
        })}
      </Animated.View>

      <View style={[styles.sheet, { transform: [{ translateY: at }] }]}>
        {caption !== undefined ? (
          <Text style={styles.caption}>{caption}</Text>
        ) : null}

        <Text style={styles.sum}>
          {symbol !== "" ? <Text style={styles.cur}>{symbol}</Text> : null}
          {whole}
          <Text style={styles.dec}>{cents}</Text>
        </Text>

        {/* the change, and — while you are reading the line back —
            when. Same shape either way, so the row does not reflow as
            you scrub across it. */}
        <View style={styles.moveRow}>
          <Text style={[styles.move, { color: up ? T.ok : T.ember }]}>
            {signed(change)} · {Math.abs(pct).toFixed(1)}%
          </Text>
          <Text style={styles.when}>
            {scrub === null
              ? windows[win]?.span
              : stamps
                ? stampLabel(stamps[offset + shown] ?? stamps[stamps.length - 1])
                : clock(offset + shown, day.length)}
          </Text>
        </View>

        {/* ── the line ─────────────────────────────────────────
            Drawn in the plot's own pixel space rather than stretched
            with a viewBox, which is the trap the web version warns
            about: a stretched box draws a rope along one axis and a
            hairline along the other, and a circle inside it comes out
            an ellipse. Here the circle is a circle. */}
        <View
          style={styles.plot}
          onLayout={onPlotLayout}
          {...plotPan.panHandlers}
        >
          {plotW > 0 ? (
            <Svg width={plotW} height={PLOT_H}>
              {/* only while reading: a permanent guide is a second
                  axis nobody asked for */}
              {scrub !== null ? (
                <Line
                  x1={dot.x}
                  y1={PAD}
                  x2={dot.x}
                  y2={PLOT_H - PAD}
                  stroke={line}
                  strokeWidth={1}
                  opacity={0.28}
                />
              ) : null}
              <Path
                d={c.d}
                stroke={line}
                strokeWidth={2.1}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* the mark on the reading, outside any stretch, placed
                  from the same points the path was built from — so it
                  is ON the curve rather than near it */}
              <Circle
                cx={dot.x}
                cy={dot.y}
                r={scrub !== null ? 5.3 : 4.5}
                fill={T.fillSlab}
                stroke={line}
                strokeWidth={2}
              />
            </Svg>
          ) : null}
        </View>

        <View style={styles.win} onLayout={onWinLayout}>
          <Animated.View
            style={[
              styles.winPill,
              {
                width: tabW,
                borderRadius: Math.min(16, clamp(corner, 0, 40) * 0.62),
                transform: [{ translateX: pillX }],
              },
            ]}
            pointerEvents="none"
          />
          {windows.map((w, i) => (
            <Pressable
              key={w.id}
              style={({ pressed }) => [
                styles.winBtn,
                { borderRadius: Math.min(16, clamp(corner, 0, 40) * 0.62) },
                pressed && styles.winBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: i === win }}
              onPress={() => {
                if (i === win) return;
                // a window change is a different question, so the
                // reading you were pointing at is no longer the one
                // you meant
                setScrub(null);
                setWin(i);
              }}
            >
              <Text
                style={[styles.winLabel, i === win && styles.winLabelOn]}
              >
                {w.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.fillSlab,
    overflow: "hidden",
    // the one elevation in the system
    ...SHADOW_SOFT,
  },
  goo: {
    position: "absolute",
    left: "50%",
    top: 30,
    width: 60,
    height: 60,
    marginLeft: -30,
    marginTop: -30,
    zIndex: 1,
    // the dots share one cell and are displaced out of it
    alignItems: "center",
    justifyContent: "center",
  },
  drop: {
    position: "absolute",
    left: 28,
    top: 28,
    width: 4,
    height: 4,
    borderRadius: 999,
    // GREY, NOT INK. A loading mark is the quietest thing that can be
    // on a screen and still be doing its job: it says "a moment", and
    // full ink says "look at this". A wash of the fill's own ink rather
    // than a fixed grey, so it stays a step off whatever the component
    // is made of.
    backgroundColor: wash(T.fillOn, 0.32),
  },
  sheet: {
    // opaque, or the dots underneath show through the sheet they are
    // supposed to be hidden behind
    backgroundColor: T.fillSlab,
    paddingTop: 24,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  caption: {
    color: MUTED,
    fontFamily: FONT,
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 0.6,
    lineHeight: 14,
    marginBottom: 8,
  },
  sum: {
    color: T.fillOn,
    fontFamily: FONT,
    fontSize: 40,
    lineHeight: 42,
    // one weight, like everything else: at this size the figure is
    // already the loudest thing on the card
    fontWeight: "400",
    letterSpacing: -0.8,
    fontVariant: ["tabular-nums"],
  },
  // THE MARK IS PART OF THE NUMBER: same size, same weight, so it is
  // one number again rather than a footnote attached to the figure.
  cur: { fontFamily: FONT, fontSize: 40, fontWeight: "400" },
  // the cents stay grey — the same number, quieter
  dec: { fontFamily: FONT, fontSize: 24, fontWeight: "400", letterSpacing: -0.5, color: wash(T.fillOn, 0.34) },
  moveRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 8,
  },
  move: {
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: "400",
    fontVariant: ["tabular-nums"],
  },
  // the word, or the time — always the quiet half of the line
  when: {
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: "400",
    color: blend(T.fillOn, T.fillSlab, 0.32),
    fontVariant: ["tabular-nums"],
  },
  plot: {
    height: PLOT_H,
    marginTop: 24,
    marginBottom: 8,
  },
  win: {
    position: "relative",
    flexDirection: "row",
    gap: 4,
    marginTop: 16,
  },
  winPill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: wash(T.fillOn, 0.06),
  },
  winBtn: {
    flex: 1,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  winBtnPressed: { transform: [{ scale: 0.96 }] },
  winLabel: {
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: "400",
    color: blend(T.fillOn, T.fillSlab, 0.52),
  },
  winLabelOn: { color: T.fillOn },
});
