---
id: TASK-017
title: Turning pages
branch: A
day: 3
depends_on: [TASK-016]
status: todo
---

# TASK-017 — Turning pages

| | |
|---|---|
| **Branch** | A · view/ |
| **Planned day** | Day 3 |
| **Depends on** | `TASK-016` |
| **Requirements** | [`FR-BOOK`](../requirements/functional/FR-BOOK-book-canvas.md), [`NFR-A11Y`](../requirements/non-functional/NFR-A11Y-accessibility.md), [`NFR-PERF`](../requirements/non-functional/NFR-PERF-performance.md) |

## Goal

A `rotateY` hinge with easing. The spine is the timeline; clicking a year turns to it.

## In scope

- turn animation
- spine as timeline
- keyboard navigation

## Out of scope

- **no** physics simulation — that is a time sink

## Acceptance criteria

- [ ] Turns hold at or above 30 fps
- [ ] `prefers-reduced-motion` gives an instant transition
- [ ] Pages can be turned from the keyboard

## Files touched

- `src/view/PageTurn.tsx`
- `src/view/Spine.tsx`

## Notes

A rotating hinge with easing is enough for the brain to read it as “turning”. Do not build more.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-017`
3. Write `docs/implement/IMPL-TASK-017.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
