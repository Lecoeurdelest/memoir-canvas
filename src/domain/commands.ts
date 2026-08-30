/**
 * R2 — THE SINGLE WRITE DOOR.
 *
 * The "Confirm" button a person clicks and the resolve_claim tool an agent calls run the
 * SAME function here. There is no separate path for either. That is what makes this project
 * genuinely agent-native rather than an MCP server bolted onto a website — and it means a
 * check written once holds for both, and an audit row written once covers both.
 *
 * If you are about to write SQL somewhere else, stop. It belongs here.
 *
 * TASK-008, TASK-009, TASK-014
 */

import { AUDIT_INSERT, auditParams, type AuditInput } from './audit';
import { transaction, query, type Tx } from './db';
import type {
  ActorKind,
  Certainty,
  OpenDisagreement,
  SourceKind,
  Stance,
  SubjectKind,
  YearPrecision,
} from './types';

export interface CommandContext {
  actor: ActorKind;
  /** Why the caller was allowed to do this now — from the registry for agents, 'user action' for people. */
  registeredBecause: string;
}

/** Thrown when the data does not justify the write. Surfaces to the agent as a structured error. */
export class RefusedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RefusedError';
  }
}

/**
 * `crypto.randomUUID()` is `[SecureContext]`, so it is undefined over plain http — the origin
 * `vite dev --host` gives you when probing a phone. getRandomValues carries no such annotation.
 */
function uuid(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === 'function') return c.randomUUID();

  const b = new Uint8Array(16);
  c.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Postgres puts the violated constraint's name on the error object. NFR-OBS-04 wants it. */
function constraintNameOf(err: unknown): string | null {
  const c = (err as { constraint?: unknown } | null)?.constraint;
  return typeof c === 'string' && c.length > 0 ? c : null;
}

/**
 * NFR-OBS-02 — a refusal cannot be recorded in the transaction that just rolled back, so it gets
 * its own. Best-effort: never mask the original error with a logging failure.
 */
async function recordRefusal(
  audit: AuditInput,
  err: unknown,
  reason: string,
): Promise<void> {
  try {
    await transaction(audit.actor, async (tx) => {
      await tx.exec(
        AUDIT_INSERT,
        auditParams({
          ...audit,
          after: { outcome: 'refused', reason, constraint: constraintNameOf(err) },
        }),
      );
    });
  } catch {
    /* the refusal row is desirable, not load-bearing; never mask the original failure */
  }
}

