---
id: TASK-009
title: Audit logging
branch: B
day: 2
depends_on: [TASK-008]
status: done
---

# TASK-009 — Audit logging

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 2 |
| **Depends on** | `TASK-008` |
| **Requirements** | [`FR-AUDIT`](../requirements/functional/FR-AUDIT-audit-trail.md), [`NFR-OBS`](../requirements/non-functional/NFR-OBS-observability.md) |

## Goal

Every write leaves exactly one `audit_event`, including writes that were refused.

## In scope

- written in the same transaction as the command
- `registered_because` supplied by the registry
- `before` / `after` JSON for mutations
- refused operations recorded too, with the reason

## Out of scope

- —

## Acceptance criteria

- [x] A rollback loses both the command and the audit row — no orphaned audit
- [x] An operation blocked by a constraint still leaves a trace
- [x] The sequence of what happened can be reconstructed from the audit table

## Files touched

- `src/domain/commands.ts`
- `src/domain/audit.ts`

## Notes

“The agent tried and was blocked” is the most valuable line in the log for the pitch — do not swallow it.

## When it is done

1. `npm run typecheck` · `npm test` · `npm run db:verify`
2. `npm run test:evidence -- TASK-009`
3. Write `docs/implement/IMPL-TASK-009.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
