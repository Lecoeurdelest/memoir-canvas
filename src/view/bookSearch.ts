/**
 * TASK-039 — asking the book, and finding out how sure the answer is.
 *
 * Pure: spreads in, marked pages out. No network, no index, no embedding, no ranking model — a
 * family archive is a few hundred rows and this is a `filter`. Being pure is also what lets the
 * one rule that matters be tested without a DOM.
 *
 * **The answer is no more certain than the weakest page it rests on.** Never an average: two
 * confident pages must not be allowed to launder an uncertain one into a confident-looking answer.
 * That is the move the rest of this project refuses, and it would be this project committing it.
 */

import { floorCertainty } from '../domain/types';
import { certaintyOf } from './forestLayout';
import type { Certainty, Person, Place } from '../domain/types';
import type { Spread } from '../store/projection';

/**
 * Fold a Vietnamese string down to something a person can type on any keyboard.
 *
 * NFD splits `ằ` into a base letter and a combining mark, which `\p{M}` then strips — but it does
 * NOT decompose `đ`, which is its own letter rather than `d` plus a mark. A family typing
 * `da nang` for `Đà Nẵng` is the normal case, not the edge case, so `đ` is handled by hand.
 */
export function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export interface Marked {
  key: string;
  index: number;
  /** 1-based, the way a page is numbered rather than indexed. */
  page: number;
  year: number | null;
  label: string;
  certainty: Certainty;
  /** False while the wedge puts this page out of forward reach. */
  reachable: boolean;
}

export interface Answer {
  marked: Marked[];
  /** The weakest rung among the marked pages, or null when nothing matched. */
  floor: Certainty | null;
}

/** Every word a page can be found by: who, what, where, when, and what the sources say. */
export function haystack(
  spread: Spread,
  people: readonly Person[],
  places: readonly Place[],
  sourceText: readonly string[],
): string {
  const subject = people.find((p) => p.id === spread.subjectId)?.display_name ?? '';
  const objects = spread.claims.map(
    (c) => places.find((p) => p.id === c.object_place_id)?.name ?? c.object_text ?? '',
  );
  const years = spread.claims.flatMap((c) =>
    [c.year_value, c.year_min, c.year_max].filter((y): y is number => y !== null),
  );
  return fold(
    [subject, spread.predicate, ...objects, ...years.map(String), ...sourceText].join(' '),
  );
}

/** At most three ribbons: the spine holds three, and a fourth would be a list, not a book. */
export const RIBBONS = 3;

export interface AskInput {
  question: string;
  spreads: readonly Spread[];
  people: readonly Person[];
  places: readonly Place[];
  /** Text of every source bearing on a spread, keyed by spread key. */
  sourceTextOf: (spread: Spread) => readonly string[];
  /** Where the reader stands, so the wedge can be applied to the ribbons too. */
  reachableUpTo: number;
  labelOf: (spread: Spread) => string;
}

export function ask(input: AskInput): Answer {
  const words = fold(input.question).split(/\s+/).filter((w) => w.length > 1);
  if (words.length === 0) return { marked: [], floor: null };

  const scored = input.spreads
    .map((spread, index) => {
      const hay = haystack(spread, input.people, input.places, input.sourceTextOf(spread));
      const hits = words.filter((w) => hay.includes(w)).length;
      return { spread, index, hits };
    })
    .filter((s) => s.hits > 0)
    // Most words matched first; ties broken by time order, so the book reads forwards.
    .sort((a, b) => b.hits - a.hits || a.index - b.index)
    .slice(0, RIBBONS);

  const marked = scored.map(({ spread, index }) => ({
    key: spread.key,
    index,
    page: index + 1,
    year: spread.claims[0]?.year_value ?? null,
    label: input.labelOf(spread),
    certainty: certaintyOf(spread),
    reachable: index <= input.reachableUpTo,
  }));

  return {
    marked,
    floor: marked.length === 0 ? null : floorCertainty(marked.map((m) => m.certainty)),
  };
}
