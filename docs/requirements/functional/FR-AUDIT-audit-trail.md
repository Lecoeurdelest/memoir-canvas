---
id: FR-AUDIT
title: Audit trail
type: functional
status: draft
---

# FR-AUDIT — Audit trail

## Intent

Every operation leaves a readable trace, including operations that were refused.

## Requirements

| ID | Requirement |
|---|---|
| `FR-AUDIT-01` | Every successful write tool call writes exactly one `audit_event`. |
| `FR-AUDIT-02` | The write and its `audit_event` are in the **same transaction** — a rollback loses both. |
| `FR-AUDIT-03` | `registered_because` records the UI context that made the tool available. |
| `FR-AUDIT-04` | `before` / `after` hold JSON snapshots for mutations. |
| `FR-AUDIT-05` | The audit panel shows the log chronologically, filterable by tool. |
| `FR-AUDIT-06` | Refused operations are recorded too, with the reason. |

## Acceptance

This requirement is met when every row above has at least one corresponding test, and that
test appears in some `docs/implement/evidence/TASK-*-junit.xml`.

## Related

- `docs/technical/03-webmcp-integration.md`
- `NFR-OBS-observability`
