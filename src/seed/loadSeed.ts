/**
 * TASK-007 — load the sample archive THROUGH the command layer, never as raw INSERTs.
 *
 * If a constraint blocks the seed, either the constraint is wrong or the seed is. Do not relax
 * the constraint to make seeding work — that is how the project's argument erodes.
 *
 * The content staged here is specified in src/seed/family.sql. That file stays the spec; this
 * file decides the ORDER of commands. Everything below is fiction (NFR-PRIV-05).
 */

import * as commands from '../domain/commands';
import type { CommandContext } from '../domain/commands';

const SEED_CTX: CommandContext = { actor: 'human', registeredBecause: 'seeding sample archive' };

export interface SeededArchive {
  grandmaId: string;
  uncleId: string;
  motherId: string;
  daNangId: string;
  hoiAnId: string;
  /** The 1972 recollection. */
  claim1972: string;
  /** The 1974 claim the photograph carries. */
  claim1974: string;
}

/**
 * True when the archive holds nothing yet, so boot can seed without clobbering real work.
 * Delegates to the command layer: R3 keeps db.ts out of reach from here.
 */
export const isEmpty = commands.isArchiveEmpty;

/**
 * Stage the exact demo situation: one recollection saying 1972, one photograph saying 1974.
 *
 * Note what is NOT done here. No conflict row is written, and nothing is marked 'conflicting'.
 * The disagreement is left latent in the data for `v_open_disagreement` to notice and for the
 * agent to flag with `flag_conflict` — that is steps 5-6 of the core scenario, and pre-baking
 * it would hollow out the demo.
 */
export async function loadSeed(): Promise<SeededArchive> {
  // ── the family ──────────────────────────────────────────────────────────────
  const grandmaId = await commands.addPerson(
    { display_name: 'Bà ngoại', aka: ['Bà'], note: 'The subject of the story.' }, SEED_CTX);
  const uncleId = await commands.addPerson(
    { display_name: 'Cậu Ba', note: 'The person who can settle the year.' }, SEED_CTX);
  const motherId = await commands.addPerson(
    { display_name: 'Mẹ', note: 'The person recounting.' }, SEED_CTX);

  // ── places ──────────────────────────────────────────────────────────────────
  const hoiAnId = await commands.addPlace({ name: 'Hội An', admin_area: 'Quảng Nam' }, SEED_CTX);
  const daNangId = await commands.addPlace({ name: 'Đà Nẵng', admin_area: 'Đà Nẵng' }, SEED_CTX);

  // ── claim 1 — what was said out loud ────────────────────────────────────────
  // 'circa', not 'exact': the speaker said "khoảng năm 1972" (around 1972). Rounding vagueness
  // into precision is the exact failure the project exists to prevent.
  const claim1972 = await commands.addMemoryClaim(
    {
      subject_kind: 'person',
      subject_id: grandmaId,
      predicate: 'moved_to',
      object_place_id: daNangId,
      year_value: 1972,
      year_precision: 'circa',
      certainty: 'oral',
    },
    SEED_CTX,
  );

  const oralAccount = await commands.linkClaimToSource(
    {
      claim_id: claim1972,
      stance: 'supports',
      excerpt: 'khoảng năm 1972',
      source: {
        kind: 'oral_account',
        title: 'Lời kể của Mẹ',
        verbatim: 'Bà ngoại lên Đà Nẵng khoảng năm 1972, mở một tiệm may.',
        contributor_id: motherId,
      },
    },
    SEED_CTX,
  );

  // ── claim 2 — what the photograph says ──────────────────────────────────────
  const claim1974 = await commands.addMemoryClaim(
    {
      subject_kind: 'person',
      subject_id: grandmaId,
      predicate: 'moved_to',
      object_place_id: daNangId,
      year_value: 1974,
      year_precision: 'exact',
    },
    SEED_CTX,
  );

  // The photograph supports 1974 and, in the same transaction, earns claim 2 the
  // 'document_supported' label. claim_evidence_backed is DEFERRABLE, so the trigger checks at
  // COMMIT — after the evidence row exists. Any other ordering is refused.
  const photo = await commands.linkClaimToSource(
    {
      claim_id: claim1974,
      stance: 'supports',
      excerpt: 'mặt sau ghi 1974',
      source: {
        kind: 'photo',
        title: 'Ảnh tiệm may',
        verbatim: 'mặt sau ghi 1974',
        contributor_id: uncleId,
      },
      upgrade_to_document_supported: true,
    },
    SEED_CTX,
  );

  // ── where the disagreement is born ──────────────────────────────────────────
  // THE SAME photograph — reused by id, not recorded a second time. It supports 1974 and
  // contradicts 1972, which is precisely why one artefact can start a family argument.
  // Recorded, not silently discarded, and nobody has decided anything yet.
  await commands.linkClaimToSource(
    {
      claim_id: claim1972,
      stance: 'contradicts',
      excerpt: 'mặt sau ghi 1974',
      source_id: photo.sourceId,
    },
    SEED_CTX,
  );

  void oralAccount;

  return { grandmaId, uncleId, motherId, daNangId, hoiAnId, claim1972, claim1974 };
}

/**
 * Wipe and re-stage. This is what a reset button calls, and it is why the demo core survives a
 * fluffed take: resolveClaim is one-way, so without this the chain runs once per browser profile.
 */
export async function reseed(): Promise<SeededArchive> {
  await commands.resetArchive({ actor: 'human', registeredBecause: 'resetting the archive' });
  return loadSeed();
}

/** Seed only when there is nothing to lose. Safe to call on every boot. */
export async function seedIfEmpty(): Promise<SeededArchive | null> {
  return (await commands.isArchiveEmpty()) ? loadSeed() : null;
}
