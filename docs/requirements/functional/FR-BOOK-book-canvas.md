---
id: FR-BOOK
title: The 3D book canvas
type: functional
status: draft
---

# FR-BOOK — The 3D book canvas

## Intent

The book **is** the memory graph rendered — not an illustration sitting beside the data.

## Requirements

| ID | Requirement |
|---|---|
| `FR-BOOK-01` | The spine is a timeline; clicking a year turns the book to it. |
| `FR-BOOK-02` | Each spread is one story card: recollection left, evidence and label right. |
| `FR-BOOK-03` | A conflict makes the page **split along a tear**; the book cannot close there. |
| `FR-BOOK-04` | Resolution **heals** the tear and the label becomes Confirmed. |
| `FR-BOOK-05` | Family relationships appear as a constellation above the book. |
| `FR-BOOK-06` | Every effect is the **consequence of a state change**; no spontaneous animation. |
| `FR-BOOK-07` | Page content renders through `<Html transform>` — real DOM, crisp, clickable. **Not `occlude`**: it sets `display:none` on the wrapper whenever the raycast is blocked, which removes the page's heading and controls from the accessibility tree and from focus order, and a rotating page occludes itself past ~80°. Use `occlude="blending"` if depth-sorting is genuinely needed. |

## Acceptance

This requirement is met when every row above has at least one corresponding test, and that
test appears in some `docs/implement/evidence/TASK-*-junit.xml`.

## Related

- `docs/technical/06-book-rendering.md`
- `NFR-PORT-webview-portability`

## Amended 2026-08-30

`FR-BOOK-07` originally specified `<Html transform occlude>`. Measured against the installed drei
in Chrome: `occlude` deletes a page's heading and button from the accessibility tree, drops
keyboard focus, and removes them from tab order for every frame the raycast is blocked — which
during a page turn is most of them. `occlude` and a page-turn animation cannot coexist with
`NFR-A11Y-01` and `NFR-A11Y-03`, so the prop goes. `NFR-A11Y-01` was amended in the same edit.

## Amended 2026-08-30 (second) — the book becomes a road

**Process note, recorded rather than hidden:** this amendment was written *after* `TASK-030` had
already been implemented, which inverts the order this repo requires. The requirement is stated
here as it now stands; the sequencing failure is logged in `docs/implement/IMPL-TASK-030.md`.

The product owner's direction: *"Khi mở cuốn sổ ra sẽ như 1 con đường, sau đó cứ lướt về phía
trước"* — opening the archive lays the pages end to end into a **road**, and reading is travelling
forward along it. Time is depth, not page count.

This does not weaken the metaphor; it sharpens the one row that carries the project's argument.
"The book cannot close here" was always the weakest physical claim in the requirement, because a
book that will not close is a mild inconvenience. **A road that cannot be travelled is a refusal
you feel.**

| ID | Now reads |
|---|---|
| `FR-BOOK-01` | The **milestones** are the timeline; selecting a year travels to it. Unchanged in substance — the spine is now a row of years beside the road. |
| `FR-BOOK-02` | Unchanged. A **station** is what a spread was. |
| `FR-BOOK-03` | An open conflict **stands a torn sheet of paper across the road**. Forward travel is refused by every route — the turn control, the keyboard, and the milestone list alike. |
| `FR-BOOK-04` | Unchanged. Resolution clears the way and the label becomes Confirmed. |
| `FR-BOOK-05` | **Deferred.** The constellation (`TASK-020`) is superseded, not cut: relationship structure is a candidate for the road's verge, but nothing is built and nothing is promised. |
| `FR-BOOK-06` | Unchanged, and now stronger: the blockage is rendered from `spread.conflict`, so it cannot appear without one. |
| `FR-BOOK-07` | **Superseded.** The road renders in CSS perspective, not WebGL, so there is no `<Html>` and no drei. Station content is ordinary DOM in the ordinary document. Everything `FR-BOOK-07` was protecting — real text, crisp, clickable, in the accessibility tree, with correct Vietnamese shaping — is now true by construction rather than by choosing the right prop. |

### Why CSS perspective and not WebGL

Measured, not assumed. A production Vite build of `three` + `@react-three/fiber` against this
repo's own `node_modules` costs **+212 kB gzipped** over a React-only baseline, rising to ~222 kB
with the drei helpers a scene would need. `three` does not tree-shake under R3F, because R3F does
`import * as THREE` and `extend(THREE)` to populate its JSX catalogue — so that figure is the
floor, not the unshaken number. That is 4.7× the entire current entry chunk, for a scene whose
text would then have to be solved separately: `troika-three-text` hard-codes a jsdelivr font URL
and is blocked by the shipped CSP, which is exactly the leak `NFR-PRIV-01` was written to stop.

CSS perspective costs nothing, shapes ổ ữ ậ ằ correctly because it is ordinary text, and has no GL
context to lose when a phone backgrounds the tab.

`FR-BOOK-05` remains the first thing to cut if anything slips, as it always was.

## Amended 2026-08-31 (third) — the road becomes a forest and a book

Approved by the product owner after a seven-round design review. The canvas of record is
`docs/design/` (published design canvas). This amendment supersedes parts of the second one.

**What changed, and why it is a simplification rather than a pivot.** The second amendment made
the archive a road, because travelling forward was travelling through time. The book then gained
real page-turning — at which point **turning a page IS travelling through time**, and the road was
a second metaphor competing for the same job. It is cut. Seven views became six, and all six live
in one world.

| ID | Now reads |
|---|---|
| `FR-BOOK-01` | The archive opens as a **forest of fireflies**: one light per memory. Brightness and hue carry certainty, so the state of the whole archive reads at a glance, before a word. An unlit ring marks a gap the family has not filled. |
| `FR-BOOK-02` | A light opens into a **bound volume** with a title on its cover, and the volume opens onto a spread: recollection left, evidence right. |
| `FR-BOOK-03` | An open conflict is **a page that will not turn**. It lifts and springs back, torn along the gutter. Forward travel is refused by every route until a person settles it. |
| `FR-BOOK-04` | Unchanged. |
| `FR-BOOK-05` | Superseded by `FR-BOOK-01` — the forest is the relationship view the constellation was meant to be. |
| `FR-BOOK-06` | Unchanged, and stronger: the refusal is rendered from `spread.conflict`, so it cannot appear without one. |
| `FR-BOOK-07` | Superseded in the second amendment; still no WebGL, still ordinary DOM. |
| `FR-BOOK-08` | **New. No visible navigation controls.** Travel is by pointer gesture — drag a page edge to turn, drag the fore-edge to reach a year, drag down to close. `NFR-A11Y-03` is satisfied by the keyboard path it already names (ArrowLeft/ArrowRight), not by an on-screen button; a control that is invisible to the pointer user must still be reachable and named for assistive technology. |

### The rule that governs every view

**What must be read is never tilted; what is tilted never needs to be read.** The book's own body
text is texture; the memory that must be legible sits on a near-frontal plane. This was learned by
building the opposite first and finding it unreadable.

### Measured before committing

The dark palette this direction needs was checked rather than assumed: firefly and label colours
score **6.25–13.32** against the forest ground, and book-spine text **6.70–7.50** against its
fill — every value clears WCAG AA. `PALETTE` in `CertaintyBadge.tsx` is light-only today, so
adopting this costs a dark set and an extension to `tests/certainty.spec.ts`.
