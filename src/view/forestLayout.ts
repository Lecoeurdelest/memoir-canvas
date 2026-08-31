/**
 * TASK-034 — where every light in the forest goes, and why it is that colour.
 *
 * Pure on purpose. The repo has no DOM in its test environment, so anything a test must be able
 * to hold onto lives here and `Forest.tsx` only paints what this returns. Placement is derived
 * from a hash of the spread key rather than `Math.random`, so a re-render never reshuffles the
 * forest under the reader's cursor and a test can assert an exact position.
 *
 * R5: reads the projection, decides nothing about the archive.
 */

import { floorCertainty } from '../domain/types';
import { jumpTarget } from './useSpreadNavigation';
import type { Certainty, FollowupQuestion } from '../domain/types';
import type { Spread } from '../store/projection';

/**
 * Three planes, and how far each slides across a full pointer sweep — measured in the design
 * canvas. The near plane travels roughly 4.4× the far one; that RATIO is what reads as depth.
 * Equal rates would move the whole picture and look like a broken scroll.
 */
export const PLANES = [
  { x: 340, y: 90 },
  { x: 820, y: 190 },
  { x: 1500, y: 320 },
] as const;

/**
 * The lights travel far less than the scenery they sit in, and that is not a compromise — it is
 * the difference between scenery and a target.
 *
 * A near plane sweeping 1500px moves half a screen; a trunk may swing off the edge and nothing is
 * lost, but a memory that slides out of the picture is a memory nobody can click. So the walk
 * belongs to the trees, and the lights keep a gentle version of the same parallax: enough that
 * they still sit at three depths, little enough that they never leave the stage.
 *
 * Learned by building the other thing first: with the lights on the scenery planes, three of the
 * four seeded memories rendered outside the visible stage.
 */
export const LIGHT_PLANES = [
  { x: 44, y: 16 },
  { x: 88, y: 30 },
  { x: 150, y: 48 },
] as const;

export type Plane = 0 | 1 | 2;

export const PLANE_COUNT = PLANES.length;

/** Pointer position as a fraction of the stage, centred on zero. */
export interface Pointer {
  x: number;
  y: number;
}

export const CENTRE: Pointer = { x: 0, y: 0 };

/** The scene moves against the pointer, the way a window's view does when you lean. */
export function parallaxShift(pointer: Pointer, plane: Plane): Pointer {
  const { x, y } = PLANES[plane];
  return { x: -pointer.x * x, y: -pointer.y * y };
}

/** The same lean, applied to the lights, at a rate that keeps them on the stage. */
export function lightShift(pointer: Pointer, plane: Plane): Pointer {
  const { x, y } = LIGHT_PLANES[plane];
  return { x: -pointer.x * x, y: -pointer.y * y };
}

/**
 * FNV-1a with a murmur3 finalizer. The same key always lands in the same place, so the forest is
 * a map of the archive rather than a new picture every render.
 *
 * The finalizer is not decoration. Plain FNV-1a over keys that differ only in their last few
 * characters — `ambient-11:x` against `ambient-11:y` — leaves the two hashes correlated, and the
 * fireflies came out in a visible diagonal streak across the picture. Avalanche breaks it.
 */
