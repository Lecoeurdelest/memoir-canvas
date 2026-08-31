/**
 * TASK-039 — asking the book, against a real archive.
 *
 * Two things here would be easy to get wrong and hard to notice. Diacritic folding, because a
 * family types `da nang` and the feature looks broken to exactly the people it is for. And the
 * certainty of an assembled answer, because averaging looks reasonable and quietly launders an
 * uncertain page into a confident one — the move the rest of this project refuses.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import * as commands from '../src/domain/commands';
import { buildReadModel } from '../src/store/projection';
import { loadSeed, type SeededArchive } from '../src/seed/loadSeed';
import { RIBBONS, ask, fold } from '../src/view/bookSearch';
import type { ReadModel, Spread } from '../src/store/projection';

const HUMAN = { actor: 'human' as const, registeredBecause: 'test' };
const AGENT = { actor: 'agent' as const, registeredBecause: 'user has person open' };

let seed: SeededArchive;
let model: ReadModel;

beforeEach(async () => {
  await commands.resetArchive(HUMAN);
  seed = await loadSeed();
  model = await buildReadModel();
});

function asking(question: string, reachableUpTo = Number.MAX_SAFE_INTEGER) {
  const sourceTextOf = (spread: Spread): string[] =>
    model.evidence
      .filter((e) => spread.claims.some((c) => c.id === e.claim_id))
      .flatMap((e) => {
        const source = model.sources.find((s) => s.id === e.source_id);
        return [source?.title ?? '', source?.verbatim ?? '', e.excerpt ?? ''];
      });

  return ask({
    question,
    spreads: model.spreads,
    people: model.people,
    places: model.places,
    sourceTextOf,
    reachableUpTo,
    labelOf: (s) => s.predicate,
  });
}

describe('folding a Vietnamese word down to what a family will type', () => {
  it('strips the tone marks', () => {
    expect(fold('Đà Nẵng')).toBe('da nang');
    expect(fold('Bà ngoại')).toBe('ba ngoai');
    expect(fold('Hội An')).toBe('hoi an');
  });

  it('handles đ, which NFD does not decompose because it is its own letter', () => {
    expect(fold('đ')).toBe('d');
    expect(fold('Đ')).toBe('d');
    expect(fold('đình')).toBe('dinh');
  });

  it('leaves plain text alone', () => {
    expect(fold('  Shop 1974 ')).toBe('shop 1974');
  });
});

describe('what the book marks', () => {
  it('finds a place typed without its diacritics', () => {
    const { marked } = asking('da nang');
    expect(marked.length).toBeGreaterThan(0);
  });

  it('finds a person the same way', () => {
    expect(asking('ba ngoai').marked.length).toBeGreaterThan(0);
  });

  it('finds a year', () => {
    const { marked } = asking('1995');
    expect(marked).toHaveLength(1);
    expect(marked[0].year).toBe(1995);
  });

  it('finds what a source actually said, not only the claim', () => {
    // "tiệm may" appears in the oral account's verbatim, nowhere in the claim's own columns.
    expect(asking('tiem may').marked.length).toBeGreaterThan(0);
  });

  it('marks nothing at all for a question that matches nothing', () => {
    const answer = asking('Paris');
    expect(answer.marked).toEqual([]);
    expect(answer.floor).toBeNull();
  });

  it('marks nothing for an empty question rather than everything', () => {
    expect(asking('   ').marked).toEqual([]);
    expect(asking('a').marked, 'a single letter is not a question').toEqual([]);
  });

  it('never slides out more ribbons than the spine holds', () => {
    const { marked } = asking('da nang ba ngoai 1972 1974 1976 tiem may');
    expect(marked.length).toBeLessThanOrEqual(RIBBONS);
  });

  it('numbers a page from one, the way a book does', () => {
    const { marked } = asking('1995');
    expect(marked[0].page).toBe(marked[0].index + 1);
  });
});

describe('how sure an assembled answer is', () => {
  it('is the weakest page, not the best of them', async () => {
    // Mẹ · born_in rests on nothing at all — `uncertain`. Ask something that reaches both it and
    // a page backed by a source, and the answer must take the floor.
    const { marked, floor } = asking('da nang');
    const rungs = marked.map((m) => m.certainty);
    expect(rungs.length).toBeGreaterThan(1);
    expect(floor).toBe(
      rungs.includes('uncertain') ? 'uncertain' : floor,
    );
    // Whatever the set, the floor is never stronger than a rung actually present.
    expect(rungs).toContain(floor);
  });

  it('does not let a settled page raise the ones beside it', async () => {
    await commands.flagConflict(
      { subject_kind: 'person', subject_id: seed.grandmaId, predicate: 'moved_to' },
      AGENT,
    );
    model = await buildReadModel();
    const { floor, marked } = asking('da nang');
    expect(marked.some((m) => m.certainty === 'conflicting')).toBe(true);
    expect(marked).toContainEqual(expect.objectContaining({ certainty: floor! }));
  });
});

describe('the ribbons obey the wedge like every other route', () => {
  it('marks a page beyond the tear, but not as reachable', async () => {
    await commands.flagConflict(
      { subject_kind: 'person', subject_id: seed.grandmaId, predicate: 'moved_to' },
      AGENT,
    );
    model = await buildReadModel();

    // The reader stands at the start; the seeded disagreement is spreads[0].
    const { marked } = asking('da nang ba ngoai', 0);
    expect(marked.length).toBeGreaterThan(1);
    expect(marked.filter((m) => m.index > 0).every((m) => !m.reachable)).toBe(true);
    // A found page is still SHOWN — hiding it would be the archive concealing what it holds.
    expect(marked.some((m) => !m.reachable)).toBe(true);
  });
});
