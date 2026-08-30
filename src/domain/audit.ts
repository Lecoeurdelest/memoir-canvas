/**
 * FR-AUDIT — every tool call leaves exactly one row, including calls that were refused.
 *
 * "The agent tried and was blocked" is the most valuable line in the whole log: it is the
 * evidence that the constraints are real. Never swallow it.
 *
 * This module is called only from commands.ts, always inside the same transaction as the
 * write it describes (R3). An audit row that outlives a rolled-back write, or a write
 * without an audit row, are both bugs.
 */

import type { ActorKind } from './types';

export interface AuditInput {
  actor: ActorKind;
  toolName: string;
  args: unknown;
  targetTable?: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  /** Why this tool was available at call time — comes from the registry (R4). */
  registeredBecause: string;
}

export const AUDIT_INSERT = `
  INSERT INTO audit_event
    (actor, tool_name, args, target_table, target_id, before, after, registered_because)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
`;

export function auditParams(a: AuditInput): unknown[] {
  return [
    a.actor,
    a.toolName,
    JSON.stringify(a.args ?? {}),
    a.targetTable ?? null,
    a.targetId ?? null,
    a.before === undefined ? null : JSON.stringify(a.before),
    a.after === undefined ? null : JSON.stringify(a.after),
    a.registeredBecause,
  ];
}
