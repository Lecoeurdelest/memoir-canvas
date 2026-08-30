# Glossary

Use exactly these words in code, docs and UI. Giving one concept two names is the fastest way
for three branches to drift apart.

| Term | What it means here | Table |
|---|---|---|
| **person** | A human being. Holds only what nobody disputes: they existed, they are called this. | `person` |
| **place** | A location. | `place` |
| **source** | Something carrying evidence: an oral account, a photo, a document, an external record. | `source` |
| **claim** | An *assertion*. The atomic unit of the whole system. | `claim` |
| **evidence** | The edge joining a claim to a source, carrying a `stance`. | `evidence` |
| **stance** | Whether the source `supports`, `contradicts`, or merely `mentions` the claim. | — |
| **conflict** | A recorded disagreement — a row with an id and a history, not a computation. | `conflict` |
| **followup question** | The question an agent proposes when it refuses to guess. | `followup_question` |
| **story card** | A bilingual passage assembled from several claims. | `story_card` |
| **audit event** | Every tool call leaves exactly one row. | `audit_event` |

## `person` has no birth year — deliberately

A birth year is a **claim**: it can be wrong, it can be contradicted, it may need evidence.
Putting `birth_year` on the `person` table returns you to the "the database holds truth" model,
and the rest of the architecture collapses with it. Every assertion — relationships,
occupations, moves — goes through `claim`. There are no privileged exceptions.

## The certainty ladder

The enum order is **not arbitrary** — Postgres can compare enums with `<`, so "the weakest label
on a story card" is a `min()` rather than a hand-written mapping.

| Value | Display (vi) | Display (en) | Who can set it |
|---|---|---|---|
| `uncertain` | Chưa rõ | Uncertain | agent, human |
| `oral` | Lời kể | Oral recollection | agent, human |
| `document_supported` | Có tài liệu | Document-supported | only with `supports` evidence |
| `conflicting` | Mâu thuẫn | Conflicting | only `flag_conflict` |
| `confirmed` | Đã xác nhận | Confirmed | **only with a named human** |

## `circa` is a first-class citizen

"Around 1972" is **not** rounded to 1972. `year_precision` preserves the vagueness of memory,
and that is exactly what turns the 1972/1974 disagreement into a good question rather than a
data error.
