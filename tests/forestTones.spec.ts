/**
 * TASK-048 — the owner's firefly language, checked against a real archive.
 *
 * White is an empty place you can press to write; orange-red is a story in open conflict; green
 * is a told story and brighter green is a longer one. The picture changed its first question —
 * certainty must still be announced (forest.spec.ts pins that), and the conflict colour must
 * stay the exact orange the badges call `conflicting`, so the forest and the cards can never
 * disagree about what a contradiction looks like.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import * as commands from '../src/domain/commands';
import { NIGHT_PALETTE } from '../src/panels/CertaintyBadge';
import { buildReadModel } from '../src/store/projection';
import { loadSeed, type SeededArchive } from '../src/seed/loadSeed';
import {
  FIREFLY_TONES,
  storyColour,
  storyGlow,
  storyLength,
  toneOf,
} from '../src/view/forestLayout';

const HUMAN = { actor: 'human' as const, registeredBecause: 'test' };
const AGENT = { actor: 'agent' as const, registeredBecause: 'user has person open' };

let seed: SeededArchive;

beforeEach(async () => {
  await commands.resetArchive(HUMAN);
  seed = await loadSeed();
});

describe('the three tones', () => {
  it('keeps the conflict orange identical to the badge palette', () => {
    expect(FIREFLY_TONES.conflict).toBe(NIGHT_PALETTE.conflicting);
  });

  it('calls a calm memory a story and a torn one a conflict', async () => {
    const before = (await buildReadModel()).spreads[0];
    expect(toneOf(before)).toBe('story');

    await commands.flagConflict(
      { subject_kind: 'person', subject_id: seed.grandmaId, predicate: 'moved_to' },
      AGENT,
    );
    const after = (await buildReadModel()).spreads[0];
    expect(toneOf(after)).toBe('conflict');
  });
});

describe('brighter green is a longer story', () => {
  it('counts the cards written over a memory, not just its claims', async () => {
    const { spreads, cards } = await buildReadModel();
    const carded = spreads.find((s) =>
      cards.some((card) => card.claim_ids.some((id) => s.claims.some((c) => c.id === id))),
    );
    const bare = spreads.find(
      (s) => !cards.some((card) => card.claim_ids.some((id) => s.claims.some((c) => c.id === id))),
    );
    if (!carded || !bare) return; // the seed currently carries both; guard against reseeding
    expect(storyLength(carded, cards)).toBeGreaterThan(storyLength(bare, cards));
  });

  it('glow grows with length and stays inside its floor and ceiling', () => {
    let previous = 0;
    for (const length of [0, 10, 100, 400, 1200, 5000, 50000]) {
      const glow = storyGlow(length);
      expect(glow).toBeGreaterThanOrEqual(0.35);
      expect(glow).toBeLessThanOrEqual(1);
      expect(glow).toBeGreaterThanOrEqual(previous);
      previous = glow;
    }
  });

  it('never lets a bare memory go dark', () => {
    expect(storyGlow(0)).toBeGreaterThan(0.3);
  });

  it('moves only luminance, never out of the green family', () => {
    const channels = (hex: string): [number, number, number] => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    let previousSum = 0;
    for (const glow of [0.35, 0.5, 0.7, 0.85, 1]) {
      const [r, g, b] = channels(storyColour(glow));
      expect(g).toBeGreaterThan(r);
      expect(g).toBeGreaterThan(b);
      expect(r + g + b).toBeGreaterThanOrEqual(previousSum);
      previousSum = r + g + b;
    }
  });

  it('lands the longest story on the brightest green the badges already use for confirmed', () => {
    expect(storyColour(1)).toBe('#b8e878');
  });
});
