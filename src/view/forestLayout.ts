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
import type { Certainty, FollowupQuestion, StoryCard } from '../domain/types';
import type { Spread } from '../store/projection';

/**
 * Three planes, and how far each slides across a full pointer sweep. The near plane travels
 * roughly 5× the far one; that RATIO is what reads as depth. Equal rates would move the whole
 * picture and look like a broken scroll.
 *
 * TASK-048 shrank every rate by an order of magnitude: the trunk wall was a tileable texture
 * that could sweep half a screen, but the meadow is ONE composed picture — sweep it 750px and
 * the moon leaves the frame. The plane overscan in the stylesheet is sized to exactly these
 * numbers plus TRAVEL_LIMIT; change one and change the other.
 */
export const PLANES = [
  { x: 18, y: 6 },
  { x: 42, y: 12 },
  { x: 96, y: 22 },
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
 * How far a drag may carry the forest, as a fraction of the stage.
 *
 * T2: pan used to be a pure function of pointer position, so the picture hit its limit the moment
 * the pointer touched the edge of the screen. That is a lean, not a walk. Travel now accumulates
 * — and is clamped, because a forest you can lose every light in is not exploration, it is a
 * missing feature that looks like an empty wood.
 */
export const TRAVEL_LIMIT = 0.05;

/**
 * TASK-048, the loop: the world is SCENE_COUNT scenes joined in a ring, so horizontal travel is
 * deliberately unbounded — walk far enough and you come home. Only the vertical walk is still
 * clamped: there is no sky above the sky.
 */
export const SCENE_COUNT = 5;

export function clampTravel(travel: Pointer, stage: { width: number; height: number }): Pointer {
  const limitY = stage.height * TRAVEL_LIMIT * 0.45;
  return {
    x: travel.x,
    y: Math.max(-limitY, Math.min(limitY, travel.y)),
  };
}

/**
 * Where a layer stands inside its own loop: a translate in (-loop, 0], so two copies of the
 * layer side by side always cover the window. Each layer wraps at its OWN rate — that is what
 * lets parallax survive an infinite pan without the layers drifting apart at a seam.
 */
export function wrapOffset(travelX: number, rate: number, loopWidth: number): number {
  if (loopWidth <= 0) return 0;
  const m = ((travelX * rate) % loopWidth + loopWidth) % loopWidth;
  return m - loopWidth;
}

/** Scenery is dragged further than the lights, so walking has the same depth leaning does. */
export function travelShift(travel: Pointer, plane: Plane, scenery: boolean): Pointer {
  const depth = scenery ? 0.7 + plane * 0.5 : 0.85 + plane * 0.12;
  return { x: travel.x * depth, y: travel.y * depth };
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
 * animated glow, which is the most fill-rate-expensive thing on a weak phone (NFR-PERF).
 */
export function ambientCount(width: number): number {
  if (width < 700) return 280;
  if (width < 1100) return 600;
  return 1200;
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
  colour: string;
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
      // Fireflies gather lower in the wood. A smaller high band keeps the canopy alive without
      // turning the whole sky into stars.
      y:
        hash(`${key}:band`) > 0.28
          ? between(`${key}:low-y`, 58, 99)
          : between(`${key}:high-y`, 26, 78),
      size: between(`${key}:size`, 1.35, 3.2),
      colour:
        hash(`${key}:tone`) < 0.28
          ? '#8fd59a'
          : hash(`${key}:tone`) < 0.78
            ? '#c6e579'
            : '#e3e879',
      duration: between(`${key}:dur`, 2.4, 6.9),
      delay: between(`${key}:delay`, 0, 7),
    };
  });
}

/** WCAG puts the floor at 24px and comfort at 44. The glow is decoration; this is the target. */
export const HIT_TARGET = 44;

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
      // TASK-048: the lights live in the meadow — below the horizon seam at 56%, above the
      // foreground grass. A memory floating in the sky reads as a star, not a firefly.
      y: between(`${key}:y`, 60, 84),
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
  /** `question` — the agent asked something. `silence` — the years themselves are empty. */
  kind: 'question' | 'silence';
  /** Set for a silence: the year a story written here belongs to. */
  year: number | null;
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
        y: between(`${q.id}:y`, 60, 84),
      };
      return {
        id: q.id,
        kind: 'question' as const,
        year: null,
        plane: beside?.plane ?? free.plane,
        x: beside ? beside.x + between(`${q.id}:dx`, -5, 5) : free.x,
        y: beside ? beside.y + between(`${q.id}:dy`, -7, 7) : free.y,
        size: between(`${q.id}:size`, 10, 15),
        duration: between(`${q.id}:dur`, 5.8, 9.5),
        delay: between(`${q.id}:delay`, 0, 6),
      };
    });
}

/**
 * A run of years the archive holds nothing for.
 *
 * Not decoration: a gap in a family's memory is a fact about that family, and it is computed from
 * what the archive does and does not contain. The design says as much in its own copy — the blank
 * page is headed *"Khoảng 1985"* and the margin note reads *"Giữa 1983 và 1988 nhà mình không còn
 * mẩu nào"*.
 */
