---
id: TASK-035
title: The book, turned by hand
branch: A
day: 6
depends_on: [TASK-034]
supersedes: [TASK-030]
status: todo
---

# TASK-035 — The book, turned by hand

| | |
|---|---|
| **Branch** | A · view/ |
| **Depends on** | `TASK-034` |
| **Supersedes** | `TASK-030` (the road) |
| **Requirements** | [`FR-BOOK-02`](../requirements/functional/FR-BOOK-book-canvas.md), `FR-BOOK-08`, [`NFR-A11Y`](../requirements/non-functional/NFR-A11Y-accessibility.md) |

## Goal

A light opens into a bound volume, and the volume opens onto a spread you turn **by hand**. No
visible navigation control anywhere.

## Why this supersedes the road

The road existed to make travelling forward mean travelling through time. Once pages turn, turning
a page *is* that. Two metaphors were competing for one job; the road is cut. `useSpreadNavigation`
survives untouched — the state, the wedge rule and the `R4` `setUi` contract were never about the
road, and they carry over exactly.

## In scope

- `src/view/Volume.tsx` — the spread: near-frontal so every word is legible, with depth coming from the leaf being turned, the page block, and the gutter
- drag-to-turn: pointer down on a page edge, follow, release past a threshold commits `go(±1)`
- the **fore-edge index**: coloured tabs on the page block, one per spread, dragged to reach a year — this replaces the spine of buttons
- `src/view/Cover.tsx` — the closed volume with its title, as the transition from forest to spread
- removal of `BookControls.tsx` and every on-screen turn control

## Out of scope

- no page-curl physics — a rotateY hinge with a light sweep is enough, and more is a time sink
- no conflict behaviour — `TASK-036`
- no blank-page authoring, no index search — cut list, below

## Acceptance criteria

- [ ] A spread reads at rest with no text distorted by perspective
- [ ] Dragging a page edge turns the page; releasing below the threshold springs it back
- [ ] Dragging the fore-edge reaches any spread; a tab's colour is its certainty
- [ ] **No visible navigation button exists anywhere in the view**
- [ ] ArrowLeft/ArrowRight still turn pages (`NFR-A11Y-03`), and every page control has an accessible name
- [ ] The wedge rule still refuses forward travel by every route, gesture included
- [ ] `prefers-reduced-motion` turns pages instantly

## Files touched

- `src/view/Volume.tsx` (new)
- `src/view/Cover.tsx` (new)
- `src/view/usePageDrag.ts` (new)
- `src/view/BookStage.tsx`
- `src/view/BookControls.tsx` (removed)
- `src/view/Road.tsx` (removed)
- `src/app.css`
- `tests/navigation.spec.ts`

## Notes

**The rule that governs the layout**, learned by building the opposite first: what must be read is
never tilted; what is tilted never needs to be read. The page's own body text is texture.

`tests/navigation.spec.ts` tests `nextIndex` / `jumpTarget` / `reachLimit` as pure functions. Those
are renderer-independent and must keep passing untouched — if they need changing, the wedge rule
has been broken.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-035`
3. Write `docs/implement/IMPL-TASK-035.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