/** One transaction carrying the write and its audit row; a failure still records the attempt. */
async function withAudit<T>(
  audit: AuditInput,
  work: (tx: Tx) => Promise<T>,
): Promise<T> {
  try {
    return await transaction(audit.actor, async (tx) => {
      const result = await work(tx);
      await tx.exec(AUDIT_INSERT, auditParams(audit));
      return result;
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await recordRefusal(audit, err, reason);
    throw err;
  }
}

/** Refuse before touching the database, and still leave a trace of the attempt. */
async function refuse(audit: AuditInput, reason: string): Promise<never> {
  const err = new RefusedError(reason);
  await recordRefusal(audit, err, reason);
  throw err;
}

// ─────────────────────────────── people and places ───────────────────────────────

export interface AddPersonInput {
  display_name: string;
  aka?: string[];
  note?: string;
}

export async function addPerson(input: AddPersonInput, ctx: CommandContext): Promise<string> {
  const id = uuid();
  await withAudit(
    {
      actor: ctx.actor,
      toolName: 'add_person',
      args: input,
      targetTable: 'person',
      targetId: id,
      after: input,
      registeredBecause: ctx.registeredBecause,
    },
    async (tx) => {
      await tx.exec(
        `INSERT INTO person (id, display_name, aka, note, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, input.display_name, input.aka ?? [], input.note ?? null, ctx.actor],
      );
    },
  );
  return id;
}

export interface AddPlaceInput {
  name: string;
  admin_area?: string;
  country?: string;
}

export async function addPlace(input: AddPlaceInput, ctx: CommandContext): Promise<string> {
  const id = uuid();
  await withAudit(
    {
      actor: ctx.actor,
      toolName: 'add_place',
      args: input,
      targetTable: 'place',
      targetId: id,
      after: input,
      registeredBecause: ctx.registeredBecause,
    },
    async (tx) => {
      await tx.exec(
        `INSERT INTO place (id, name, admin_area, country, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, input.name, input.admin_area ?? null, input.country ?? 'VN', ctx.actor],
      );
    },
  );
  return id;
}

// ──────────────────────────────────── claims ────────────────────────────────────

export interface AddClaimInput {
  subject_kind: SubjectKind;
  subject_id: string;
  predicate: string;
  object_person_id?: string;
  object_place_id?: string;
  object_text?: string;
  year_value?: number;
  year_min?: number;
  year_max?: number;
  year_precision?: YearPrecision;
  /**
   * Only a human may ask for a label, and only ever a weak one. Ignored for agents, who are
   * capped at 'oral' no matter what they send.
   */
  certainty?: Extract<Certainty, 'uncertain' | 'oral' | 'document_supported'>;
}

/** The strongest label this door can ever produce. 'conflicting' and 'confirmed' are not here. */
const ENTRY_CERTAINTIES = ['uncertain', 'oral', 'document_supported'] as const;

/**
 * Agents are capped at 'oral'. The database would also reject 'confirmed' without a
 * confirmed_by (claim_confirmed_needs_a_human), but refusing here too means the agent gets
 * a clear message instead of a constraint violation.
 *
 * A human may pick a weaker label — the seeded archive needs claim 1 to be 'oral' because it
 * came from a recollection — but no caller reaches 'conflicting' or 'confirmed' through this
 * door. Those two are only ever written by flagConflict and resolveClaim.
 */
export async function addMemoryClaim(input: AddClaimInput, ctx: CommandContext): Promise<string> {
  const id = uuid();
  const asked = input.certainty;
  const certainty: Certainty =
    ctx.actor === 'agent'
      ? 'oral'
      : asked && (ENTRY_CERTAINTIES as readonly string[]).includes(asked)
        ? asked
        : 'uncertain';

  await withAudit(
    {
      actor: ctx.actor,
      toolName: 'add_memory_claim',
      args: input,
      targetTable: 'claim',
      targetId: id,
      after: { ...input, certainty },
      registeredBecause: ctx.registeredBecause,
    },
    async (tx) => {
      await tx.exec(
        `INSERT INTO claim
           (id, subject_kind, subject_id, predicate, object_person_id, object_place_id,
            object_text, year_value, year_min, year_max, year_precision, certainty, asserted_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          id, input.subject_kind, input.subject_id, input.predicate,
          input.object_person_id ?? null, input.object_place_id ?? null,
          input.object_text ?? null, input.year_value ?? null,
          input.year_min ?? null, input.year_max ?? null,
          input.year_precision ?? null, certainty, ctx.actor,
        ],
      );
    },
  );
  return id;
}

// ─────────────────────────────── evidence and sources ───────────────────────────────

export interface LinkClaimToSourceInput {
  claim_id: string;
  stance: Stance;
  excerpt?: string;
  /**
   * A source already in the archive. One photograph bears on several claims — it supports the
   * 1974 date and contradicts the 1972 one — and it must stay ONE row, or the evidence panel
   * shows the same artefact twice as if two photographs had been found. Give this or `source`.
   */
  source_id?: string;
  source?: {
    kind: SourceKind;
    title: string;
    uri?: string;
    verbatim?: string;
    contributor_id?: string;
  };
  /**
   * Raise the claim to 'document_supported'. Only legitimate alongside a 'supports' stance, and
   * only in THIS transaction: claim_evidence_backed is DEFERRABLE INITIALLY DEFERRED, so the
   * trigger checks at COMMIT, by which time the evidence row below already exists. Written any
   * other way the write is refused — which is the point of the constraint.
   */
  upgrade_to_document_supported?: boolean;
}

export async function linkClaimToSource(
  input: LinkClaimToSourceInput,
  ctx: CommandContext,
): Promise<{ sourceId: string }> {
  if (input.upgrade_to_document_supported && input.stance !== 'supports') {
    throw new RefusedError(
      'a source that does not support a claim cannot raise its certainty',
    );
  }
  if (!input.source_id && !input.source) {
    throw new RefusedError('evidence needs a source: give source_id or a source to record');
  }

  const reusing = Boolean(input.source_id);
  const sourceId = input.source_id ?? uuid();

  await withAudit(
    {
      actor: ctx.actor,
      toolName: 'link_claim_to_source',
      args: input,
      targetTable: 'evidence',
      targetId: input.claim_id,
      after: { sourceId, stance: input.stance },
      registeredBecause: ctx.registeredBecause,
    },
    async (tx) => {
      if (!reusing) {
        const s = input.source!;
        await tx.exec(
          `INSERT INTO source (id, kind, title, uri, verbatim, contributor_id, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            sourceId, s.kind, s.title, s.uri ?? null, s.verbatim ?? null,
            s.contributor_id ?? null, ctx.actor,
          ],
        );
      }
      await tx.exec(
        `INSERT INTO evidence (claim_id, source_id, stance, excerpt, linked_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [input.claim_id, sourceId, input.stance, input.excerpt ?? null, ctx.actor],
      );
      if (input.upgrade_to_document_supported) {
        // Only ever upwards from a weak label, and never over 'conflicting' or 'confirmed':
        // those two belong to flagConflict and resolveClaim alone.
        await tx.exec(
          `UPDATE claim SET certainty = 'document_supported'
            WHERE id = $1 AND certainty IN ('uncertain', 'oral')`,
          [input.claim_id],
        );
      }
    },
  );

  return { sourceId };
}

// ─────────────────────────────────── conflicts ───────────────────────────────────

export interface FlagConflictInput {
  subject_kind: SubjectKind;
  subject_id: string;
  predicate: string;
}

/**
 * Reads v_open_disagreement — an eight-line view, not an inference engine, not an LLM.
 * If the view has no row, nothing is written at all: an agent may not conjure a conflict
 * out of nothing (FR-CONF-02).
 */
export async function flagConflict(
  input: FlagConflictInput,
  ctx: CommandContext,
): Promise<{ conflictId: string; claimIds: string[] }> {
  const conflictId = uuid();
  const audit: AuditInput = {
    actor: ctx.actor,
    toolName: 'flag_conflict',
    args: input,
    targetTable: 'conflict',
    targetId: conflictId,
    registeredBecause: ctx.registeredBecause,
  };

  const rows = await query<OpenDisagreement>(
    `SELECT * FROM v_open_disagreement
      WHERE subject_kind = $1 AND subject_id = $2 AND predicate = $3`,
    [input.subject_kind, input.subject_id, input.predicate],
  );

  if (rows.length === 0) {
    return refuse(
      audit,
      'no open disagreement exists for this subject and predicate — nothing was recorded',
    );
  }

  // One predicate can now carry several independent disagreements, and the frozen tool contract
  // has no object argument to tell them apart. An ambiguous instruction is not a licence to guess.
  if (rows.length > 1) {
    return refuse(
      audit,
      `this subject and predicate carry ${rows.length} separate disagreements — ` +
        'resolve them one at a time from the conflict view rather than as a group',
    );
  }

  const claimIds = rows[0].claim_ids;

  // One disagreement, one conflict row — otherwise the book tears twice over the same claims.
  const [{ n: alreadyOpen }] = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM conflict
      WHERE status = 'open' AND subject_kind = $1 AND subject_id = $2 AND predicate = $3`,
    [input.subject_kind, input.subject_id, input.predicate],
  );
  if (alreadyOpen > 0) {
    return refuse(audit, 'a conflict is already open for this subject and predicate');
  }

  await withAudit({ ...audit, after: { claimIds } }, async (tx) => {
    await tx.exec(
      `INSERT INTO conflict (id, subject_kind, subject_id, predicate, detected_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [conflictId, input.subject_kind, input.subject_id, input.predicate, ctx.actor],
    );
    for (const claimId of claimIds) {
      await tx.exec(`INSERT INTO conflict_member (conflict_id, claim_id) VALUES ($1, $2)`, [
        conflictId,
        claimId,
      ]);
      // A human decision stands until a human reopens it.
      await tx.exec(
        `UPDATE claim SET certainty = 'conflicting'
          WHERE id = $1 AND certainty <> 'confirmed'`,
        [claimId],
      );
    }
  });

  return { conflictId, claimIds };
}

export interface ResolveClaimInput {
  conflict_id: string;
  winning_claim_id: string;
  /** A person id. The database rejects the write without it. */
  resolved_by: string;
  resolution_note?: string;
}

/**
 * R2 in one function: the confirm button and the agent's resolve_claim tool both land here.
 *
 * Three layers stand between an agent and a fact, because any one could be got wrong again:
 * privilege (app_agent holds no UPDATE on claim.confirmed_by), constraint triggers
 * (conflict_resolution_coherent, claim_confirmed_by_a_human), and the readable refusals below.
 */
export async function resolveClaim(input: ResolveClaimInput, ctx: CommandContext): Promise<void> {
  const audit: AuditInput = {
    actor: ctx.actor,
    toolName: 'resolve_claim',
    args: input,
    targetTable: 'conflict',
    targetId: input.conflict_id,
    after: input,
    registeredBecause: ctx.registeredBecause,
  };

  if (!input.resolved_by) {
    return refuse(audit, 'resolving a conflict requires the id of the person who decided');
  }

  const [membership] = await query<{ is_member: boolean; is_open: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM conflict_member m
                    WHERE m.conflict_id = k.id AND m.claim_id = $2) AS is_member,
            (k.status = 'open')                                      AS is_open
       FROM conflict k WHERE k.id = $1`,
    [input.conflict_id, input.winning_claim_id],
  ) ?? [];

  if (!membership) {
    return refuse(audit, 'no such conflict');
  }
  if (!membership.is_open) {
    return refuse(audit, 'that conflict is already closed');
  }
  if (!membership.is_member) {
    return refuse(
      audit,
      'winning_claim_id is not one of the claims in this conflict — a claim cannot win a ' +
        'disagreement it was never part of',
    );
  }

  // add_person is a base tool, so without this the agent mints the witness that signs for its
  // own guess. Enforced again by claim_confirmed_by_a_human.
  const [signer] = await query<{ created_by: ActorKind }>(
    'SELECT created_by FROM person WHERE id = $1',
    [input.resolved_by],
  );
  if (!signer) {
    return refuse(audit, 'resolved_by does not name anyone in this archive');
  }
  if (signer.created_by !== 'human') {
    return refuse(
      audit,
      'resolved_by names a person the agent created — a fact needs someone a human entered',
    );
  }

  await withAudit(audit, async (tx) => {
    const closed = await tx.query<{ id: string }>(
      `UPDATE conflict
          SET status = 'resolved', winning_claim_id = $2, resolved_by = $3,
              resolution_note = $4, resolved_at = now()
        WHERE id = $1 AND status = 'open'
        RETURNING id`,
      [input.conflict_id, input.winning_claim_id, input.resolved_by, input.resolution_note ?? null],
    );
    // A zero-row UPDATE is not an error in Postgres — discarding that is how a bogus conflict id
    // used to fall through to the confirm below.
    if (closed.length === 0) {
      throw new RefusedError('the conflict was closed by someone else while you were deciding');
    }

    await tx.exec(
      `UPDATE claim
          SET certainty = 'confirmed', confirmed_by = $2, confirmed_at = now()
        WHERE id = $1
          AND id IN (SELECT claim_id FROM conflict_member WHERE conflict_id = $3)`,
      [input.winning_claim_id, input.resolved_by, input.conflict_id],
    );
    await tx.exec(
      `UPDATE claim SET status = 'superseded'
        WHERE id IN (SELECT claim_id FROM conflict_member WHERE conflict_id = $1)
          AND id <> $2`,
      [input.conflict_id, input.winning_claim_id],
    );
  });
}

export interface ProposeQuestionInput {
  conflict_id?: string;
  claim_id?: string;
  question_vi: string;
  question_en?: string;
  ask_person_id?: string;
}

export async function proposeFollowupQuestion(
  input: ProposeQuestionInput,
  ctx: CommandContext,
): Promise<string> {
  const id = uuid();
  const audit: AuditInput = {
    actor: ctx.actor,
    toolName: 'propose_followup_question',
    args: input,
    targetTable: 'followup_question',
    targetId: id,
    after: input,
    registeredBecause: ctx.registeredBecause,
  };

  if (!input.conflict_id && !input.claim_id) {
    return refuse(audit, 'a follow-up question must point at a conflict or a claim');
  }

  await withAudit(
    audit,
    async (tx) => {
      await tx.exec(
        `INSERT INTO followup_question
           (id, conflict_id, claim_id, question_vi, question_en, ask_person_id, proposed_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          id, input.conflict_id ?? null, input.claim_id ?? null,
          input.question_vi, input.question_en ?? null,
          input.ask_person_id ?? null, ctx.actor,
        ],
      );
    },
  );
  return id;
}

// TASK-023 generate_story_card — same shape as above.

// ──────────────────────────────── resetting the archive ────────────────────────────────

/**
 * True when the archive holds nothing yet. Lives here rather than in src/seed/ because R3 says
 * only this module and store/projection.ts may reach db.ts — a seed file importing the
 * connection would be exactly the back door the rule exists to keep shut.
 */
export async function isArchiveEmpty(): Promise<boolean> {
  const rows = await query<{ n: number }>('SELECT count(*)::int AS n FROM person');
  return rows[0].n === 0;
}

/** Every table, ordered so a plain TRUNCATE … CASCADE has nothing to complain about. */
const ALL_TABLES = [
  'audit_event', 'story_card', 'followup_question', 'conflict_member', 'conflict',
  'evidence', 'claim', 'source', 'place', 'person',
] as const;

/**
 * Wipe the archive so the seeded 1972-vs-1974 situation can be staged again.
 *
 * Why this exists: resolveClaim is a one-way transition. It closes the conflict and supersedes
 * the losing claim, so v_open_disagreement empties and the registry (R4) never offers
 * flag_conflict / propose_followup_question / resolve_claim again. Without a reset the demo core
 * runs exactly ONCE per browser profile — fine until you fluff a line recording the video, or a
 * judge opens the link a second time.
 *
 * Deliberately NOT a tool. It is absent from src/mcp/descriptors.ts and therefore unreachable
 * through R1's single door: an agent that can erase the evidence is the opposite of the point.
 * The guard below is belt and braces for a caller inside our own code.
 */
export async function resetArchive(ctx: CommandContext): Promise<void> {
  if (ctx.actor !== 'human') {
    throw new RefusedError('only a person may reset the archive');
  }

  await transaction(ctx.actor, async (tx) => {
    // No RESTART IDENTITY: app_human has TRUNCATE but does not own the sequences. Letting
    // audit_event.id keep climbing is better anyway — an id is never reused across resets.
    await tx.exec(`TRUNCATE ${ALL_TABLES.join(', ')} CASCADE`);
    // Written after the truncate, so the fresh log opens by saying what happened to the old one
    // rather than starting with an unexplained silence.
    await tx.exec(
      AUDIT_INSERT,
      auditParams({
        actor: ctx.actor,
        toolName: 'reset_archive',
        args: {},
        registeredBecause: ctx.registeredBecause,
      }),
    );
  });
}
