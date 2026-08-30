---
id: NFR-A11Y
title: Accessibility
type: non-functional
status: draft
---

# NFR-A11Y — Accessibility

## Intent

3D content excludes people easily. Rendering page content as DOM is precisely how we avoid that.

## Requirements

| ID | Requirement |
|---|---|
| `NFR-A11Y-01` | Page content is real DOM through `<Html transform>` — **without `occlude`**, which sets `display:none` on the wrapper and removes the content from the accessibility tree and from focus order. Verified by asserting the expected roles and names appear un-ignored in Chrome's accessibility tree (CDP `Accessibility.getFullAXTree`) both at rest **and** mid page-turn. |
| `NFR-A11Y-02` | Certainty labels do not rely on colour alone — they carry text and shape. |
| `NFR-A11Y-03` | Every action in the demo core is reachable from the keyboard. Page turns respond to ArrowLeft/ArrowRight and the tear is a focusable control with an accessible name; all tool invocation, evidence review and conflict confirmation happen in DOM panels **outside** the canvas and are keyboard-operable by construction. |
| `NFR-A11Y-04` | `prefers-reduced-motion` is honoured across **every** state-driven animation — page turns, the tear and the heal all become instant transitions. |
| `NFR-A11Y-05` | Text contrast meets WCAG AA against the page background. Because the 3D page background is a WebGL material that no DOM contrast checker can resolve (axe returns `incomplete`, ratio 0, for all `<Html>` text), the paper and ink colours are two shared constants used by **both** the three.js material and the DOM, and the AA ratio between them is asserted in a unit test. Automated contrast auditing of rendered output is claimed only for the CSS fallback book. |

## Acceptance

A recorded keyboard-only pass over `flag_conflict` → open the torn page → `resolve_claim` →
healed tear.

If TASK-017 slips, drop *turning pages* from the acceptance. Do not drop the panels: they are
where every decision is actually made.

## Related

- `FR-BOOK-book-canvas`

## Amended 2026-08-30

Measured against the installed drei, not assumed:

- **-01** `<Html transform>` does produce real, un-ignored accessibility nodes with correct names
  and correct sequential focus order — the stack was never the problem. But the `occlude` prop that
  `FR-BOOK-07` mandated sets `display:none` on the wrapper every frame the raycast is blocked,
  which deletes a page's heading and button from the AX tree, from tab order, and drops keyboard
  focus. A rotating page occludes itself past ~80°, so `occlude` and a page-turn animation cannot
  coexist with -01 and -03. **`FR-BOOK-07` was amended in the same edit.**
- **-03** the acceptance was an end-to-end keyboard walkthrough of a view layer that does not
  exist yet, owned by a branch carrying seven unbuilt tasks. Narrowed to what can be committed to
  honestly. The keyboard work itself is ~22 lines and was prototyped.
- **-04** widened from page turns alone: the tear and the heal are the more attention-grabbing
  motion and would have been exempt by omission.
- **-05** states how the claim is actually checkable, since no DOM tool can read a WebGL ground.
