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
        void must(args ?? {});
        // TASK-010 — reads go through store/projection.ts, never straight to db.ts.
        throw new RefusedError('not implemented yet — see TASK-010');
      }),

    add_person: (args) =>
      guard(async () => {
        const a = must(args);
        const id = await commands.addPerson({ display_name: str(a, 'display_name') }, ctx);
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
            year_value: typeof a.year_value === 'number' ? a.year_value : undefined,
            year_precision: (a.year_precision as never) ?? undefined,
            object_place_id: str(a, 'object_place_id', false) || undefined,
            object_person_id: str(a, 'object_person_id', false) || undefined,
            object_text: str(a, 'object_text', false) || undefined,
          },
          ctx,
        );
        // The cap is part of the answer: tell the agent what label it actually got.
        return { claim_id: id, certainty: 'oral' };
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

    generate_story_card: () =>
      guard(async () => {
        throw new RefusedError('not implemented yet — see TASK-023');
      }),
  };
}
