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
