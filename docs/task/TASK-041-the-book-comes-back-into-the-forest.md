---
id: TASK-041
title: The book comes back into the forest
branch: A
day: 6
depends_on: [TASK-035, TASK-037]
status: todo
---

# TASK-041 — The book comes back into the forest

| | |
|---|---|
| **Branch** | A · view/ |
| **Depends on** | `TASK-035`, `TASK-037` |
| **Design** | Artboards **2 · 3 · 4 · 5 · 6** — the canvas note *"Ba view sau dựng lại TỪ ĐÚNG KHUNG của view 3"* |
| **Requirements** | [`FR-BOOK-02`](../requirements/functional/FR-BOOK-book-canvas.md), `FR-BOOK-09` |

## Goal

Product owner: *"Phần sách vẫn xấu chưa đồng design."* Correct, and the miss is structural rather
than cosmetic.

The forest goes full-bleed and dark. **The book then lands on a white 900 px column**, which is a
different world — the reader falls out of the wood the moment they open anything. The canvas says
the opposite in as many words: every book view is built *from the same frame as view 3* — same
forest ground, same embers, same book block, same tilt, same striped page edges, same four colour
tabs on the spine.

## What the design actually specifies

Measured from `Open.dc.html`, not eyeballed:

| | |
|---|---|
| Stage | the forest ground and its rising embers, unchanged |
| Book | `1210 × 700`, centred at `top: 51%`, `perspective: 2100px`, `perspective-origin: 50% 44%` |
| Tilt | `rotateX(9deg) rotateY(-2deg)` |
| Board behind | `linear-gradient(155deg, #241f16, #100e0a)`, `box-shadow: 0 46px 100px rgba(0,0,0,.88)` |
| Page block | `repeating-linear-gradient(to bottom, #f2e9d1 0 1px, #c7b894 1px 2.7px)`, 13 px left, 16 px right |
| Spine tabs | four, `20 × 26`, at 9 / 30 / 51 / 72 %, the conflicting one glowing |
| Paper | `linear-gradient(90deg, #d3c49e, #eee5cc 10%, #f4ecd6 58%, #e2d7b8 88%, #b9a97f)` |
| Ink | `#3a2f1f`; labels `#8a7550` |

## The rule this does not break

**What must be read is never tilted.** 9° and −2° is a lean, not a pitch — the earlier failure was
past 30°, where Vietnamese diacritics turned to mush. The design chose these numbers for exactly
that reason, and the body text stays near-frontal at them. Anything steeper goes back.

## In scope

- one shared dark stage for every book view: cover, spread, refusal, blank page, flyleaf
- the book block, the tilt, the board, the striped edges, the spine tabs
- warm paper and its ink, replacing the app's light-page palette **inside the book only**
- the fore-edge tabs restyled as the design's spine tabs, keeping their behaviour and their names

## Out of scope

- no change to what any view *does* — this is the frame, not the content
- no WebGL, still
- the flat list (`?flat=1`) keeps the plain light page: it is the escape hatch, and it must stay
  the plainest thing in the app

## Acceptance criteria

- [ ] Opening a memory does not leave the forest — the ground and embers stay behind the book
- [ ] The book carries the tilt, the board, the striped page block and the spine tabs
- [ ] Every word inside the book is legible; nothing is rotated past the design's 9° / −2°
- [ ] Contrast of ink on paper meets WCAG AA, asserted like every other palette in this repo
- [ ] The book fits a 1440 stage and degrades to one column on a phone
- [ ] `?flat=1` is unchanged
- [ ] `prefers-reduced-motion` stops the embers

## Files touched

- `src/view/BookStage.tsx`, `src/view/Volume.tsx`, `src/view/Cover.tsx`
- `src/view/Forest.tsx` (the stage becomes shared)
- `src/panels/CertaintyBadge.tsx` (paper palette constants)
- `src/app.css`
- `tests/certainty.spec.ts`

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-041`
3. Write `docs/implement/IMPL-TASK-041.md`
4. Walk `.agent/workflows/review-checklist.md`
