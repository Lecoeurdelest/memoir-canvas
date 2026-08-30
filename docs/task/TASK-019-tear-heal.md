---
id: TASK-019
title: Healing the tear
branch: A
day: 3
depends_on: [TASK-018]
status: todo
---

# TASK-019 — Healing the tear

| | |
|---|---|
| **Branch** | A · view/ |
| **Planned day** | Day 3 |
| **Depends on** | `TASK-018` |
| **Requirements** | [`FR-BOOK`](../requirements/functional/FR-BOOK-book-canvas.md), [`FR-CONF`](../requirements/functional/FR-CONF-conflicts.md) |

## Goal

Closing a conflict heals the tear, flips the label to Confirmed, and shows who confirmed it.

## In scope

- heal animation
- label flips to Confirmed
- the confirming person's name on the page

## Out of scope

- —

## Acceptance criteria

- [ ] Heals only when `conflict.status='resolved'`
- [ ] The confirming person's name appears on the page — a human is visible in the result

## Files touched

- `src/view/Tear.tsx`
- `src/panels/CertaintyBadge.tsx`

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-019`
3. Write `docs/implement/IMPL-TASK-019.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
