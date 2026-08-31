---
id: TASK-030
title: The road
branch: A
day: 5
depends_on: [TASK-010, TASK-018, TASK-025]
supersedes: [TASK-015, TASK-016, TASK-017]
status: superseded
superseded_by: TASK-035
---

# TASK-030 — The road

| | |
|---|---|
| **Branch** | A · view/ |
| **Planned day** | Day 5 (unplanned — direction change after the DAY 4 GATE) |
| **Depends on** | `TASK-010`, `TASK-018`, `TASK-025` |
| **Supersedes** | `TASK-015`, `TASK-016`, `TASK-017` |
| **Requirements** | [`FR-BOOK`](../requirements/functional/FR-BOOK-book-canvas.md) (amended twice), [`NFR-PORT`](../requirements/non-functional/NFR-PORT-webview-portability.md), [`NFR-A11Y`](../requirements/non-functional/NFR-A11Y-accessibility.md), [`NFR-PERF`](../requirements/non-functional/NFR-PERF-performance.md) |

## Goal

Opening the archive lays the pages end to end into a road that recedes into the dark, and reading
is travelling forward along it. An open conflict stands a torn sheet of paper across the way.

Built in CSS perspective, not WebGL. See the second amendment in `FR-BOOK` for the measurement
behind that decision.

## In scope

- one navigation truth shared by every renderer, holding the wedge rule and the `R4` contract
- a road stage: ground plane, milestones receding into fog, travel by control and by keyboard
- a torn sheet standing across the road while a conflict is open
- the flat list as an escape hatch (`?flat=1`, persisted toggle)
- more than one station in the seed — a road with one stop is not a road

## Out of scope

- **no WebGL**, no `three`, no `@react-three/fiber`, no drei — see `FR-BOOK` amendment two
- no photo or date import — that is `TASK-032`
- no shell restructure — that is `TASK-031`
- no relationship constellation — `TASK-020`, superseded and deferred

## Acceptance criteria

- [x] The archive opens onto a road with more than one station
- [x] Travelling forward works from the controls and from the keyboard
- [x] An open conflict blocks the road visibly, and forward travel is refused
- [x] The blockage is refused by **every** route, including the milestone list
- [x] Backward travel is always allowed — the reader is never trapped
- [x] Resolution clears the way
- [x] The app paints and stays painted with WebGL unavailable
- [x] Vietnamese diacritics render correctly
- [x] The entry chunk does not regress (`NFR-PERF-02`)

## Files touched

- `src/view/useSpreadNavigation.ts` (new)
- `src/view/BookStage.tsx` (new)
- `src/view/BookControls.tsx` (new)
- `src/view/Road.tsx` (new)
- `src/view/webgl.ts` (new)
- `src/view/CssBook.tsx`
- `src/Archive.tsx`
- `src/app.css`
- `src/seed/loadSeed.ts`
- `tests/navigation.spec.ts` (new)
- `tests/spreads.spec.ts`

## Notes

The seed change is the hidden critical-path item, and it must be done first. `buildSpreads` groups
on `(subject_kind, subject_id, predicate, object_person_id, object_place_id, object_text)`, and
both seeded claims fall in one group — so before this task the archive had exactly **one** spread
and there was nowhere to travel.

New claims must be dated **after 1974**, because `core-loop.spec.ts` and `spreads.spec.ts` index
`spreads[0]` positionally in twelve places and every one of them means "the disputed group".

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-030`
3. Write `docs/implement/IMPL-TASK-030.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`

## Superseded 2026-08-31 — by `TASK-035`

The road was the metaphor for travelling forward through time. Once the book turned pages, turning
a page *became* that, and two metaphors were competing for one job. The road is cut; the book wins.

**What survives, and it is the valuable half:** `useSpreadNavigation` — the state, the wedge rule
and the `R4` `setUi` contract. None of it was ever about the road, and `tests/navigation.spec.ts`
keeps passing unchanged across the whole rewrite. That is what "one truth, two skins" bought: the
skin was replaceable without touching the truth.

`src/view/Road.tsx` and `src/view/BookControls.tsx` are removed by `TASK-035`. The seed change this
task made — four stops instead of one — is kept and is now what the forest and the fore-edge index
both need.
