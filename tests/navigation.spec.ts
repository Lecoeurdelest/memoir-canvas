/**
 * FR-BOOK-03 — the wedge holds on EVERY route, not just the one the demo happens to use.
 *
 * The turn control was guarded and the spine was not: `onClick={() => setAt(i)}` let a reader
 * jump straight past a tear the book had just refused, seconds after the refusal was staged. The
 * rule now lives in one pure function that both routes call, and these run it against a real
 * archive with a real conflict rather than against a fixture that cannot disagree with the DB.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import * as commands from '../src/domain/commands';
import { buildReadModel } from '../src/store/projection';
import { jumpTarget, nextIndex, reachLimit } from '../src/view/useSpreadNavigation';
import { loadSeed, type SeededArchive } from '../src/seed/loadSeed';
import type { Spread } from '../src/store/projection';

const HUMAN = { actor: 'human' as const, registeredBecause: 'test' };
const AGENT = { actor: 'agent' as const, registeredBecause: 'user has person open' };

let seed: SeededArchive;

beforeEach(async () => {
  await commands.resetArchive(HUMAN);
  seed = await loadSeed();
});

/** Flag the seeded disagreement, the way the agent does in step 6 of the core scenario. */
async function tearTheRoad(): Promise<Spread[]> {
  await commands.flagConflict(
    { subject_kind: 'person', subject_id: seed.grandmaId, predicate: 'moved_to' },
    AGENT,
  );
  return (await buildReadModel()).spreads;
}

describe('the road has somewhere to go', () => {
  it('offers more than one station before anything is torn', async () => {
    const { spreads } = await buildReadModel();
    expect(spreads.length).toBeGreaterThan(1);
    expect(reachLimit(spreads), 'nothing blocks an untorn archive').toBe(spreads.length - 1);
  });

  it('travels forward station by station while the way is clear', async () => {
    const { spreads } = await buildReadModel();
    let at = 0;
    for (let step = 0; step < spreads.length - 1; step++) at = nextIndex(spreads, at, 1);
    expect(at).toBe(spreads.length - 1);
  });
});

describe('the wedge refuses every route', () => {
  it('stops forward travel at the tear', async () => {
    const spreads = await tearTheRoad();
    expect(spreads[0].conflict, 'the first station is the torn one').not.toBeNull();

    expect(nextIndex(spreads, 0, 1), 'the turn control cannot pass').toBe(0);
    expect(reachLimit(spreads)).toBe(0);
  });

  it('stops the SPINE at the tear too — the bug this file exists for', async () => {
    const spreads = await tearTheRoad();

    // Every station beyond the tear is out of reach, however it is asked for.
    for (let target = 1; target < spreads.length; target++) {
      expect(jumpTarget(spreads, 0, target), `spine must not reach ${target}`).toBe(0);
    }
  });

  it('never traps the reader — backward is always allowed', async () => {
    const spreads = await tearTheRoad();
    expect(nextIndex(spreads, 0, -1), 'nowhere to go back to from the first').toBe(0);

    // Standing past a tear (it appeared while they were ahead), they can still retreat.
    const stranded = spreads.length - 1;
    expect(nextIndex(spreads, stranded, -1)).toBe(stranded - 1);
    expect(jumpTarget(spreads, stranded, 0), 'and jump back freely').toBe(0);
  });

  it('opens the way again once a person settles it', async () => {
    const torn = await tearTheRoad();
    const conflictId = torn[0].conflict!.id;
    expect(nextIndex(torn, 0, 1), 'blocked while open').toBe(0);

    await commands.resolveClaim(
      { conflict_id: conflictId, winning_claim_id: seed.claim1974, resolved_by: seed.uncleId },
      HUMAN,
    );

    const { spreads } = await buildReadModel();
    expect(spreads[0].conflict, 'the tear is gone').toBeNull();
    expect(nextIndex(spreads, 0, 1), 'and the road runs on').toBe(1);
    expect(reachLimit(spreads)).toBe(spreads.length - 1);
  });
});
