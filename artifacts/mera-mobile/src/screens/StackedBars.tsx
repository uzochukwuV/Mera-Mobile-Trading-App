// Stacked bars — a React Native port of Bencho's "Stacked bars".
//
// MIT licensed, part of Bencho (https://bencho.dev). The web block is
// an alert-volume card with a hover tooltip; here the columns are
// tapped (there is no hover on a phone) and the readout sits above the
// plot so the number never covers the bar it is describing.
//
// Each column is a stack of sources, drawn bottom-up. The bars grow
// out of the baseline once on mount and again whenever `generation`
// changes — one spring, so a timeframe swap is the same transition as
// the first paint rather than a cut.

import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { ReactElement, useEffect, useMemo, useState } from "react";
import { clamp, useSpring, useStillness } from "../motion/spring";
import { BORDER, DOWN, FONT, INK, MUTED, UP } from "./homeTheme";

export type StackBar = {
  label: string;
  /** bottom → top */
  values: number[];
  /** an optional bar under the baseline */
  extra?: number;
};

export type StackedBarsProps = {
  bars: StackBar[];
  /** one colour per value index */
  colours?: string[];
  /** plot height above the baseline, px */
  height?: number;
  /** room below the baseline for `extra`, px */
  extraHeight?: number;
  extraColour?: string;
  /** the caption at rest, before anything is tapped */
  caption?: string;
  /** change this to re-run the grow-in (e.g. the timeframe) */
  generation?: number;
  format?: (value: number) => string;
  accessibilityLabel?: string;
};

const SEG_GAP = 2;
const LIFT = 2;

export function StackedBars({
  bars,
  colours = [UP, DOWN],
  height = 76,
  extraHeight = 0,
  extraColour = MUTED,
  caption = "Volume",
  generation = 0,
  format = (v) => {
    const a = Math.abs(v);
    if (a >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (a >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (a >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return Math.round(v).toString();
  },
  accessibilityLabel = "Volume by interval",
}: StackedBarsProps): ReactElement {
  const still = useStillness();
  const [at, setAt] = useState<number | null>(null);
  const [w, setW] = useState(0);

  // ── every number, once ──────────────────────────────────
  // The API hands volume back as a scaled integer and, in some
  // build paths, as a string. `bought += c.v` over strings
  // concatenates, which produces a "total" several orders of
  // magnitude larger than any segment and squashes every bar to
  // its 1.5px floor. Coerce at the boundary, once.
  const data = useMemo(
    () =>
      bars.map((b) => ({
        ...b,
        values: b.values.map((v) => Number(v) || 0),
        extra: Number(b.extra) || 0,
      })),
    [bars],
  );

  // ── grow in ────────────────────────────────────────────
  // `grown` is the target and the spring is the value, so the bars
  // rise rather than appear. A timeout because the first frame must
  // paint at 0 — a spring whose target changes in the same commit
  // starts already settled.
  const [grown, setGrown] = useState(still ? 1 : 0);
  useEffect(() => {
    if (still) {
      setGrown(1);
      return;
    }
    setGrown(0);
    const t = setTimeout(() => setGrown(1), 30);
    return () => clearTimeout(t);
  }, [generation, still]);
  const t = useSpring(grown, 62, still || grown === 0);
  const prog = clamp(t, 0, 1.15);

  const n = Math.max(1, data.length);
  const gap = 2;
  const bw = w > 0 ? Math.max(2, (w - gap * (n - 1)) / n) : 0;

  const totals = useMemo(
    () => data.map((b) => b.values.reduce((s, v) => s + v, 0)),
    [data],
  );
  const maxT = Math.max(...totals, 1);
  const maxE = Math.max(...data.map((b) => b.extra), 1);
  const scale = (height - LIFT - 2 - SEG_GAP * 2) / maxT;

  const active = at !== null ? data[at] : undefined;
  const shown = active ? totals[at ?? 0] : maxT;

  const onLayout = (e: LayoutChangeEvent): void => setW(e.nativeEvent.layout.width);

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={styles.wrap}
    >
      <View style={styles.head}>
        <Text style={styles.caption} numberOfLines={1}>
          {active ? active.label : caption}
        </Text>
        <Text style={styles.value}>{format(shown)}</Text>
      </View>

      <View style={styles.plot} onLayout={onLayout}>
        {w > 0 ? (
          <>
            <View style={[styles.baseline, { top: height }]} />
            <View style={[styles.row, { height: height + extraHeight + 8 }]}>
              {data.map((bar, i) => {
                const sel = at === i;
                const dim = at !== null && !sel;
                return (
                  <Pressable
                    key={`${bar.label}-${i}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${bar.label}, ${format(totals[i] ?? 0)}`}
                    onPress={() => setAt(at === i ? null : i)}
                    style={[styles.col, { width: bw, marginRight: i < n - 1 ? gap : 0 }]}
                  >
                    <View
                      style={[
                        styles.stack,
                        { height: height, opacity: dim ? 0.35 : 1 },
                      ]}
                    >
                      {[...bar.values].reverse().map((v, k) => {
                        const idx = bar.values.length - 1 - k;
                        const h = Math.max(1.5, v * scale) * prog;
                        return (
                          <View
                            key={idx}
                            style={{
                              backgroundColor: colours[idx] ?? UP,
                              borderRadius: 1.5,
                              height: h,
                              marginTop: k === 0 ? 0 : SEG_GAP,
                              width: "100%",
                            }}
                          />
                        );
                      })}
                    </View>
                    {extraHeight > 0 ? (
                      <View
                        style={{
                          backgroundColor: extraColour,
                          borderRadius: 1.5,
                          height: Math.max(2, ((bar.extra ?? 0) / maxE) * (extraHeight - LIFT - 2)) * prog,
                          marginTop: LIFT,
                          opacity: dim ? 0.35 : 1,
                          width: "100%",
                        }}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  head: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  caption: { fontFamily: FONT, color: MUTED, fontSize: 11, fontWeight: "400", letterSpacing: 0.8, textTransform: "uppercase" },
  value: { fontFamily: FONT, color: INK, fontSize: 12, fontVariant: ["tabular-nums"], fontWeight: "400" },
  plot: { position: "relative", width: "100%" },
  baseline: {
    backgroundColor: BORDER,
    height: StyleSheet.hairlineWidth,
    left: 0,
    position: "absolute",
    right: 0,
  },
  row: { alignItems: "flex-end", flexDirection: "row" },
  col: { justifyContent: "flex-end" },
  stack: { justifyContent: "flex-end" },
});
