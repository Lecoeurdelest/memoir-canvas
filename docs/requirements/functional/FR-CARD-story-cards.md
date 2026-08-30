---
id: FR-CARD
title: Story cards
type: functional
status: draft
---

# FR-CARD — Story cards

## Intent

The readable output of the system: a bilingual passage carrying the weakest certainty among the claims it stands on.

## Requirements

| ID | Requirement |
|---|---|
| `FR-CARD-01` | A card stands on at least one claim; an empty list is rejected at the database layer. |
| `FR-CARD-02` | `floor_certainty` is the `min()` of the claims' certainties. **The agent does not choose it.** |
| `FR-CARD-03` | Fully bilingual: `title_vi`/`title_en`, `body_vi`/`body_en`. |
| `FR-CARD-04` | A card displays its audit trail: which claims, which sources, who confirmed. |

## Acceptance

This requirement is met when every row above has at least one corresponding test, and that
test appears in some `docs/implement/evidence/TASK-*-junit.xml`.

## Related

- `docs/technical/01-data-model.md`
- `FR-I18N-bilingual`