export function hash(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

const between = (key: string, lo: number, hi: number): number => lo + hash(key) * (hi - lo);

/**
 * Decorative fireflies — the ones that are NOT memories. They exist so a four-memory archive
 * still looks like a forest, and they scale with the viewport because every one of them is an
 * animated box-shadow, which is the most fill-rate-expensive thing on a weak phone (NFR-PERF).
 */
export function ambientCount(width: number): number {
  if (width < 700) return 44;
  if (width < 1100) return 92;
  return 170;
}

/** Under a phone width the glow drops to a single shadow layer rather than two. */
export function glowLayers(width: number): 1 | 2 {
  return width < 700 ? 1 : 2;
}

export interface Ambient {
  key: string;
  plane: Plane;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export function ambientLights(width: number): Ambient[] {
  return Array.from({ length: ambientCount(width) }, (_, i) => {
    const key = `ambient-${i}`;
    return {
      key,
      plane: Math.floor(hash(`${key}:plane`) * PLANE_COUNT) as Plane,
      x: between(`${key}:x`, 0, 100),
      y: between(`${key}:y`, 18, 92),
      size: between(`${key}:size`, 1.5, 2.9),
      duration: between(`${key}:dur`, 2.4, 6.9),
      delay: between(`${key}:delay`, 0, 7),
    };
  });
}

export interface ForestLight {
  key: string;
  index: number;
  plane: Plane;
  /** Per cent across and down the plane it sits on. */
  x: number;
  y: number;
  size: number;
  certainty: Certainty;
  /** False while an open conflict puts this memory out of forward reach. */
  reachable: boolean;
  duration: number;
  delay: number;
}

/**
 * A spread is as certain as the weakest claim holding it up — the same floor a story card takes,
 * so the forest and the cards can never disagree about how sure the archive is. An open conflict
 * outranks all of it: the archive is arguing with itself, and that is what the reader must see.
 */
export function certaintyOf(spread: Spread): Certainty {
  if (spread.conflict) return 'conflicting';
  return floorCertainty(spread.claims.map((c) => c.certainty));
}

/** Kept clear at the edges so no light lands under the title or the legend. */
const MARGIN = 9;

/**
 * One light per memory, laid out left to right in time order.
 *
 * Time runs across, not through: arrow keys then walk the forest in the order the family lived
 * it, and depth is free to carry something else. Depth and height come from the hash.
 *
 * `at` is where the reader currently stands, and reachability is decided by `jumpTarget` rather
 * than re-stated here — the wedge has one implementation and the forest is just another route
 * that has to obey it (FR-BOOK-03).
 */
export function placeLights(spreads: readonly Spread[], at: number): ForestLight[] {
  const usable = 100 - MARGIN * 2;
  const step = spreads.length > 1 ? usable / (spreads.length - 1) : 0;

  return spreads.map((spread, index) => {
    const key = spread.key;
    const conflicting = spread.conflict !== null;
    return {
      key,
      index,
      plane: Math.floor(hash(`${key}:plane`) * PLANE_COUNT) as Plane,
      x: MARGIN + index * step + between(`${key}:jitter`, -2.5, 2.5),
      y: between(`${key}:y`, 26, 82),
      size: between(`${key}:size`, 11, 17),
      certainty: certaintyOf(spread),
      reachable: jumpTarget(spreads, at, index) === index,
      // A contradiction does not breathe, it flickers: fast, and short enough to catch the eye
      // from across the picture without reading a word.
      duration: conflicting ? between(`${key}:dur`, 0.7, 1.1) : between(`${key}:dur`, 3.4, 6.6),
      delay: between(`${key}:delay`, 0, 6),
    };
  });
}

export interface ForestGap {
  id: string;
  plane: Plane;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

/**
 * An unlit ring for every question nobody has answered.
 *
 * A ring the agent has just proposed appears NEXT TO the memory it doubts, which is the whole
 * point: the agent could not settle the year, so it left a mark beside the year instead of
 * quietly picking one. Questions pointing at nothing the forest is drawing float free.
 */
export function placeGaps(
  questions: readonly FollowupQuestion[],
  lights: readonly ForestLight[],
  spreads: readonly Spread[],
): ForestGap[] {
  const lightOfClaim = new Map<string, ForestLight>();
  spreads.forEach((spread, index) => {
    const light = lights[index];
    if (!light) return;
    for (const claim of spread.claims) lightOfClaim.set(claim.id, light);
  });

  return questions
    .filter((q) => q.status === 'open')
    .map((q) => {
      const beside = q.claim_id ? lightOfClaim.get(q.claim_id) : undefined;
      const free = {
        plane: Math.floor(hash(`${q.id}:plane`) * PLANE_COUNT) as Plane,
        x: between(`${q.id}:x`, MARGIN, 100 - MARGIN),
        y: between(`${q.id}:y`, 26, 82),
      };
      return {
        id: q.id,
        plane: beside?.plane ?? free.plane,
        x: beside ? beside.x + between(`${q.id}:dx`, -5, 5) : free.x,
        y: beside ? beside.y + between(`${q.id}:dy`, -7, 7) : free.y,
        size: between(`${q.id}:size`, 10, 15),
        duration: between(`${q.id}:dur`, 5.8, 9.5),
        delay: between(`${q.id}:delay`, 0, 6),
      };
    });
}

/** The years the forest covers, for the one line of text that summarises the whole picture. */
export function span(spreads: readonly Spread[]): { from: number; to: number } | null {
  const years = spreads
    .flatMap((s) => s.claims.map((c) => c.year_value))
    .filter((y): y is number => y !== null);
  return years.length === 0 ? null : { from: Math.min(...years), to: Math.max(...years) };
}

export interface Tree {
  key: string;
  x: number;
  width: number;
  height: number;
  tilt: number;
}

/**
 * Trunks. Scenery, and nothing else — every one is `aria-hidden`, because a forest that hid
 * information in its trees would be a forest a screen reader cannot walk.
 */
export function trees(plane: Plane, width: number): Tree[] {
  const count = width < 700 ? 10 + plane * 4 : 18 + plane * 8;
  return Array.from({ length: count }, (_, i) => {
    const key = `tree-${plane}-${i}`;
    return {
      key,
      x: between(`${key}:x`, -4, 104),
      width: between(`${key}:w`, 4 + plane * 1.6, 10 + plane * 3),
      height: between(`${key}:h`, 47 + plane * 6, 84 + plane * 8),
      tilt: between(`${key}:tilt`, -0.7, 0.7),
    };
  });
}
