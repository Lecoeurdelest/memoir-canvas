---
id: FR-CONF
title: Conflicts
type: functional
status: draft
---

# FR-CONF — Conflicts

## Intent

When two assertions cannot both be true, the system records that as a row with an id and a history — it does not quietly pick a side.

## Requirements

| ID | Requirement |
|---|---|
| `FR-CONF-01` | The view `v_open_disagreement` detects multiple distinct `year_value`s for the same (subject, predicate) among `active` claims. |
| `FR-CONF-02` | `flag_conflict` only writes when that view has a matching row. No row → throw, write nothing. |
| `FR-CONF-03` | A conflict is a record with `id`, `detected_by`, `detected_at`, and a `resolution_note` once closed. |
| `FR-CONF-04` | `conflict_member` is many-to-many: three disagreeing recollections join one conflict, not three pairs. |
| `FR-CONF-05` | Member claims move to `certainty='conflicting'`. |
| `FR-CONF-06` | Closing a conflict requires `winning_claim_id`, `resolved_by` (a `person`) and `resolved_at`. **An agent cannot close one.** |

## Acceptance

This requirement is met when every row above has at least one corresponding test, and that
test appears in some `docs/implement/evidence/TASK-*-junit.xml`.

## Related

- `docs/technical/07-conflict-lifecycle.md`
- `NFR-TRUST-epistemic-integrity`
