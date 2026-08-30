---
task: TASK-002
status: done
date: 2026-08-29
author: scaffold
---

# IMPL-TASK-002 — Freeze the data schema

## What was built

`src/domain/schema.sql`: 10 tables, 8 enum types, the three core constraints, one plpgsql
function with a `CONSTRAINT TRIGGER … DEFERRABLE`, three indexes, and the
`v_open_disagreement` view.

The pivotal design decision: **`person` has no birth-year column.** A birth year is a `claim` —
it can be wrong, it can be contradicted, it may need evidence. Putting it on `person` returns
you to the "the database holds truth" model and the rest of the architecture collapses with it.

The disagreement detector is an eight-line view (`GROUP BY … HAVING count(DISTINCT year_value)
> 1`), not an inference engine. `flag_conflict` simply `SELECT`s from it.

Also written: `scripts/verify-constraints.mjs` — ten behavioural tests running on PGlite, seven
of which must be refused and three of which must pass.

## Acceptance criteria

- [x] The schema runs end to end on PGlite without error
- [x] All 8 enum types exist
- [x] The constraint trigger exists and is DEFERRABLE
- [x] `npm run db:verify` green at 10/10

## Evidence

| Kind | Location |
|---|---|
| Constraints | `npm run db:verify` — **10/10**, engine `PostgreSQL 18.3 (PGlite 0.5.8) on wasm32` |
| Typecheck | `npm run typecheck` — green |
| Tests | `Evidence: N/A` — this task produces no TypeScript; `db:verify` is the evidence |

The same `schema.sql` ran 10/10 on PGlite in WASM. Nothing had to be rewritten for the browser
environment.

> **Corrected 2026-08-30.** This section previously also claimed 10/10 on a real PostgreSQL 16.13
> server. No artefact of that run exists in the repo, so the claim is withdrawn rather than
> restated — see `scripts/evidence.mjs`, which forbids exactly this.

## Deviations

**SQLite-WASM** was evaluated first, for size. It costs `DEFERRABLE` (which would need an
enforced ordering of source → evidence → label upgrade instead) and all enum types (replaced by
`CHECK … IN`). Two of the ten checks in `db:verify` test precisely `DEFERRABLE` and enum
rejection, so a SQLite port could not have scored 10/10 on the same suite — an earlier version of
this document claimed it did, and that claim is withdrawn.

PGlite was chosen because **nothing has to be given up** — it runs the Postgres schema unchanged.
The price is ~5.3 MB gzip, paid with lazy-loading after the first frame; see `TASK-003`.

## Known gaps

- `predicate` is free text with no foreign key protecting it. For six days that is the right
  trade-off — pin the predicate list in TypeScript, not in SQL. If the project outlives the
  hackathon, this is the first place to tighten.
- `v_open_disagreement` only catches disagreements about **years**. Two simultaneous residences,
  two spouses, and so on need sibling views of the same shape. Phase two, not this week.
- There is no migration path. Acceptable while the schema is frozen, but if it has to change
  mid-week everyone testing will need to clear their IndexedDB.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | |
| R2 — shared write door | ☐ | |
| R3 — only the command layer touches the database | ☑ | the schema belongs to `domain/`; only `db.ts` loads it |
| R4 — the registry is a pure function | ☐ | |
| R5 — the view layer is read-only | ☐ | |

The three core constraints are `NFR-TRUST` expressed as SQL. Relaxing any of them breaks what
the project argues; it is not a simplification.

## Files changed

- `src/domain/schema.sql`
- `scripts/verify-constraints.mjs`
