---
task: TASK-041
status: done
date: 2026-08-31
author: Lecoeurdelest
---

# IMPL-TASK-041 — The book comes back into the forest

## What was built

The book no longer lands on a white column. Opening a memory keeps the reader in the wood: the same
dark ground, and the volume floating in it on warm aged paper with the design's own geometry —
`1210 × 700`, `perspective: 2100px`, `rotateX(9deg) rotateY(-2deg)`, the dark board behind it, the
striped page block down both edges, and four colour tabs off the right edge that are the fore-edge
index restyled rather than replaced.

Every number is measured from `Open.dc.html`, not eyeballed.

## Acceptance criteria

- [x] Opening a memory does not leave the forest
- [x] The book carries the tilt, the board, the striped page block and the spine tabs
- [x] Every word inside the book is legible; nothing past 9° / −2°
- [x] Ink on paper meets WCAG AA, asserted like every other palette here
- [x] The book fits a 1440 stage and degrades to one column on a phone
- [x] `?flat=1` is unchanged
- [x] `prefers-reduced-motion` stops the embers

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-041-junit.xml` — 178 passing, up from 165 |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — 12/12 |

Read back out of the live DOM: `perspective: 2100px`, the tilt as a `matrix3d` matching
`rotateX(9deg) rotateY(-2deg)`, four spine tabs, and the stage carrying the forest's own radial
grounds.

**The contrast test caught a defect in the design itself.** `#8a7550`, the canvas's page-label
colour, measures **3.76:1** on its own paper — below the 4.5 WCAG asks of small text, and these
labels are 10 px. Darkened along the same hue to `#726040`, which is **5.15** and the smallest
change that clears the bar. Following a design into a contrast failure would be following it badly.
Ink on leaf measures 11.09, and every certainty badge was re-checked on cream because a badge that
passes on cool white can fail on warm paper.

## Deviations

**I broke this task's own out-of-scope rule and had to undo it.** The rules were written as
`.reading .…`, which also caught the flat list — the `?flat=1` escape hatch was suddenly wearing
the book's dark stage, and its refusal page grew to 1059 px inside a 720 px viewport with the
settle controls off the bottom of the screen. Everything is now scoped to `.reading-book`, and the
flat list keeps the plain light column it is supposed to keep.

**The refusal is a column, not a block.** The two facing pages scroll together and the apparatus
for settling — the names, *ask the assistant*, the closing line — is pinned below them. On the one
page in the app that must be acted on, "scroll down to find the control" is not good enough, and
that is exactly what the first version did.

**One scroller, not three.** The pages and their container were both scrolling, so the paper grew
two browser scrollbars down the middle of it. Only the pair scrolls now, and the bar is thinned and
warmed rather than hidden — hiding it would remove the only sign there is more below.

## Known gaps

- **The book is short on a short screen.** `min(700px, 70dvh)` gives 504 px on a 720 px viewport,
  so the facing pages scroll more than the design intends. The design assumes a 900 px stage.
- **No embers on the book stage yet.** The ground and its glow carry over; the rising embers the
  canvas draws behind the book do not. The stage is a static gradient.
- **The tilt is dropped entirely below 900 px** rather than reduced, because at phone width a
  rotated single column loses more than it gains.
- **`.reading-book` restyles by descendant selector**, so a component moved into the book stage
  inherits paper styling it never asked for. It works, and it is fragile.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 · R2 · R3 · R4 | ☐ | Presentation only — no tool, no write, no query, no `ui` change. |
| R5 — the view layer is read-only | ☑ | A class name and a stylesheet. No state of any kind was added. |

## Files changed

- `src/view/BookStage.tsx` (the stage gets a name)
- `src/panels/CertaintyBadge.tsx` (`LEAF`, `LEAF_INK`, `LEAF_LABEL`)
- `src/app.css`
- `tests/certainty.spec.ts`
