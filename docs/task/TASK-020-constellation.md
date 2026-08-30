---
id: TASK-020
title: The relationship constellation
branch: A
day: 4
depends_on: [TASK-016]
status: superseded
superseded_by: TASK-030
---

# TASK-020 — The relationship constellation

| | |
|---|---|
| **Branch** | A · view/ |
| **Planned day** | Day 4 |
| **Depends on** | `TASK-016` |
| **Requirements** | [`FR-BOOK`](../requirements/functional/FR-BOOK-book-canvas.md) |

## Goal

Family relationships appear as a constellation floating above the book.

## In scope

- nodes are people, edges are relationship claims
- edges carry the certainty label

## Out of scope

- can be cut if the demo core is not done by day 4

## Acceptance criteria

- [ ] Unconfirmed relationships look different from confirmed ones
- [ ] Clicking a person turns the book to them

## Files touched

- `src/view/Constellation.tsx`

## Notes

The first task to cut if the schedule slips. Lovely, but not the core.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-020`
3. Write `docs/implement/IMPL-TASK-020.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`

## Superseded 2026-08-30 — deferred, not cut

This was always the first task to cut if the schedule slipped, and the schedule has slipped into a
direction change. `FR-BOOK-05` is marked deferred in the second `FR-BOOK` amendment.

The road gives it a better home than the book did — relationship structure belongs on the verge,
beside the years it spans, rather than floating above a book. Nothing is built and nothing is
promised.

`src/view/Constellation.tsx` remains a stub.
