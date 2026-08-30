---
id: FR-EVID
title: Evidence and sources
type: functional
status: draft
---

# FR-EVID — Evidence and sources

## Intent

A source is the thing carrying evidence; the `evidence` edge joins it to a claim with a stance, supporting or contradicting.

## Requirements

| ID | Requirement |
|---|---|
| `FR-EVID-01` | `source.kind` accepts `oral_account` | `photo` | `document` | `external_record`. |
| `FR-EVID-02` | An `oral_account` requires a `contributor_id` — no memory is anonymous. |
| `FR-EVID-03` | `source.verbatim` holds the **exact words**, never a paraphrase. |
| `FR-EVID-04` | `evidence.stance` accepts `supports` | `contradicts` | `mentions`. Contradictions are **recorded**, never swallowed. |
| `FR-EVID-05` | Raising a claim to `document_supported` requires existing evidence with `stance='supports'`, enforced by a constraint trigger. |

## Acceptance

This requirement is met when every row above has at least one corresponding test, and that
test appears in some `docs/implement/evidence/TASK-*-junit.xml`.

## Related

- `docs/technical/01-data-model.md`
- `FR-CONF-conflicts`
