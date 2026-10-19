// Bencho `lab/spring`, ported to React Native.
//
// One spring, for everything that settles. The maths was already on
// the bench twice, copied by hand: Humidity's wheel and Brightness's
// column both accumulate velocity toward a target, damp it, and snap
// when both the delta and the velocity fall under 0.02. Two copies is
// a coincidence; five would be a policy, so it comes out here before
// the blocks that need it are written against it.
//
// Frames, not milliseconds. `dt` is expressed in sixtieths of a second
// and the damping is RAISED to it rather than multiplied by it, so a
// dropped frame decays the same amount of energy as the two frames it
// replaced. Multiplying is the version that makes a spring behave
// differently on a busy page, which is the hardest kind of bug to see.
//
// The loop parks itself the moment the value has settled — there is no
// permanent requestAnimationFrame on this bench.

import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

// 0..100 into the two numbers a spring actually has.
//
// 50 is what Humidity and Brightness were tuned at, which is the rule
// every elastic knob on this bench follows. Turn the panel to the
// middle and nothing has changed.
//
// The pair is chosen by DAMPING RATIO and then written back as
// stiffness and decay, because the ratio is the thing a person is
// actually setting and the two numbers on their own do not say what
// they add up to.
//
//     zeta = -ln(d) / (2 * sqrt(k))
//
// The first version of this ran 0.06..0.26 stiffness against
// 0.93..0.74 decay, which reads as a sensible spread and is not one:
// it puts zeta between 0.15 and 0.16 across the WHOLE range, so every
// setting overshot by about sixty per cent and the knob only changed
// how fast it did it. Pull's return went 130px past its own resting
// position and lifted the content off the top of the card.
//
//     0   → zeta ~0.85, heavy, arrives without a ring
//     50  → zeta ~0.41, near where Humidity and Brightness sit
//     100 → zeta ~0.20, lively, two visible rebounds
//
// Both ends shippable, which is the constraint that fixed the numbers
// rather than taste.
export const springOf = (tune: number): { k: number; d: number } => ({
  // stiffness: how hard it is pulled toward the target
  k: 0.08 + (tune / 100) * 0.16,
  // decay, per frame: how much of the velocity survives
  d: 0.62 + (tune / 100) * 0.2,
});

// Units matter. The snap threshold is absolute, so a caller works in
// pixels or in 0..100 — a spring driven over 0..1 would be "settled"
// before it had visibly moved.
export function useSpring(target: number, tune = 50, instant = false): number {
  const [at, setAt] = useState(target);
  const cur = useRef(target);
  const vel = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (instant) {
      cur.current = target;
      vel.current = 0;
      setAt(target);
      return;
    }
    const { k, d } = springOf(tune);
    let prev = 0;
    const tick = (t: number): void => {
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
      prev = t;
      vel.current += (target - cur.current) * k * dt;
      vel.current *= Math.pow(d, dt);
      cur.current += vel.current * dt;
      if (
        Math.abs(target - cur.current) < 0.02 &&
        Math.abs(vel.current) < 0.02
      ) {
        cur.current = target;
        vel.current = 0;
        setAt(target);
        raf.current = null;
        return;
      }
      setAt(cur.current);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
    // `tune` sits here beside `target` for the reason Brightness spells
    // out: the loop closes over it, so without it a knob turned
    // mid-flight would do nothing until something else restarted the
    // effect. Restarting picks up from the refs, so it continues rather
    // than snapping.
  }, [target, tune, instant]);

  return at;
}

// Read once, the way the wheel and the pill nav do. A preference, not a
// live input.
//
// On the web this was `matchMedia("(prefers-reduced-motion: reduce)")`,
// read synchronously. React Native has no synchronous read, so this is
// a hook that starts optimistic (false) and corrects itself — the
// motion a user sees in the first frame is the motion they asked for,
// never a flash of animation they asked to avoid.
export function useStillness(): boolean {
  const [still, setStill] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => {
        if (alive) setStill(!!v);
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      (v: boolean) => setStill(!!v),
    );
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return still;
}
