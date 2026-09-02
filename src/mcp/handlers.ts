/**
 * R1 + R2 meet here. Handlers validate arguments and delegate — nothing else.
 *
 * There is no SQL in this file, and there must never be. A thin handler is the sign the
 * architecture is intact; a handler that grew a query is the first crack.
 *
 * Return values carry facts and certainty. They do NOT carry a verdict: flag_conflict tells
 * the agent two claims disagree, never which one is right.
 *
 * TASK-011
 */

import * as commands from '../domain/commands';
import { buildReadModel } from '../store/projection';
import { RefusedError } from '../domain/commands';
import type { ToolName } from './descriptors';
import type { CommandContext } from '../domain/commands';

export interface ToolResult {
  ok: boolean;
  data?: unknown;
  error?: { kind: 'refused' | 'invalid_input' | 'internal'; message: string };
}

function must(args: unknown): Record<string, unknown> {
  if (typeof args !== 'object' || args === null) {
    throw new RefusedError('tool arguments must be an object');
  }
  return args as Record<string, unknown>;
}

function strArray(o: Record<string, unknown>, key: string): string[] | undefined {
  const v = o[key];
  if (v === undefined) return undefined;
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
    throw new RefusedError(`"${key}" must be an array of strings`);
  }
  return v as string[];
}

function int(o: Record<string, unknown>, key: string): number | undefined {
  const v = o[key];
  if (v === undefined) return undefined;
  if (typeof v !== 'number' || !Number.isInteger(v)) {
    throw new RefusedError(`"${key}" must be an integer`);
  }
  return v;
}

function str(o: Record<string, unknown>, key: string, required = true): string {
  const v = o[key];
  if (typeof v === 'string' && v.length > 0) return v;
  if (!required) return '';
  throw new RefusedError(`missing or invalid "${key}"`);
}

async function guard(work: () => Promise<unknown>): Promise<ToolResult> {
  try {
    return { ok: true, data: await work() };
  } catch (err) {
    if (err instanceof RefusedError) {
      return { ok: false, error: { kind: 'refused', message: err.message } };
    }
    return {
      ok: false,
      error: { kind: 'internal', message: err instanceof Error ? err.message : String(err) },
    };
  }
}

export type Handlers = Record<ToolName, (args: unknown) => Promise<ToolResult>>;

