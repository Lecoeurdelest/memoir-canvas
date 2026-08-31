/**
 * TASK-035 — the gesture that replaced every button.
 *
 * `FR-BOOK-08` removed the turn controls, which makes the drag the only pointer route through the
 * book. The arithmetic is pure so it can be pinned without a DOM: how far is far enough, which way
 * is forward, and how far the leaf has lifted at that point.
 *
 * The wedge is NOT tested here. That is deliberate: this module reports a gesture and never
 * decides whether it is allowed, and `tests/navigation.spec.ts` owns the refusal.
 */
import { describe, expect, it } from 'vitest';
import { COMMIT_AT, angleOf, commits, directionOf, progressOf } from '../src/view/usePageDrag';

describe('how far the page has been pulled', () => {
  it('is a full turn at half the width, in either direction', () => {
    expect(progressOf(-400, 800)).toBe(-1);
    expect(progressOf(400, 800)).toBe(1);
  });

  it('never runs past a full turn, however far the hand goes', () => {
    expect(progressOf(-5000, 800)).toBe(-1);
    expect(progressOf(5000, 800)).toBe(1);
  });

  it('is nothing at all before the hand has moved', () => {
    expect(progressOf(0, 800)).toBe(0);
  });

  it('refuses to divide by a book with no width', () => {
    // A book measured before layout has run. Returning NaN here would set a NaN transform and
    // the page would vanish rather than misbehave visibly.
    expect(progressOf(-100, 0)).toBe(0);
  });
});

describe('when a pull becomes a turn', () => {
  it('commits past the threshold and springs back below it', () => {
    expect(commits(COMMIT_AT)).toBe(true);
    expect(commits(-COMMIT_AT)).toBe(true);
    expect(commits(COMMIT_AT - 0.01)).toBe(false);
    expect(commits(-COMMIT_AT + 0.01)).toBe(false);
    expect(commits(0)).toBe(false);
  });

  it('asks for more than a third of the page, so a scroll is never a turn', () => {
    expect(COMMIT_AT).toBeGreaterThan(0.33);
  });

  it('reads a leftward pull as going forward, the way a right-hand page does', () => {
    expect(directionOf(-0.6)).toBe(1);
    expect(directionOf(0.6)).toBe(-1);
  });
});

describe('the lifted leaf', () => {
  it('lies flat at rest', () => {
    // toBeCloseTo, not toBe: 0 * -168 is -0, which Object.is separates from 0 and CSS does not.
    expect(angleOf(0)).toBeCloseTo(0, 10);
  });

  it('opens away from the reader when pulled forward, and towards them when pulled back', () => {
    expect(angleOf(-1)).toBeGreaterThan(0);
    expect(angleOf(1)).toBeLessThan(0);
  });

  it('stops short of flat against the other page, so the fold stays visible', () => {
    expect(Math.abs(angleOf(-1))).toBeLessThan(180);
  });

  it('tracks the hand rather than snapping', () => {
    const half = Math.abs(angleOf(-0.5));
    const full = Math.abs(angleOf(-1));
    expect(half).toBeCloseTo(full / 2, 5);
  });
});
