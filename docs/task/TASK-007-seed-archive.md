---
id: TASK-007
title: Seeded sample archive
branch: C
day: 1
depends_on: [TASK-003, TASK-008]
status: done
---

# TASK-007 — Seeded sample archive

| | |
|---|---|
| **Branch** | C · panels/ + seed/ + content |
| **Planned day** | Day 1 |
| **Depends on** | `TASK-003`, `TASK-008` |
| **Requirements** | [`FR-SEED`](../requirements/functional/FR-SEED-seed-archive.md) |

## Goal

Fictional data staging the 1972/1974 situation, loaded through the command layer.

## In scope

- 3–4 people, 2 places
- a 1972 recollection labelled `oral`
- a photo whose `verbatim` reads 1974
- enough for `v_open_disagreement` to return one row

## Out of scope

- **no** raw `INSERT` — everything through `commands.*`
- no real family data

## Acceptance criteria

- [x] Opening the app for the first time shows an archive with content
- [x] `v_open_disagreement` returns exactly one row after seeding
- [x] Seeding runs through the command layer and no constraint blocks it

## Files touched

- `src/seed/family.sql`
- `src/seed/loadSeed.ts`

## Notes

If a constraint blocks the seed, either the constraint is wrong or the seed is. Do not relax the constraint to make seeding work.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-007`
3. Write `docs/implement/IMPL-TASK-007.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
