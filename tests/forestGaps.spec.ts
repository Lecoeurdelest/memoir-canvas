/**
 * TASK-042 — the archive's own silences, and what a family is allowed to write into one.
 *
 * The point of the feature is that a first-run archive is answerable: a family can add a memory
 * without the agent having asked anything. The point of these tests is the *other* half — that
 * what gets written asserts only what was actually told.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import * as commands from '../src/domain/commands';
import { buildReadModel } from '../src/store/projection';
import { loadSeed, type SeededArchive } from '../src/seed/loadSeed';
import { SILENT_YEARS, placeSilences, silences, span } from '../src/view/forestLayout';

const HUMAN = { actor: 'human' as const, registeredBecause: 'a person filled a year nobody had told' };

let seed: SeededArchive;

beforeEach(async () => {
  await commands.resetArchive(HUMAN);
  seed = await loadSeed();
});

describe('where an empty spot comes from', () => {
  it('finds them without the agent having asked anything', async () => {
    const { spreads, questions } = await buildReadModel();
    expect(questions, 'nobody has asked yet').toHaveLength(0);
    expect(silences(spreads).length, 'and yet there is somewhere to write').toBeGreaterThan(0);
  });

  it('stands each one in a run the archive genuinely has nothing for', async () => {
    const { spreads } = await buildReadModel();
    const told = new Set(
      spreads.flatMap((s) => s.claims.map((c) => c.year_value)).filter((y) => y !== null),
    );
    for (const silence of silences(spreads)) {
      expect(silence.to - silence.from).toBeGreaterThanOrEqual(SILENT_YEARS);
      expect(told.has(silence.at), `${silence.at} is meant to be empty`).toBe(false);
      expect(silence.at).toBeGreaterThan(silence.from);
      expect(silence.at).toBeLessThan(silence.to);
    }
  });

  it('does not call an ordinary run of years a silence', () => {
    const close = [1972, 1974, 1976].map((year, i) => ({
      key: `k${i}`,
      claims: [{ year_value: year }],
    }));
    expect(silences(close as never)).toEqual([]);
  });

  it('says nothing at all about an archive with one memory or none', () => {
    expect(silences([])).toEqual([]);
    expect(silences([{ key: 'k', claims: [{ year_value: 1972 }] }] as never)).toEqual([]);
  });

  it('lays them along the same timeline the memories use', async () => {
    const { spreads } = await buildReadModel();
    const placed = placeSilences(spreads, span(spreads));
    expect(placed.length).toBe(silences(spreads).length);
    for (const gap of placed) {
      expect(gap.kind).toBe('silence');
      expect(gap.year).not.toBeNull();
      expect(gap.x).toBeGreaterThan(0);
      expect(gap.x).toBeLessThan(100);
    }
  });

  it('closes the one it was filling', async () => {
    const { spreads } = await buildReadModel();
    const gap = silences(spreads)[0];

    await commands.tellMemory(
      { told_by: seed.motherId, year_value: gap.at, story: 'Năm đó nhà mình chuyển chỗ ở.' },
      HUMAN,
    );

    const after = await buildReadModel();
    const stillSilent = silences(after.spreads).some((s) => s.at === gap.at);
    expect(stillSilent, 'the year has been told now').toBe(false);
  });
});

describe('what writing into a silence is allowed to claim', () => {
  it('records that a person told a story, and nothing more', async () => {
    await commands.tellMemory(
      { told_by: seed.motherId, year_value: 1985, story: 'Bà nhận thêm hai đứa học việc.' },
      HUMAN,
    );

    const { claims, sources } = await buildReadModel();
    const written = claims.find((c) => c.year_value === 1985);

    expect(written?.predicate, 'no predicate is invented from the prose').toBe('remembered');
    expect(written?.subject_id).toBe(seed.motherId);
    expect(written?.certainty, 'a story told is oral, never document-backed').toBe('oral');
    expect(written?.year_precision, 'the ring stands in the middle of a span').toBe('circa');
    expect(written?.confirmed_by, 'nothing here is a confirmed fact').toBeNull();
    // Nothing about a place, a person or an event was guessed out of the sentence.
    expect(written?.object_place_id).toBeNull();
    expect(written?.object_person_id).toBeNull();
    expect(written?.object_text).toBeNull();

    const account = sources.find((s) => s.verbatim === 'Bà nhận thêm hai đứa học việc.');
    expect(account?.kind).toBe('oral_account');
    expect(account?.contributor_id).toBe(seed.motherId);
  });

  it('becomes a light in the forest', async () => {
    const before = (await buildReadModel()).spreads.length;
    await commands.tellMemory(
      { told_by: seed.motherId, year_value: 1985, story: 'Có chuyện này.' },
      HUMAN,
    );
    expect((await buildReadModel()).spreads.length).toBe(before + 1);
  });

  it('refuses a memory with no words, no teller, or no year', async () => {
    for (const bad of [
      { told_by: seed.motherId, year_value: 1985, story: '   ' },
      { told_by: '', year_value: 1985, story: 'Có chuyện.' },
      { told_by: seed.motherId, year_value: Number.NaN, story: 'Có chuyện.' },
    ]) {
      await expect(commands.tellMemory(bad, HUMAN)).rejects.toThrow();
    }
  });

  it('writes the claim and the account together, or neither', async () => {
    const before = await buildReadModel();
    await commands
      .tellMemory({ told_by: '', year_value: 1985, story: 'Có chuyện.' }, HUMAN)
      .catch(() => undefined);
    const after = await buildReadModel();
    expect(after.claims.length).toBe(before.claims.length);
    expect(after.sources.length).toBe(before.sources.length);
  });
});
