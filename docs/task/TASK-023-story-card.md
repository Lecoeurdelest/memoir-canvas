---
id: TASK-023
title: The bilingual story card
branch: C
day: 4
depends_on: [TASK-010, TASK-021]
status: done
---

# TASK-023 — The bilingual story card

| | |
|---|---|
| **Branch** | C · panels/ + seed/ + content |
| **Planned day** | Day 4 |
| **Depends on** | `TASK-010`, `TASK-021` |
| **Requirements** | [`FR-CARD`](../requirements/functional/FR-CARD-story-cards.md), [`FR-I18N`](../requirements/functional/FR-I18N-bilingual.md) |

## Goal

A story card built from several claims, carrying its `floor_certainty`, with its audit trail.

## In scope

- bilingual layout
- `floor_certainty` shown prominently
- list the claims and sources it stands on

## Out of scope

- the agent cannot choose `floor_certainty`

## Acceptance criteria

- [x] A card standing on one unverified recollection **must** carry that label, however well written it is
- [x] Switching language does not reload the page

## Files touched

- `src/panels/StoryCard.tsx`

## Notes

An important aesthetic constraint: a beautiful card must not bury a weak label.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-023`
3. Write `docs/implement/IMPL-TASK-023.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
