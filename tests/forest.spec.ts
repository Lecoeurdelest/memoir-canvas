/**
 * TASK-034 — the forest, checked against a real archive rather than a fixture.
 *
 * There is no DOM in this repo's test environment, which is why the layout is a pure module in
 * the first place. Everything a judge would look at — one light per memory, the contradiction
 * findable without reading, the dark half of the forest behind it — is decided here and only
 * painted by `Forest.tsx`.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import * as commands from '../src/domain/commands';
import { buildReadModel } from '../src/store/projection';
import { loadSeed, type SeededArchive } from '../src/seed/loadSeed';
import {
  PLANES,
  ambientCount,
  certaintyOf,
  glowLayers,
  hash,
  parallaxShift,
  placeGaps,
  placeLights,
  span,
  trees,
} from '../src/view/forestLayout';
import type { Spread } from '../src/store/projection';

const HUMAN = { actor: 'human' as const, registeredBecause: 'test' };
const AGENT = { actor: 'agent' as const, registeredBecause: 'user has person open' };

let seed: SeededArchive;

beforeEach(async () => {
  await commands.resetArchive(HUMAN);
  seed = await loadSeed();
});

async function flagTheDisagreement(): Promise<void> {
  await commands.flagConflict(
    { subject_kind: 'person', subject_id: seed.grandmaId, predicate: 'moved_to' },
    AGENT,
  );
}

describe('one light per memory', () => {
  it('draws every spread and nothing else', async () => {
    const { spreads } = await buildReadModel();
    const lights = placeLights(spreads, 0);

    expect(lights).toHaveLength(spreads.length);
    expect(lights.map((l) => l.key)).toEqual(spreads.map((s) => s.key));
  });

  it('keeps a light in the same place across renders', async () => {
    const { spreads } = await buildReadModel();
    const once = placeLights(spreads, 0);
    const twice = placeLights(spreads, 0);
    expect(twice).toEqual(once);
  });

  it('lays the memories out in the order the family lived them', async () => {
    const { spreads } = await buildReadModel();
    const lights = placeLights(spreads, 0);
    const across = lights.map((l) => l.x);
    expect([...across].sort((a, b) => a - b)).toEqual(across);
  });

  it('keeps every light inside the picture', async () => {
    const { spreads } = await buildReadModel();
    for (const light of placeLights(spreads, 0)) {
      expect(light.x, light.key).toBeGreaterThanOrEqual(0);
      expect(light.x, light.key).toBeLessThanOrEqual(100);
      expect(light.y, light.key).toBeGreaterThan(0);
      expect(light.y, light.key).toBeLessThan(100);
    }
  });
});

describe('colour carries certainty', () => {
  it('takes the weakest claim holding a memory up', async () => {
    const { spreads } = await buildReadModel();
    const oral = spreads.find((s) => s.claims.some((c) => c.certainty === 'oral'));
    expect(oral && certaintyOf(oral)).toBe('oral');
  });

  it('an open contradiction outranks whatever the claims said', async () => {
    const before = (await buildReadModel()).spreads[0];
    expect(certaintyOf(before)).not.toBe('conflicting');

    await flagTheDisagreement();
    const after = (await buildReadModel()).spreads[0];
    expect(certaintyOf(after)).toBe('conflicting');
  });

  it('makes the contradiction findable without reading: it flickers faster than anything else', async () => {
    await flagTheDisagreement();
    const { spreads } = await buildReadModel();
    const lights = placeLights(spreads, 0);

    const torn = lights.filter((l) => l.certainty === 'conflicting');
    const calm = lights.filter((l) => l.certainty !== 'conflicting');

    expect(torn).toHaveLength(1);
    expect(Math.max(...torn.map((l) => l.duration))).toBeLessThan(
      Math.min(...calm.map((l) => l.duration)),
    );
  });
});

describe('the forest is a route, so the wedge holds in it too', () => {
  it('lets a reader reach anything while nothing is torn', async () => {
    const { spreads } = await buildReadModel();
    expect(placeLights(spreads, 0).every((l) => l.reachable)).toBe(true);
  });

  it('darkens everything behind an open contradiction', async () => {
    await flagTheDisagreement();
    const { spreads } = await buildReadModel();
    const lights = placeLights(spreads, 0);

    // The seeded disagreement is spreads[0]: a reader standing at the start may open the torn
    // memory itself and nothing past it.
    expect(lights[0].reachable).toBe(true);
    expect(lights.slice(1).some((l) => l.reachable)).toBe(false);
  });

  it('never darkens a memory already behind the reader', async () => {
    const { spreads } = await buildReadModel();
    const last = spreads.length - 1;
    const lights = placeLights(spreads, last);
    expect(lights.every((l) => l.reachable)).toBe(true);
  });

  it('lights up again once a person settles it', async () => {
    await flagTheDisagreement();
    const torn = (await buildReadModel()).spreads[0];
    await commands.resolveClaim(
      {
        conflict_id: torn.conflict!.id,
        winning_claim_id: seed.claim1974,
        resolved_by: seed.uncleId,
        resolution_note: 'the photograph settles it',
      },
      HUMAN,
    );

    const { spreads } = await buildReadModel();
    expect(placeLights(spreads, 0).every((l) => l.reachable)).toBe(true);
  });
});

describe('the unlit rings are the gaps', () => {
  it('draws nothing while nobody has asked anything', async () => {
    const { spreads, questions } = await buildReadModel();
    expect(placeGaps(questions, placeLights(spreads, 0), spreads)).toEqual([]);
  });

  it('appears the moment the agent asks instead of deciding', async () => {
    await flagTheDisagreement();
    await commands.proposeFollowupQuestion(
      { claim_id: seed.claim1972, question_vi: 'Ai còn nhớ năm nào?' },
      AGENT,
    );

    const { spreads, questions } = await buildReadModel();
    const lights = placeLights(spreads, 0);
    const gaps = placeGaps(questions, lights, spreads);

    expect(gaps).toHaveLength(1);
    // Beside the memory it doubts, not floating somewhere else in the forest.
    expect(gaps[0].plane).toBe(lights[0].plane);
    expect(Math.abs(gaps[0].x - lights[0].x)).toBeLessThanOrEqual(5);
  });

  it('an answered question is no longer a gap', async () => {
    await commands.proposeFollowupQuestion(
      { claim_id: seed.claim1972, question_vi: 'Ai còn nhớ năm nào?' },
      AGENT,
    );
    const { spreads, questions } = await buildReadModel();
    const answered = questions.map((q) => ({ ...q, status: 'answered' as const }));
    expect(placeGaps(answered, placeLights(spreads, 0), spreads)).toEqual([]);
  });
});

describe('the budget stated before building', () => {
  it('spends fewer lights and one glow layer on a phone', () => {
    expect(ambientCount(390)).toBeLessThan(ambientCount(1440));
    expect(glowLayers(390)).toBe(1);
    expect(glowLayers(1440)).toBe(2);
  });

  it('plants fewer trees on a phone', () => {
    expect(trees(2, 390).length).toBeLessThan(trees(2, 1440).length);
  });
});

describe('depth', () => {
  it('moves the near plane visibly further than the far one', () => {
    const at = { x: 0.5, y: 0.5 };
    const far = parallaxShift(at, 0);
    const near = parallaxShift(at, 2);
    expect(Math.abs(near.x)).toBeGreaterThan(Math.abs(far.x) * 3);
    expect(PLANES).toHaveLength(3);
  });

  it('moves the scene against the pointer', () => {
    expect(parallaxShift({ x: 0.5, y: 0 }, 2).x).toBeLessThan(0);
    expect(parallaxShift({ x: 0, y: 0 }, 2)).toEqual({ x: -0, y: -0 });
  });
});

describe('the summary line', () => {
  it('reports the years the archive actually covers', async () => {
    const { spreads } = await buildReadModel();
    expect(span(spreads)).toEqual({ from: 1972, to: 1995 });
  });

  it('says nothing rather than guessing when no year is known', () => {
    const undated = [{ key: 'k', claims: [{ year_value: null }] }] as unknown as Spread[];
    expect(span(undated)).toBeNull();
  });
});

describe('placement', () => {
  it('hashes into the unit interval', () => {
    for (const key of ['', 'a', 'Bà ngoại · moved_to', 'x'.repeat(200)]) {
      expect(hash(key)).toBeGreaterThanOrEqual(0);
      expect(hash(key)).toBeLessThanOrEqual(1);
    }
  });
});
