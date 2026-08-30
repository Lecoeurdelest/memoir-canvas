---
id: TASK-018
title: The conflict tear
branch: A
day: 3
depends_on: [TASK-014, TASK-016]
status: todo
---

# TASK-018 — The conflict tear

| | |
|---|---|
| **Branch** | A · view/ |
| **Planned day** | Day 3 |
| **Depends on** | `TASK-014`, `TASK-016` |
| **Requirements** | [`FR-BOOK`](../requirements/functional/FR-BOOK-book-canvas.md), [`FR-CONF`](../requirements/functional/FR-CONF-conflicts.md) |

## Goal

A `conflicting` claim splits the page along a red tear; the book **cannot close** there.

## In scope

- the page-split effect
- block closing the book at a conflicted page
- show both competing values

## Out of scope

- the effect must be a **consequence of state**, never spontaneous

## Acceptance criteria

- [ ] The tear appears if and only if a `conflicting` claim exists
- [ ] The book genuinely cannot close at that page
- [ ] Both years appear side by side, neither visually favoured

## Files touched

- `src/view/Tear.tsx`

## Notes

**The most valuable moment in the demo.** It is the physical metaphor for an AI refusing to guess.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-018`
3. Write `docs/implement/IMPL-TASK-018.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
