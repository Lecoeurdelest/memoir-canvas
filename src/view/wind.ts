/**
 * TASK-048 — one wind for the whole night.
 *
 * A pure function of time, so the whole forest can agree on how hard it is blowing right now
 * without anything owning state: `Forest.tsx` samples it and publishes three delayed copies as
 * CSS variables, and every swaying thing in the art reads one of them. Trees, grass, canopies
 * and flowers therefore lean TOGETHER, and the gust arrives at the right of the meadow a beat
 * after the left, which is what makes it read as weather rather than as animation.
 *
 * Three breezes at incommensurate rates never repeat inside a sitting; a long envelope takes
 * the whole field from nearly still to hard-blown and back, and a rarer swell pushes past that.
 * That is the "different strengths" the owner asked for — the calm stretches are the point.
 */

/** Seconds between the wind that reaches the left of the meadow and the right of it. */
export const WIND_LAG = 0.7;

/** How many delayed copies of the signal the view publishes; the art bands itself across them. */
export const WIND_BANDS = 3;

/** Blowing strength at time `t` (seconds). Signed: the sign is the direction of the lean. */
export function windAt(t: number): number {
  const breeze =
    Math.sin(t * 0.21) * 0.55 + Math.sin(t * 0.37 + 1.3) * 0.3 + Math.sin(t * 0.73 + 2.1) * 0.15;
  // Long calm-to-blustery envelope: squared so the quiet stretches last and the loud ones peak.
  const envelope = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.043 + 0.7)) ** 2;
  // And now and then, a shove that outruns the envelope entirely.
  const shove = Math.max(0, Math.sin(t * 0.11 - 1.1)) ** 3 * 0.5;
  return breeze * envelope + shove;
}

/** The three copies the stylesheet consumes, oldest wind last: the gust travels rightwards. */
export function windBands(t: number): number[] {
  return Array.from({ length: WIND_BANDS }, (_, i) => windAt(t - i * WIND_LAG));
}
