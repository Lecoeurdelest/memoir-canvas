---
id: FR-CLAIM
title: Claims and certainty
type: functional
status: draft
---

# FR-CLAIM — Claims and certainty

## Intent

Every statement about the past is a `claim` carrying a certainty label. No table holds “truth”.

## Requirements

| ID | Requirement |
|---|---|
| `FR-CLAIM-01` | A `claim` has a subject, a predicate, and at least one of: person, place, text, year. |
| `FR-CLAIM-02` | `year_precision` accepts `exact` | `circa` | `decade` | `range`. “Around 1972” is **not** rounded. |
| `FR-CLAIM-03` | The certainty ladder is ordered: `uncertain` < `oral` < `document_supported` < `conflicting` < `confirmed`. |
| `FR-CLAIM-04` | Claims created by an agent are capped at `oral`. It cannot set anything higher. |
| `FR-CLAIM-05` | `certainty='confirmed'` requires `confirmed_by` pointing at a `person`, plus `confirmed_at`. **A database constraint, not an application check.** |
| `FR-CLAIM-06` | Relationships, occupations and moves are all claims — no table gets a privileged exception. |

## Acceptance

This requirement is met when every row above has at least one corresponding test, and that
test appears in some `docs/implement/evidence/TASK-*-junit.xml`.

## Related

- `docs/technical/01-data-model.md`
- `NFR-TRUST-epistemic-integrity`
