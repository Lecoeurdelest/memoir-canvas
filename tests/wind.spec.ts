/**
 * TASK-048 — the wind is a pure function of time, which is the only reason it can be checked at
 * all: there is no DOM in this repo's test environment, so `Forest.tsx` samples this and the
 * stylesheet leans on the result, while everything worth asserting lives here.
 */
import { describe, expect, it } from 'vitest';
import { WIND_BANDS, WIND_LAG, windAt, windBands } from '../src/view/wind';

const sweep = (from: number, to: number, step = 0.05): number[] => {
  const out: number[] = [];
  for (let t = from; t < to; t += step) out.push(windAt(t));
  return out;
};

describe('the wind blows at different strengths', () => {
  it('is the same wind every time it is asked', () => {
    expect(windAt(12.5)).toBe(windAt(12.5));
    expect(windAt(0)).not.toBe(windAt(37));
  });

  it('never leaves a believable band, in either direction', () => {
    for (const w of sweep(0, 900)) {
      expect(w).toBeGreaterThan(-1.5);
      expect(w).toBeLessThan(1.5);
    }
  });

  it('has calm stretches and hard ones — the levels the owner asked for', () => {
    // The peak of each half-minute is the "how hard is it blowing right now" a person feels.
    const peaks: number[] = [];
    for (let w0 = 0; w0 < 600; w0 += 30) {
      peaks.push(Math.max(...sweep(w0, w0 + 30).map(Math.abs)));
    }
    const quietest = Math.min(...peaks);
    const hardest = Math.max(...peaks);
    expect(quietest).toBeLessThan(0.35);
    expect(hardest).toBeGreaterThan(1);
    // and it is not one slow ramp: the strength keeps changing from window to window
    const swings = peaks.slice(1).filter((p, i) => Math.abs(p - peaks[i]) > 0.15);
    expect(swings.length).toBeGreaterThan(peaks.length / 3);
  });

  it('turns rather than flickers: a second apart is a small change', () => {
    for (let t = 0; t < 300; t += 1) {
      expect(Math.abs(windAt(t + 1) - windAt(t))).toBeLessThan(0.5);
    }
  });
});

describe('the gust crosses the meadow', () => {
  it('hands the art one delayed copy per band', () => {
    const bands = windBands(50);
    expect(bands).toHaveLength(WIND_BANDS);
    bands.forEach((w, i) => expect(w).toBeCloseTo(windAt(50 - i * WIND_LAG), 10));
  });

  it('reaches the far side later, so the bands are not one value', () => {
    const spread = Array.from({ length: 200 }, (_, i) =>
      Math.max(...windBands(i)) - Math.min(...windBands(i)),
    );
    expect(Math.max(...spread)).toBeGreaterThan(0.1);
  });
});
