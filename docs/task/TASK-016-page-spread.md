---
id: TASK-016
title: The page spread
branch: A
day: 2
depends_on: [TASK-010, TASK-015]
status: superseded
superseded_by: TASK-030
---

# TASK-016 — The page spread

| | |
|---|---|
| **Branch** | A · view/ |
| **Planned day** | Day 2 |
| **Depends on** | `TASK-010`, `TASK-015` |
| **Requirements** | [`FR-BOOK`](../requirements/functional/FR-BOOK-book-canvas.md), [`NFR-A11Y`](../requirements/non-functional/NFR-A11Y-accessibility.md) |

## Goal

Each spread is one story card: recollection left, evidence right. Content is DOM through `<Html transform>` — **without `occlude`**, see `FR-BOOK-07`.

## In scope

- spread layout
- `<Html transform>` for content (no `occlude` — it breaks the accessibility tree)
- bound to the projection from the store

## Out of scope

- no domain state held in the component (R5)

## Acceptance criteria

- [ ] Text is crisp, clickable and readable by a screen reader
- [ ] Vietnamese diacritics render correctly inside the 3D scene
- [ ] No `useState` holds domain data

## Files touched

- `src/view/Spread.tsx`
- `src/view/Page.tsx`

> **Partially built 2026-08-30.** `src/view/Spread.tsx` exists and renders recollection left,
> evidence right, bound to the projection, with no `useState` holding domain data — in plain DOM,
> as part of `TASK-026`. The remaining criterion, "Vietnamese diacritics render correctly inside
> the 3D scene", cannot be checked until `TASK-015` builds a scene. `src/view/Page.tsx` was not
> needed. Left `todo` deliberately rather than claimed.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-016`
3. Write `docs/implement/IMPL-TASK-016.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`

## Superseded 2026-08-30 — by `TASK-030`

This task was already annotated as untestable until `TASK-015` existed. `TASK-015` is superseded,
and the road renders station content as ordinary DOM in the ordinary document — so the criterion
this task was waiting on, *"diacritics render correctly inside the 3D scene"*, is satisfied by
construction rather than by test: there is no scene-local text stack to get Vietnamese wrong.

`src/view/Spread.tsx` survives and is used unchanged by both skins.
