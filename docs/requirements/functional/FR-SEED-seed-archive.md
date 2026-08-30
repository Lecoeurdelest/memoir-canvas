---
id: FR-SEED
title: Seeded sample archive
type: functional
status: draft
---

# FR-SEED — Seeded sample archive

## Intent

Anyone opening the app for the first time — judges included — sees an archive with content in it, staged for the demo scenario.

## Requirements

| ID | Requirement |
|---|---|
| `FR-SEED-01` | The data is **entirely fictional**. No real family data enters the repo. |
| `FR-SEED-02` | The seed stages the 1972/1974 situation: one recollection, one photo with a different year on the back. |
| `FR-SEED-03` | Seeding runs **through the command layer**, never raw `INSERT` — if a constraint blocks the seed, either the constraint or the seed is wrong. |
| `FR-SEED-04` | Each browser gets its own archive. One person never sees another's data. |

## Acceptance

This requirement is met when every row above has at least one corresponding test, and that
test appears in some `docs/implement/evidence/TASK-*-junit.xml`.

## Related

- `NFR-PRIV-privacy-local-first`