export interface Silence {
  id: string;
  from: number;
  to: number;
  /** The year the ring stands at, and the year a story written here belongs to. */
  at: number;
}

/** Shorter than this is not a silence, it is just how years fall. */
export const SILENT_YEARS = 6;

export function silences(spreads: readonly Spread[]): Silence[] {
  const years = [
    ...new Set(
      spreads
        .flatMap((s) => s.claims.map((c) => c.year_value))
        .filter((y): y is number => y !== null),
    ),
  ].sort((a, b) => a - b);

  const found: Silence[] = [];
  for (let i = 0; i < years.length - 1; i += 1) {
    const from = years[i];
    const to = years[i + 1];
    if (to - from < SILENT_YEARS) continue;
    const at = Math.round((from + to) / 2);
    found.push({ id: `silence-${from}-${to}`, from, to, at });
  }
  return found;
}

/**
 * A ring for every silent run of years, placed along the same left-to-right timeline the memories
 * use — so an empty stretch of a life sits where that stretch belongs.
 */
export function placeSilences(
  spreads: readonly Spread[],
  years: { from: number; to: number } | null,
): ForestGap[] {
  if (!years || years.to === years.from) return [];
  const usable = 100 - MARGIN * 2;

  return silences(spreads).map((silence) => {
    const across = (silence.at - years.from) / (years.to - years.from);
    return {
      id: silence.id,
      kind: 'silence' as const,
      year: silence.at,
      plane: Math.floor(hash(`${silence.id}:plane`) * PLANE_COUNT) as Plane,
      x: MARGIN + across * usable + between(`${silence.id}:jitter`, -2, 2),
      y: between(`${silence.id}:y`, 60, 82),
      size: between(`${silence.id}:size`, 10, 15),
      duration: between(`${silence.id}:dur`, 5.8, 9.5),
      delay: between(`${silence.id}:delay`, 0, 6),
    };
  });
}

/**
 * TASK-048 — every firefly is a place a memory could live. The forest lays time left-to-right
 * (placeLights), so a click anywhere across the stage names a year: the same MARGIN-to-MARGIN
 * axis, inverted. Outside the margins clamps to the nearest end rather than inventing years the
 * family never lived.
 */
export function yearAtX(spreads: readonly Spread[], xPercent: number): number | null {
  const years = span(spreads);
  if (!years) return null;
  const usable = 100 - MARGIN * 2;
  const t = Math.min(1, Math.max(0, (xPercent - MARGIN) / usable));
  return Math.round(years.from + t * (years.to - years.from));
}

/** The years the forest covers, for the one line of text that summarises the whole picture. */
export function span(spreads: readonly Spread[]): { from: number; to: number } | null {
  const years = spreads
    .flatMap((s) => s.claims.map((c) => c.year_value))
    .filter((y): y is number => y !== null);
  return years.length === 0 ? null : { from: Math.min(...years), to: Math.max(...years) };
}

/**
 * TASK-048 — the owner's firefly language. In the meadow, hue answers "is there a story here"
 * before it answers anything else:
 *
 * - `create`  — white: an empty place (open question or silent years); clicking it writes
 * - `conflict` — the same orange the badges call `conflicting`; the wood flinches at it
 * - `story`   — green, and BRIGHTER green is a LONGER story
 *
 * Certainty does not leave the product: the cards and the book keep NIGHT_PALETTE, and every
 * light still announces its certainty in its accessible name. Only the picture's first question
 * changed.
 */
export type FireflyTone = 'create' | 'conflict' | 'story';

export const FIREFLY_TONES = {
  create: '#fff6d8',
  conflict: '#ff9a76',
} as const;

export function toneOf(spread: Spread): FireflyTone {
  return spread.conflict ? 'conflict' : 'story';
}

/**
 * How much of this memory has actually been TOLD: the cards written over its claims, plus what
 * the claims themselves carry. Card bodies dominate on purpose — a story is prose, not a row.
 */
export function storyLength(spread: Spread, cards: readonly StoryCard[]): number {
  const claimIds = new Set(spread.claims.map((c) => c.id));
  const told = cards
    .filter((card) => card.claim_ids.some((id) => claimIds.has(id)))
    .reduce((sum, card) => sum + card.body_vi.length + card.body_en.length, 0);
  const asserted = spread.claims.reduce((sum, c) => sum + (c.object_text?.length ?? 0), 0);
  return told + asserted;
}

/**
 * Glow in [0.35, 1], log-scaled: one epic story must not make every other light look dead, and
 * a memory holding only a bare claim still has to be visibly alive.
 */
export function storyGlow(length: number): number {
  const t = Math.log1p(Math.max(0, length)) / Math.log1p(2000);
  return 0.35 + 0.65 * Math.min(1, t);
}

/** One green family; only luminance rides the glow — "xanh sáng là câu chuyện dài". */
export function storyColour(glow: number): string {
  const t = Math.min(1, Math.max(0, (glow - 0.35) / 0.65));
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `#${[mix(0x4a, 0xb8), mix(0x8a, 0xe8), mix(0x62, 0x78)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}
