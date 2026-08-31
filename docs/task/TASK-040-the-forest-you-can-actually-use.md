---
id: TASK-040
title: The forest you can actually use
branch: A
day: 6
depends_on: [TASK-034, TASK-037]
status: done
---

# TASK-040 — The forest you can actually use

| | |
|---|---|
| **Branch** | A · view/ |
| **Depends on** | `TASK-034`, `TASK-037` |
| **Requirements** | [`FR-BOOK-01`](../requirements/functional/FR-BOOK-book-canvas.md), `FR-BOOK-08`, [`NFR-A11Y`](../requirements/non-functional/NFR-A11Y-accessibility.md), [`FR-MCP`](../requirements/functional/FR-MCP-tool-surface.md) |

## Goal

Four defects reported by the product owner against the shipped forest. Two of them make the demo
unusable, and one of them is a testing failure of mine as much as a code failure.

## T1 — no light can be clicked

**Reproduced and diagnosed.** `elementFromPoint` at the exact centre of light 0 returns
`forest-lights lights-2`, not the light.

The three light layers are each `position: absolute; inset: 0` — every one of them is a
**1425 × 900 transparent sheet**, and the last in DOM order lies over the whole forest swallowing
every click meant for the two beneath it.

**Why the tests did not catch it.** They drove the UI with `element.click()`, which dispatches
straight at the node and skips hit-testing entirely. A method that cannot observe the defect was
used to prove the feature worked. Any future check of a pointer target must go through real
coordinates.

Second defect in the same place: a light is **12 px** across. `NFR-A11Y` has no target-size rule
yet, but WCAG puts the floor at 24 px and the comfortable size at 44.

## T2 — travelling the forest is cramped

Pan is a pure function of pointer position, so the picture reaches its limit the moment the pointer
touches the edge of the screen and there is nowhere further to go. It is a lean, not a walk.

## T3 — clicking a light gives nothing back

Even with T1 fixed, the view swaps instantly. Nothing connects the light you pressed to the book
that appears, so the light does not *become* the book — it is replaced by it.

## T4 — the agent is not visible

The whole argument of this project is that the agent's tools change with what a person has open.
That currently happens where nobody looks: inside Backstage, behind a quiet link. A person in the
forest sees nothing at all of the agent.

## In scope

- light layers stop swallowing clicks; every light and ring gets a target of at least 44 px
- **drag to travel**, accumulating, so the forest can be walked rather than leaned at
- a light blooms into the book it opens
- one honest line in the forest: how many tools the assistant is holding **right now**

## Out of scope

- no change to what a light means or where it goes — that is `TASK-034` and it is correct
- no new tool, no change to `descriptors.ts`

## Acceptance criteria

- [x] `document.elementFromPoint` at a light's centre returns **that light**
- [x] A real pointer click — coordinates, not `element.click()` — opens the memory
- [x] Every light and ring has a hit target of at least 44 × 44 px
- [x] Dragging travels the forest, and keeps travelling; releasing does not spring back
- [x] Travel is clamped so no light can be lost off the edge
- [x] Pressing a light gives visible feedback before the book appears
- [x] The forest states how many tools the assistant holds, and the number **changes** when a memory is opened
- [x] `prefers-reduced-motion` drops the bloom and the glide
- [x] A test asserts the hit target through geometry, not through a synthetic node click

## Files touched

- `src/view/Forest.tsx`
- `src/view/forestLayout.ts`
- `src/app.css`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/forest.spec.ts`

## Notes

**On T1 and the test that lied.** The lesson is not "add a test for this bug". It is that a
synthetic `.click()` proves a handler is wired and proves nothing about whether a human can reach
it. The forest is a view whose whole content is pointer targets, and it was verified with the one
technique blind to pointer targets.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-040`
3. Write `docs/implement/IMPL-TASK-040.md`
4. Walk `.agent/workflows/review-checklist.md`
