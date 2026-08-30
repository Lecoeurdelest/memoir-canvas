---
task: TASK-009
status: done
date: 2026-08-30
author: Lecoeurdelest
---

# IMPL-TASK-009 — Audit logging

## What was built

`withAudit()` in `src/domain/commands.ts` wraps every write: one transaction carrying both the
change and its `audit_event` row, assumed as the caller's role. A failure rolls both back and
then opens a **second** transaction to record that the attempt happened, why, and which named
constraint fired. `refuse()` does the same for refusals raised before the database is touched,
so an agent inventing a conflict still leaves a trace. `stamp_actor()` triggers in `schema.sql`
set `audit_event.actor` from `current_user` rather than from what the caller passed.

## Acceptance criteria

- [x] A rollback loses both the command and the audit row — no orphaned audit
- [x] An operation blocked by a constraint still leaves a trace
- [x] The sequence of what happened can be reconstructed from the audit table

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-009-junit.xml` — 5 audit cases in `tests/conflict.spec.ts` |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — 12/12 |
| Browser | 7 refusal rows recorded through the real command layer in Chrome 151 |

## Deviations

The requirement said the audit row lives "in the same transaction as the write". That is still
true for successful writes, but it is exactly what made refusals unrecordable: a constraint
violation rolled the row back along with the write, so every blocked attempt vanished. Refusals
therefore go in their own transaction, immediately after the rollback. `NFR-OBS-02` and
`docs/API_SCHEMA.md` were amended in the same commit to say so.

The reason and constraint name are stored in the existing `after jsonb` column as
`{outcome, reason, constraint}`. No new column, so the schema shape freeze holds.

`recordRefusal()` is best-effort: if writing the refusal row itself fails it is swallowed, because
masking the original error would be worse than losing the log line.

## Known gaps

- `audit_event.before` is never populated. Nothing reads it yet, but an audit panel showing what
  a value changed *from* will need it.
- Refusals raised inside `src/mcp/handlers.ts` argument validation (`must()`, `str()`) throw
  before reaching the command layer, so they are not audited. Fold this in with the SEC-01
  descriptor-driven validator.
- No UI reads the table — `TASK-024` (audit panel) is what makes this visible to a judge.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | untouched |
| R2 — shared write door | ☑ | auditing lives in `withAudit`, which both the human path and the tool path go through; neither can write without it |
| R3 — only the command layer touches the database | ☑ | `recordRefusal` uses `transaction()` from `domain/db.ts`, called only from `commands.ts` |
| R4 — the registry is a pure function | ☐ | untouched |
| R5 — the view layer is read-only | ☐ | untouched |

## Files changed

- `src/domain/commands.ts`
- `src/domain/schema.sql` — `stamp_actor()` triggers
- `docs/API_SCHEMA.md`
- `docs/requirements/non-functional/NFR-OBS-observability.md`
- `tests/conflict.spec.ts`
