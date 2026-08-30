/**
 * TASK-011 and the data half of TASK-023, driven through makeHandlers — the surface an agent
 * actually touches, not the commands underneath it.
 *
 * The point of most of these is negative: what the handler refuses, and what it declines to say.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import * as commands from '../src/domain/commands';
import { query } from '../src/domain/db';
import { makeHandlers } from '../src/mcp/handlers';
import { ALL_TOOL_NAMES } from '../src/mcp/descriptors';
import { loadSeed, type SeededArchive } from '../src/seed/loadSeed';

const HUMAN = { actor: 'human' as const, registeredBecause: 'test' };
const agent = makeHandlers({ actor: 'agent', registeredBecause: 'user is browsing the archive' });
const human = makeHandlers(HUMAN);

let seed: SeededArchive;

beforeEach(async () => {
  await commands.resetArchive(HUMAN);
  seed = await loadSeed();
});

describe('TASK-011 — the eight handlers', () => {
  it('implements every tool the contract advertises', async () => {
    expect(Object.keys(agent).sort()).toEqual([...ALL_TOOL_NAMES].sort());

    // None may answer "not implemented" any more.
    const results = await Promise.all(
      ALL_TOOL_NAMES.map((n) => agent[n]({}).then((r) => [n, r] as const)),
    );
    for (const [name, r] of results) {
      expect(r.error?.message ?? '', name).not.toContain('not implemented');
    }
  });

  it('turns badly typed arguments into a structured error, not a crash', async () => {
    const cases = [
      agent.add_person(null),
      agent.add_person({ display_name: 42 }),
      agent.add_person({ display_name: 'x', aka: 'not-an-array' }),
      agent.add_memory_claim({ subject_kind: 'person', subject_id: 'x', predicate: 'p', year_value: '1972' }),
      agent.generate_story_card({ subject_person_id: 'x', claim_ids: 'nope' }),
      agent.link_claim_to_source({ claim_id: 'x', stance: 'supports' }),
    ];
    for (const r of await Promise.all(cases)) {
      expect(r.ok).toBe(false);
      expect(r.error?.kind).toBe('refused');
      expect(typeof r.error?.message).toBe('string');
    }
  });

  it('keeps the fields the descriptor advertises instead of dropping them', async () => {
    const r = await human.add_person({ display_name: 'Mẹ', aka: ['Má'], note: 'the narrator' });
    expect(r.ok).toBe(true);

    const [p] = await query<{ aka: string[]; note: string }>(
      'SELECT aka, note FROM person WHERE id = $1',
      [(r.data as { person_id: string }).person_id],
    );
    expect(p.aka).toEqual(['Má']);
    expect(p.note).toBe('the narrator');
  });

  it('reports the certainty the row actually got, not a hardcoded one', async () => {
    const r = await human.add_memory_claim({
      subject_kind: 'person',
      subject_id: seed.grandmaId,
      predicate: 'occupation',
      object_text: 'thợ may',
    });
    // A human's claim defaults to 'uncertain'; a handler that always answered 'oral' would be
    // lying about what it wrote.
    expect((r.data as { certainty: string }).certainty).toBe('uncertain');
  });

  it('says a disagreement exists without saying which claim is right', async () => {
    const r = await agent.read_memory_graph({ subject_id: seed.grandmaId });
    expect(r.ok).toBe(true);

    const data = r.data as { disagreements: { claim_ids: string[]; resolution: string }[] };
    expect(data.disagreements).toHaveLength(1);
    expect(data.disagreements[0].claim_ids).toHaveLength(2);
    expect(data.disagreements[0].resolution).toContain('requires a person');

    const text = JSON.stringify(r.data).toLowerCase();
    for (const verdict of ['correct', 'wrong', 'should be', 'likely', 'probably']) {
      expect(text, `return value must not adjudicate ("${verdict}")`).not.toContain(verdict);
    }
  });

  it('flag_conflict returns the claims in dispute and no winner', async () => {
    const r = await agent.flag_conflict({
      subject_kind: 'person',
      subject_id: seed.grandmaId,
      predicate: 'moved_to',
    });
    const data = r.data as Record<string, unknown>;
    expect(data.conflicting_claim_ids).toHaveLength(2);
    expect(Object.keys(data)).not.toContain('winning_claim_id');
    expect(String(data.resolution)).toContain('requires a person');
  });
});

describe('TASK-023 — a story card cannot overstate itself', () => {
  it('carries the weakest label among the claims it stands on', async () => {
    // claim1972 is 'oral', claim1974 is 'document_supported'. The card gets 'oral'.
    const r = await agent.generate_story_card({
      subject_person_id: seed.grandmaId,
      claim_ids: [seed.claim1972, seed.claim1974],
      title_vi: 'Tiệm may của bà ngoại',
      title_en: "Grandma's tailor shop",
      body_vi: 'Bà ngoại lên Đà Nẵng và mở một tiệm may.',
      body_en: 'Grandma moved up to Đà Nẵng and opened a tailor shop.',
    });
    expect(r.ok).toBe(true);
    expect((r.data as { floor_certainty: string }).floor_certainty).toBe('oral');

    const [card] = await query<{ floor_certainty: string }>(
      'SELECT floor_certainty FROM story_card WHERE id = $1',
      [(r.data as { card_id: string }).card_id],
    );
    expect(card.floor_certainty).toBe('oral');
  });

  it('is not swayed by how well the card is written', async () => {
    const weak = await commands.addMemoryClaim(
      {
        subject_kind: 'person',
        subject_id: seed.grandmaId,
        predicate: 'occupation',
        object_text: 'thợ may',
      },
      HUMAN,
    );

    const r = await agent.generate_story_card({
      subject_person_id: seed.grandmaId,
      claim_ids: [weak, seed.claim1974],
      title_vi: 'Người thợ may tài hoa của Đà Nẵng',
      title_en: 'The finest tailor in Đà Nẵng',
      body_vi: 'Ai cũng biết tiếng bà.',
      body_en: 'Everyone knew her name.',
    });
    // One 'uncertain' claim drags the whole card down, however confident the prose.
    expect((r.data as { floor_certainty: string }).floor_certainty).toBe('uncertain');
  });

  it('refuses to cite a claim that does not exist', async () => {
    const r = await agent.generate_story_card({
      subject_person_id: seed.grandmaId,
      claim_ids: ['00000000-0000-0000-0000-000000000000'],
      title_vi: 'x',
      title_en: 'x',
      body_vi: 'x',
      body_en: 'x',
    });
    expect(r.ok).toBe(false);
    expect(r.error?.message).toContain('do not exist');

    const [{ n }] = await query<{ n: number }>('SELECT count(*)::int AS n FROM story_card');
    expect(n).toBe(0);
  });
});
