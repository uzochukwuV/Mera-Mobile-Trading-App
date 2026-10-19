// A price chart drawn in pixels, not in a stretched viewBox.
//
// THE POINT OF THIS FILE IS THAT THE LINE IS HONEST. The old chart drew
// into a 300x96 box and let RN scale it to whatever width the card
// happened to be, which rounds every corner and lies about the slope.
// Here the box is measured and the path is computed against the real
// width, so a 1:1 move looks like a 1:1 move on every device.
//
// Reading it back is a first-class thing, not a flourish: drag across
// the plot and the readout gives you the time, the price and how far
// that point is from where the window opened. The crosshair is a plain
// view moved by state rather than an SVG prop, because react-native-svg
// attributes are not an animation surface — and because moving one
// hairline should not re-rasterise the whole path.
//
// The direction decides the ink and nothing else. A rise is the primary
// voice, a fall is the hushed one; there is no second colour to learn.

import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Stop,
} from "react-native-svg";
import type { ReactElement } from "react";

import type { ApiCandle } from "../api";
import { BORDER, DOWN, FONT, INK, MUTED, PAPER, SECONDARY, SMOKE, UP } from "./homeTheme";

const GRADIENT_ID = "pera-area-fill";
/** the gutter the last dot keeps from the right edge */
const PAD_RIGHT = 12;
const PAD_Y = 14;

type Point = { x: number; y: number };

type Geometry = {
  line: string;
  area: string;
  points: Point[];
};

/** Catmull-Rom through the readings, converted to cubic béziers. */
function smooth(points: Point[], top: number, bottom: number): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  const clampY = (y: number): number => Math.min(bottom, Math.max(top, y));
  const seg = points.slice(0, -1).map((p1, i) => {
    const p0 = points[i - 1] ?? p1;
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    return {
      p2,
      c1: { x: p1.x + (p2.x - p0.x) / 6, y: clampY(p1.y + (p2.y - p0.y) / 6) },
      c2: { x: p2.x - (p3.x - p1.x) / 6, y: clampY(p2.y - (p3.y - p1.y) / 6) },
    };
  });
  let d = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (const g of seg) {
    d += ` C${g.c1.x.toFixed(2)} ${g.c1.y.toFixed(2)} ${g.c2.x.toFixed(2)} ${g.c2.y.toFixed(2)} ${g.p2.x.toFixed(2)} ${g.p2.y.toFixed(2)}`;
  }
  return d;
}

