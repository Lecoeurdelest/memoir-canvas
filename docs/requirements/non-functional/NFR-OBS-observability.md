---
id: NFR-OBS
title: Observability
type: non-functional
status: draft
---

# NFR-OBS — Observability

## Intent

The audit trail is not a side feature — it is the evidence for what the project argues, and it is what a judge opens.

## Requirements

| ID | Requirement |
|---|---|
| `NFR-OBS-01` | Every successful write tool call writes an `audit_event` with `tool_name`, `args`, `actor` and `registered_because`. |
| `NFR-OBS-02` | Refused operations are recorded too, with the reason: an `audit_event` row whose `after` jsonb is `{"outcome":"refused","reason":<message>,"constraint":<name or null>}`. This covers all three refusal paths — argument validation in the handler, a `RefusedError` raised before the write, and a database constraint that rolls the write back. Because the row cannot survive a transaction that must roll back, it is written in its own transaction immediately afterwards. **No change to `schema.sql` is required.** |
| `NFR-OBS-03` | The audit panel is readable by a non-technical person, not a JSON dump. |
| `NFR-OBS-04` | Constraint errors surface the constraint name, which is why constraint names are written as meaningful sentences. This applies to CHECK and foreign-key violations, where the name is available programmatically as `err.constraint`. The one rule enforced by a constraint *trigger* (`claim_evidence_backed`) raises SQLSTATE P0001 and carries no constraint name; its `RAISE` message is written as a full sentence and surfaced verbatim instead. |

## Acceptance

Come back to the log after the demo and reconstruct exactly what happened.

## Related

- `FR-AUDIT-audit-trail`

## Amended 2026-08-30

- **-02** was not merely unbuilt, it was silently false: `RefusedError` is thrown *before*
  `withAudit` runs, and a constraint violation rolls the audit row back along with the write. Every
  refusal in a browser run left no trace. Two mechanisms were prototyped on the live database
  (`SET CONSTRAINTS ALL IMMEDIATE` + `SAVEPOINT`, and a second transaction after `ROLLBACK`); the
  requirement now names the storage shape so it cannot be quietly skipped again.
- **-04** the constraint-trigger case genuinely has no name to surface. Stated rather than left to
  be discovered mid-demo.
