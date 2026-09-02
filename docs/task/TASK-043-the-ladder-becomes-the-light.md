---
id: TASK-043
title: The ladder becomes the light
branch: A
day: 6
depends_on: [TASK-034, TASK-040]
status: todo
---

# TASK-043 — The ladder becomes the light

| | |
|---|---|
| **Branch** | A · view/ |
| **Depends on** | `TASK-034`, `TASK-040` |
| **Requirements** | `FR-BOOK-12` (sixth amendment), [`NFR-A11Y-02`](../requirements/non-functional/NFR-A11Y-accessibility.md) |

## Goal

Strip the forest to the picture. The title, the tool sentence, the summary line and the six-item
legend all go, and **the certainty ladder moves into the shape of the light itself.**

## Why the legend cannot merely be deleted

`NFR-A11Y-02` forbids conveying meaning by colour alone, and `tests/certainty.spec.ts` enforces it.
The legend is how the forest currently satisfies that rule. Deleting it without a replacement
breaks a requirement that presently passes.

The replacement already exists and has since `TASK-021`. `GLYPH` gives five distinct shapes:

| Rung | Shape | Drawn as |
|---|---|---|
| `uncertain` | `○` | a ring, hollow |
| `oral` | `◔` | a quarter filled |
| `document_supported` | `◑` | a half filled |
| `conflicting` | `◈` | a facetted core, edged |
| `confirmed` | `●` | solid |

A firefly drawn as its rung is legible in greyscale, at a glance, with nothing written anywhere.
That is a better answer than the caption, not a worse one.

## In scope

- remove the forest title, the agent sentence, the summary line and the legend
- draw each light as its rung: fill fraction and edge treatment, not colour alone
- keep every accessible name exactly as it is
- assert in a test that the ladder is distinguishable **without colour and without text**

## Out of scope

- no change to placement, travel, hit target or the wedge
- no change to what a light opens

## Acceptance criteria

- [ ] The forest renders no title, no legend, no summary and no sentence about the agent
- [ ] Each light's **shape** identifies its rung with the colour removed
- [ ] The five rungs are mutually distinguishable in greyscale, asserted in a test
- [ ] Every light and ring keeps its accessible name and its keyboard reach
- [ ] The empty-spot count is still discoverable to a screen reader, though not printed
- [ ] `prefers-reduced-motion` unaffected

## Files touched

- `src/view/Forest.tsx`
- `src/view/forestLayout.ts`
- `src/app.css`
- `tests/certainty.spec.ts`, `tests/forest.spec.ts`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json` (keys retired)

## Notes

The count of memories and gaps is still real information. It moves to the container's accessible
name — a screen reader hears *"Rừng ký ức, 5 mẩu ký ức, 2 chỗ còn trống"* while the screen shows a
wood. That is the amendment's rule applied exactly: not shown, still announced.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-043`
3. Write `docs/implement/IMPL-TASK-043.md`
4. Walk `.agent/workflows/review-checklist.md`
