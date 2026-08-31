---
id: TASK-034
title: The firefly forest
branch: A
day: 6
depends_on: [TASK-010, TASK-033]
supersedes: [TASK-020]
status: done
---

# TASK-034 — The firefly forest

| | |
|---|---|
| **Branch** | A · view/ |
| **Depends on** | `TASK-010`, `TASK-033` |
| **Supersedes** | `TASK-020` (the constellation) |
| **Requirements** | [`FR-BOOK-01`](../requirements/functional/FR-BOOK-book-canvas.md) (third amendment), [`NFR-A11Y`](../requirements/non-functional/NFR-A11Y-accessibility.md), [`NFR-PERF`](../requirements/non-functional/NFR-PERF-performance.md) |

## Goal

The archive opens as a forest at night. One firefly per memory. **Brightness and hue are
certainty**, so the state of the whole archive reads before a single word is read.

This is the highest-value view in the redesign: it is the first screen, it is the thing a judge
sees first, and it renders the project's thesis as an image rather than a sentence.

## In scope

- `src/view/Forest.tsx` — the entry view, three parallax layers of trees and lights
- lights coloured from a **dark** certainty palette; a conflicting memory blinks fast and uneven
- an **unlit ring** for a spread with no claim yet — the gap the family has not filled
- pointer travel: a wide pan (near layer sweeps ~1500px, far layer ~340px)
- clicking a light selects that spread and opens the book (`TASK-035`)
- no text on the lights at rest; a name appears on hover only

## Out of scope

- no WebGL. CSS transforms and box-shadow only
- no book rendering — `TASK-035`
- no writing of any kind: this view selects, it never mutates

## Acceptance criteria

- [x] Every spread in the read model is one light; the count matches
- [x] Certainty is legible from colour alone at a glance, and the conflicting one is findable without reading
- [x] Pointer travel moves the layers at visibly different rates
- [x] Clicking a light sets `uiState` and opens that spread — the `R4` contract is unchanged
- [x] Keyboard: the lights are reachable and named; arrow keys move between them
- [x] `prefers-reduced-motion` stops all blinking and drifting, and the lights stay legible
- [x] The light count is reduced on narrow viewports (see Notes)
- [x] No runtime network request; entry chunk does not regress

## Files touched

- `src/view/Forest.tsx` (new)
- `src/view/forestLayout.ts` (new)
- `src/view/BookStage.tsx`
- `src/view/useSpreadNavigation.ts` (not planned — see IMPL Deviations)
- `src/store/projection.ts` (not planned — see IMPL Deviations)
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `src/panels/CertaintyBadge.tsx` — a dark palette beside the light one
- `src/app.css`
- `tests/forest.spec.ts` (new)
- `tests/certainty.spec.ts`

## Notes

**The measured cost, stated before building.** Every light is a `<span>` with an animated
`box-shadow`, which is the most fill-rate-expensive thing on a weak phone, and there are three
parallax layers above it. Budget a light count that scales with viewport width, drop to a single
shadow layer under ~700px, and honour `prefers-reduced-motion` by not animating at all.

`PALETTE` in `CertaintyBadge.tsx` is light-only. The dark set is already measured (6.25–13.32
against the forest ground) and must be asserted in `tests/certainty.spec.ts` the same way the light
set is — the existing test is the model.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-034`
3. Write `docs/implement/IMPL-TASK-034.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