function fmt(value: number, digits: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** seconds or milliseconds, whichever the feed sent */
function clock(stamp: number): string {
  const d = new Date(stamp > 1e12 ? stamp : stamp * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export type PriceChartProps = {
  candles: ApiCandle[] | null;
  height?: number;
  digits?: number;
  loading?: boolean;
};

export function PriceChart({
  candles,
  height = 190,
  digits = 2,
  loading = false,
}: PriceChartProps): ReactElement {
  const [width, setWidth] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);

  const rows = useMemo(
    () => (candles ?? []).filter((c) => Number.isFinite(c.c)),
    [candles],
  );

  const geometry: Geometry | null = useMemo(() => {
    if (rows.length < 2 || width <= 0) return null;
    const lo = Math.min(...rows.map((c) => c.l));
    const hi = Math.max(...rows.map((c) => c.h));
    const span = hi - lo || 1;
    const bottom = height - PAD_Y;
    const top = PAD_Y;
    const plotW = Math.max(1, width - PAD_RIGHT);
    const points = rows.map((c, i) => ({
      x: (i / (rows.length - 1)) * plotW,
      y: bottom - ((c.c - lo) / span) * (bottom - top),
    }));
    const line = smooth(points, top, bottom);
    const last = points[points.length - 1];
    const first = points[0];
    const area = `${line} L${last.x.toFixed(2)} ${height} L${first.x.toFixed(2)} ${height} Z`;
    return { line, area, points };
  }, [rows, width, height]);

  // The pan responder is created once; the geometry moves under it, so
  // it reads through refs rather than closing over a stale render.
  const geometryRef = useRef<Geometry | null>(null);
  geometryRef.current = geometry;
  const widthRef = useRef(0);
  widthRef.current = width;

  const pan = useRef(
    PanResponder.create({
      // start out of the way: a vertical swipe over the plot belongs to
      // the page, and only a mostly-horizontal drag is a read.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (e) => {
        const g = geometryRef.current;
        if (!g || g.points.length === 0) return;
        const x = e.nativeEvent.locationX;
        const plotW = Math.max(1, widthRef.current - PAD_RIGHT);
        const index = Math.round((x / plotW) * (g.points.length - 1));
        setScrub(Math.min(g.points.length - 1, Math.max(0, index)));
      },
      onPanResponderRelease: () => setScrub(null),
      onPanResponderTerminate: () => setScrub(null),
      onPanResponderTerminationRequest: () => true,
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent): void => setWidth(e.nativeEvent.layout.width);

  const first = rows[0]?.c ?? 0;
  const shown = scrub !== null ? rows[scrub] : rows[rows.length - 1];
  const shownPoint = scrub !== null ? geometry?.points[scrub] : undefined;
  const change =
    shown !== undefined && first !== 0 ? ((shown.c - first) / first) * 100 : null;
  const up = (rows[rows.length - 1]?.c ?? 0) >= first;
  const ink = up ? UP : DOWN;

  if (loading && rows.length === 0) {
    return (
      <View style={[styles.state, { height: height + 20 }]}>
        <ActivityIndicator color={MUTED} size="small" />
      </View>
    );
  }

  return (
    <View>
      {/* Always present, so scrubbing never reflows the card. At rest
          it holds the affordance; under a finger it holds a reading. */}
      <View style={styles.readout}>
        <Text style={styles.readoutTime}>
          {shownPoint !== undefined && shown !== undefined
            ? `${clock(shown.t)} · ${fmt(shown.o, digits)} → ${fmt(shown.c, digits)}`
            : ""}
        </Text>
        {shownPoint !== undefined && change !== null ? (
          <View style={styles.readoutRight}>
            <Text style={styles.readoutPrice}>{fmt(shown?.c ?? 0, digits)}</Text>
            <Text style={styles.readoutMove}>
              {`${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}
            </Text>
          </View>
        ) : (
          <Text style={styles.hint}>DRAG TO READ</Text>
        )}
      </View>

      <View
        style={[styles.plot, { height }]}
        onLayout={onLayout}
        {...pan.panHandlers}
      >
        {geometry ? (
          <>
            <Svg height={height} width={width}>
              <Defs>
                <LinearGradient id={GRADIENT_ID} x1="0" x2="0" y1="0" y2="1">
                  <Stop offset="0" stopColor={ink} stopOpacity={0.14} />
                  <Stop offset="1" stopColor={ink} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              {/* where the window opened: above it is a gain, below it a
                  loss — the one line the eye actually needs */}
              <Line
                stroke={BORDER}
                strokeDasharray="4 4"
                strokeWidth={1}
                x1={0}
                x2={width - PAD_RIGHT}
                y1={geometry.points[0].y}
                y2={geometry.points[0].y}
              />
              <Path d={geometry.area} fill={`url(#${GRADIENT_ID})`} />
              <Path
                d={geometry.line}
                fill="none"
                stroke={ink}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
              <Circle
                cx={geometry.points[geometry.points.length - 1].x}
                cy={geometry.points[geometry.points.length - 1].y}
                fill={INK}
                r={3.5}
              />
            </Svg>

            {shownPoint !== undefined ? (
              <>
                <View
                  pointerEvents="none"
                  style={[styles.crosshair, { height, left: shownPoint.x }]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.scrubDot,
                    { left: shownPoint.x - 5, top: shownPoint.y - 5 },
                  ]}
                />
              </>
            ) : null}
          </>
        ) : (
          <View style={styles.state}>
            <Text style={styles.empty}>No candles yet</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  crosshair: {
    backgroundColor: SMOKE,
    position: "absolute",
    top: 0,
    width: StyleSheet.hairlineWidth * 2,
  },
  empty: {
    color: MUTED,
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 20,
  },
  hint: {
    color: MUTED,
    fontFamily: FONT,
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 0.6,
    lineHeight: 16,
  },
  plot: { overflow: "hidden", width: "100%" },
  readout: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    height: 20,
    justifyContent: "space-between",
  },
  readoutMove: {
    color: SECONDARY,
    fontFamily: FONT,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    lineHeight: 18,
  },
  readoutPrice: {
    color: INK,
    fontFamily: FONT,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    lineHeight: 18,
  },
  readoutRight: { alignItems: "baseline", flexDirection: "row", gap: 8 },
  readoutTime: {
    color: SECONDARY,
    fontFamily: FONT,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
    lineHeight: 16,
  },
  scrubDot: {
    backgroundColor: INK,
    borderColor: PAPER,
    borderRadius: 9999,
    borderWidth: 2,
    height: 10,
    position: "absolute",
    width: 10,
  },
  state: {
    alignItems: "center",
    height: 190,
    justifyContent: "center",
    width: "100%",
  },
});