export function makeHandlers(ctx: CommandContext): Handlers {
  return {
    read_memory_graph: (args) =>
      guard(async () => {
        const a = must(args ?? {});
        const subject = str(a, 'subject_id', false) || undefined;
        // Reads go through store/projection.ts, never straight to db.ts (R3).
        const m = await buildReadModel();

        const claims = subject ? m.claims.filter((c) => c.subject_id === subject) : m.claims;
        const keep = new Set(claims.map((c) => c.id));

        const conflicts = m.conflicts.filter((conflict) => !subject || conflict.subject_id === subject);
        const conflictIds = new Set(conflicts.map((conflict) => conflict.id));
        const questions = m.questions.filter(
          (question) =>
            !subject ||
            (question.claim_id !== null && keep.has(question.claim_id)) ||
            (question.conflict_id !== null && conflictIds.has(question.conflict_id)),
        );
        const evidence = m.evidence.filter((row) => keep.has(row.claim_id));
        const sourceIds = new Set(evidence.map((row) => row.source_id));
        const cards = m.cards.filter((card) => card.claim_ids.some((id) => keep.has(id)));

        return {
          // Keep the family list available: the agent needs real ids when it proposes who to ask.
          people: m.people,
          places: m.places,
          // Every claim carries its label. Nothing here says which of two claims is right.
          claims: claims.map((c) => ({
            id: c.id,
            subject_id: c.subject_id,
            predicate: c.predicate,
            object_person_id: c.object_person_id,
            object_place_id: c.object_place_id,
            object_text: c.object_text,
            year_value: c.year_value,
            year_precision: c.year_precision,
            certainty: c.certainty,
            status: c.status,
            asserted_by: c.asserted_by,
            confirmed_by: c.confirmed_by,
          })),
          evidence,
          sources: m.sources.filter((source) => sourceIds.has(source.id)),
          questions,
          story_cards: cards,
          open_conflicts: conflicts
            .filter((k) => k.status === 'open')
            .map((k) => ({ id: k.id, subject_id: k.subject_id, predicate: k.predicate })),
          disagreements: m.disagreements
            .filter((d) => !subject || d.subject_id === subject)
            .map((d) => ({
              subject_id: d.subject_id,
              predicate: d.predicate,
              claim_ids: d.claim_ids.filter((c) => !subject || keep.has(c)),
              resolution: 'requires a person — no tool available to you can settle this',
            })),
          next_step:
            cards.length > 0
              ? 'ask the family to review the draft against its cited sources before keeping it'
              : questions.some((question) => question.status === 'answered')
              ? 'read the attributed answer and offer a cited bilingual draft; do not confirm it'
              : 'if evidence conflicts, ask a claim-linked question for a named family member',
        };
      }),

    add_person: (args) =>
      guard(async () => {
        const a = must(args);
        const id = await commands.addPerson(
          {
            display_name: str(a, 'display_name'),
            aka: strArray(a, 'aka'),
            note: str(a, 'note', false) || undefined,
          },
          ctx,
        );
        return { person_id: id };
      }),

    add_memory_claim: (args) =>
      guard(async () => {
        const a = must(args);
        const id = await commands.addMemoryClaim(
          {
            subject_kind: str(a, 'subject_kind') as never,
            subject_id: str(a, 'subject_id'),
            predicate: str(a, 'predicate'),
            year_value: int(a, 'year_value'),
            year_min: int(a, 'year_min'),
            year_max: int(a, 'year_max'),
            year_precision: (a.year_precision as never) ?? undefined,
            object_place_id: str(a, 'object_place_id', false) || undefined,
            object_person_id: str(a, 'object_person_id', false) || undefined,
            object_text: str(a, 'object_text', false) || undefined,
          },
          ctx,
        );
        // Read the label back rather than asserting it: a handler that reports 'oral' while the
        // row says otherwise is the same class of lie the audit trail exists to prevent.
        const [written] = await commands.claimCertainty(id);
        return { claim_id: id, certainty: written };
      }),

    link_claim_to_source: (args) =>
      guard(async () => {
        const a = must(args);
        const src = a.source;
        if (typeof src !== 'object' || src === null) {
          throw new RefusedError('missing or invalid "source"');
        }
        const s = src as Record<string, unknown>;
        const { sourceId } = await commands.linkClaimToSource(
          {
            claim_id: str(a, 'claim_id'),
            stance: str(a, 'stance') as never,
            excerpt: str(a, 'excerpt', false) || undefined,
            source: {
              kind: str(s, 'kind') as never,
              title: str(s, 'title'),
              uri: str(s, 'uri', false) || undefined,
              verbatim: str(s, 'verbatim', false) || undefined,
              contributor_id: str(s, 'contributor_id', false) || undefined,
            },
          },
          ctx,
        );
        // Facts, not a verdict: the stance is recorded, never adjudicated.
        return { source_id: sourceId, stance: a.stance };
      }),

    flag_conflict: (args) =>
      guard(async () => {
        const a = must(args);
        const { conflictId, claimIds } = await commands.flagConflict(
          {
            subject_kind: str(a, 'subject_kind') as never,
            subject_id: str(a, 'subject_id'),
            predicate: str(a, 'predicate'),
          },
          ctx,
        );
        // Facts, not a verdict. Deliberately says nothing about which claim wins.
        return {
          conflict_id: conflictId,
          conflicting_claim_ids: claimIds,
          resolution: 'requires a person — no tool available to you can settle this',
        };
      }),

    propose_followup_question: (args) =>
      guard(async () => {
        const a = must(args);
        const id = await commands.proposeFollowupQuestion(
          {
            conflict_id: str(a, 'conflict_id', false) || undefined,
            claim_id: str(a, 'claim_id', false) || undefined,
            question_vi: str(a, 'question_vi'),
            question_en: str(a, 'question_en', false) || undefined,
            ask_person_id: str(a, 'ask_person_id', false) || undefined,
          },
          ctx,
        );
        return { question_id: id, status: 'open' };
      }),

    resolve_claim: (args) =>
      guard(async () => {
        const a = must(args);
        await commands.resolveClaim(
          {
            conflict_id: str(a, 'conflict_id'),
            winning_claim_id: str(a, 'winning_claim_id'),
            resolved_by: str(a, 'resolved_by'),
            resolution_note: str(a, 'resolution_note', false) || undefined,
          },
          ctx,
        );
        return { status: 'resolved' };
      }),

    generate_story_card: (args) =>
      guard(async () => {
        const a = must(args);
        const ids = a.claim_ids;
        if (!Array.isArray(ids) || ids.some((v) => typeof v !== 'string')) {
          throw new RefusedError('"claim_ids" must be an array of claim ids');
        }
        const { cardId, floorCertainty } = await commands.generateStoryCard(
          {
            subject_person_id: str(a, 'subject_person_id'),
            claim_ids: ids as string[],
            title_vi: str(a, 'title_vi'),
            title_en: str(a, 'title_en'),
            body_vi: str(a, 'body_vi'),
            body_en: str(a, 'body_en'),
          },
          ctx,
        );
        // The label is computed from the claims, not chosen. Say so, so the agent cannot believe
        // it picked one.
        return {
          card_id: cardId,
          floor_certainty: floorCertainty,
          note: 'floor_certainty is the weakest certainty among the claims cited; it is not yours to set',
        };
      }),
  };
}
