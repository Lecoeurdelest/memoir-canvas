/**
 * TASK-018 · TASK-019 — the tear is a consequence of state.
 *
 * These assert the read model, not the pixels: a spread carries a conflict if and only if one is
 * open, and it names the confirming person once one is settled. The browser probe checks that
 * the components render it; this checks that the data can never say something the metaphor
 * would then have to invent.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import * as commands from '../src/domain/commands';
import { buildReadModel } from '../src/store/projection';
import { loadSeed, type SeededArchive } from '../src/seed/loadSeed';

const HUMAN = { actor: 'human' as const, registeredBecause: 'test' };
const AGENT = { actor: 'agent' as const, registeredBecause: 'user has person open' };

let seed: SeededArchive;

beforeEach(async () => {
  await commands.resetArchive(HUMAN);
  seed = await loadSeed();
});

describe('spreads — the spine', () => {
  it('puts the two disputed claims on ONE spread, not two', async () => {
    const m = await buildReadModel();
    // The disagreement is one station, carrying both years. Everything else stands alone.
    expect(m.spreads[0].claims).toHaveLength(2);
    expect(m.spreads[0].claims.map((c) => c.year_value)).toEqual([1972, 1974]);
    expect(m.spreads.slice(1).every((s) => s.claims.length === 1)).toBe(true);
  });

  it('gives the road somewhere to go', async () => {
    // A road with one station is not a road. The seed must span years for travel to mean anything.
    const m = await buildReadModel();
    expect(m.spreads.length).toBeGreaterThan(1);
    const years = m.spreads.map((s) => s.claims[0].year_value);
    expect(Math.max(...(years as number[])) - Math.min(...(years as number[]))).toBeGreaterThan(10);
  });

  it('gives a different assertion its own spread', async () => {
    const before = (await buildReadModel()).spreads.length;
    await commands.addMemoryClaim(
      {
        subject_kind: 'person',
        subject_id: seed.grandmaId,
        predicate: 'opened_business',
        object_text: 'tiệm may',
        year_value: 1990,
      },
      HUMAN,
    );
    const m = await buildReadModel();
    expect(m.spreads).toHaveLength(before + 1);

    // The seed's own opened_business claim names a PLACE; this one names text. schema.sql:173
    // says those never group, so this must be its own station rather than a second disagreement.
    const byText = m.spreads.filter((s) => s.predicate === 'opened_business');
    expect(byText).toHaveLength(2);
    expect(byText.every((s) => s.claims.length === 1)).toBe(true);
  });

  it('orders the spine by year', async () => {
    await commands.addMemoryClaim(
      {
        subject_kind: 'person',
        subject_id: seed.grandmaId,
        predicate: 'born_in',
        object_text: 'Hội An',
        year_value: 1940,
      },
      HUMAN,
    );
    const m = await buildReadModel();
    const years = m.spreads.map((s) => s.claims[0].year_value);
    expect(years).toEqual([...years].sort((a, b) => (a ?? 0) - (b ?? 0)));
  });
});

describe('TASK-018 — the tear appears if and only if a conflict is open', () => {
  it('is absent while the disagreement is merely latent', async () => {
    const m = await buildReadModel();
    // The seed leaves two years in the archive without flagging them: the detector sees a
    // disagreement, but nobody has recorded a conflict, so nothing tears.
    expect(m.disagreements).toHaveLength(1);
    expect(m.spreads[0].conflict).toBeNull();
  });

  it('appears once the conflict is recorded', async () => {
    await commands.flagConflict(
      { subject_kind: 'person', subject_id: seed.grandmaId, predicate: 'moved_to' },
      AGENT,
    );
    const m = await buildReadModel();
    expect(m.spreads[0].conflict).not.toBeNull();
    expect(m.spreads[0].conflict!.status).toBe('open');
  });

  it('shows both competing claims, with no winner marked in the data', async () => {
    await commands.flagConflict(
      { subject_kind: 'person', subject_id: seed.grandmaId, predicate: 'moved_to' },
      AGENT,
    );
    const m = await buildReadModel();
    const spread = m.spreads[0];

    expect(spread.claims.map((c) => c.year_value)).toEqual([1972, 1974]);
    // Both carry the same label while the conflict is open — nothing in the read model ranks
    // them, so the view has nothing to accidentally favour.
    expect(new Set(spread.claims.map((c) => c.certainty))).toEqual(new Set(['conflicting']));
    expect(spread.resolvedBy).toBeNull();
  });
});

describe('TASK-019 — healing', () => {
  it('heals only once the conflict is resolved, and names the person', async () => {
    const flagged = await commands.flagConflict(
      { subject_kind: 'person', subject_id: seed.grandmaId, predicate: 'moved_to' },
      AGENT,
    );

    let m = await buildReadModel();
    expect(m.spreads[0].conflict, 'still torn before resolution').not.toBeNull();
    expect(m.spreads[0].resolvedBy).toBeNull();

    await commands.resolveClaim(
      {
        conflict_id: flagged.conflictId,
        winning_claim_id: seed.claim1974,
        resolved_by: seed.uncleId,
        resolution_note: 'Cậu Ba xác nhận',
      },
      HUMAN,
    );

    m = await buildReadModel();
    const spread = m.spreads[0];
    expect(spread.conflict, 'the tear is gone').toBeNull();
    expect(spread.resolvedBy?.display_name, 'a human is visible in the result').toBe('Cậu Ba');
    expect(spread.claims).toHaveLength(1);
    expect(spread.claims[0].certainty).toBe('confirmed');
  });
});
