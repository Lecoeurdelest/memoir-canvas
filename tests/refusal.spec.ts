/**
 * TASK-036 — the page that will not turn, checked at the layer the page actually calls.
 *
 * The rendering is DOM and this repo has none in its test environment, so what is pinned here is
 * everything the page depends on being true: that the refusal cannot exist without an open
 * conflict, that neither claim is marked a winner while it is open, and that the button a person
 * presses reaches a function the agent is refused at.
 *
 * That last one is the whole project in one assertion, and it is enforced by Postgres rather than
 * by this component — which is exactly why the page is allowed to be as friendly as it likes.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import * as commands from '../src/domain/commands';
import { LANGS, resources } from '../src/i18n';
import { buildReadModel } from '../src/store/projection';
import { loadSeed, type SeededArchive } from '../src/seed/loadSeed';

const HUMAN = { actor: 'human' as const, registeredBecause: 'a person put their name to a year' };
const AGENT = { actor: 'agent' as const, registeredBecause: 'user has conflict open' };

let seed: SeededArchive;

beforeEach(async () => {
  await commands.resetArchive(HUMAN);
  seed = await loadSeed();
});

async function flag(): Promise<string> {
  await commands.flagConflict(
    { subject_kind: 'person', subject_id: seed.grandmaId, predicate: 'moved_to' },
    AGENT,
  );
  const { spreads } = await buildReadModel();
  return spreads[0].conflict!.id;
}

describe('the refusal is a consequence of state, never a decoration', () => {
  it('does not exist until a conflict is open', async () => {
    const { spreads } = await buildReadModel();
    expect(spreads.every((s) => s.conflict === null)).toBe(true);
  });

  it('appears the moment one is flagged, on that spread and no other', async () => {
    await flag();
    const { spreads } = await buildReadModel();
    expect(spreads.filter((s) => s.conflict !== null)).toHaveLength(1);
    expect(spreads[0].conflict).not.toBeNull();
  });

  it('is gone the moment a person settles it', async () => {
    const conflictId = await flag();
    await commands.resolveClaim(
      { conflict_id: conflictId, winning_claim_id: seed.claim1974, resolved_by: seed.uncleId },
      HUMAN,
    );
    const { spreads } = await buildReadModel();
    expect(spreads.every((s) => s.conflict === null)).toBe(true);
    expect(spreads[0].resolvedBy?.display_name).toBe('Cậu Ba');
  });
});

describe('neither claim is favoured', () => {
  it('puts both on the page with nothing marking a winner', async () => {
    await flag();
    const { spreads } = await buildReadModel();
    const torn = spreads[0];

    expect(torn.claims.length).toBeGreaterThan(1);
    // Not one of them carries a confirmation while the page is refusing. If one did, the layout
    // could not help but favour it, however even the grid.
    expect(torn.claims.every((c) => c.confirmed_by === null)).toBe(true);
    expect(torn.conflict!.winning_claim_id).toBeNull();
  });
});

describe('the button a person presses', () => {
  it('reaches a function the agent is refused at, and the refusal is recorded', async () => {
    const conflictId = await flag();
    const before = await buildReadModel();

    await expect(
      commands.resolveClaim(
        { conflict_id: conflictId, winning_claim_id: seed.claim1974, resolved_by: seed.uncleId },
        AGENT,
      ),
    ).rejects.toThrow();

    const after = await buildReadModel();
    expect(after.spreads[0].conflict, 'the agent must not have settled it').not.toBeNull();
    expect(after.audit.length, 'a refusal is still an event').toBeGreaterThan(before.audit.length);
  });

  it('succeeds for a person, and writes the name into the record', async () => {
    const conflictId = await flag();
    await commands.resolveClaim(
      { conflict_id: conflictId, winning_claim_id: seed.claim1974, resolved_by: seed.uncleId },
      HUMAN,
    );
    const { claims } = await buildReadModel();
    const winner = claims.find((c) => c.id === seed.claim1974);
    expect(winner?.certainty).toBe('confirmed');
    expect(winner?.confirmed_by).toBe(seed.uncleId);
  });
});

describe('what the page says', () => {
  it('names the refusal and the gesture in both languages', async () => {
    for (const lng of LANGS) {
      const refused = resources[lng].translation.refused as Record<string, string>;
      expect(refused.heading, `${lng} heading`).toBeTruthy();
      expect(refused.cannotTurn, `${lng} foot`).toBeTruthy();
      // The label is what a screen reader hears in place of seeing a name land on a year.
      expect(refused.putNameOn, `${lng} drop label`).toContain('{{name}}');
      expect(refused.putNameOn, `${lng} drop label`).toContain('{{year}}');
    }
  });
});
