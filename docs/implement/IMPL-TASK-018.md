---
task: TASK-018
status: done
date: 2026-08-30
author: Lecoeurdelest
---

# IMPL-TASK-018 — The conflict tear

## What was built

`Tear` renders if and only if the spread carries an open conflict. The competing claims go into
one grid of equal tracks, each rendered by the same component with no `primary` prop and no
ordering emphasis, so "neither visually favoured" is structural rather than a matter of care. The
torn spread is split down the gutter by a dashed red rip, and the book will not turn forward past
it.

## Acceptance criteria

- [x] The tear appears if and only if a `conflicting` claim exists
- [x] The book genuinely cannot close at that page
- [x] Both years appear side by side, neither visually favoured

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-018-junit.xml` — 3 cases in `tests/spreads.spec.ts` |
| Browser | measured in Chrome 151: the two competing panels are **163 px / 163 px** wide with identical `font-size`, `font-weight`, `background-color` and `border-color`; the next button is `disabled` and states why |
| Consequence of state | asserted both ways: no `.tear` in the DOM while the disagreement is only latent, one after `flag_conflict` |

## Deviations

**The tear is a rip along the gutter, not a torn-paper texture.** Flat DOM has no page to split
in half. A dashed red border down the spine plus a tinted left page carries the same reading, and
survives greyscale.

**"Neither visually favoured" is enforced by construction and asserted by measurement.** Both
claims render through one `CompetingClaim`, and the test compares computed width, type size,
weight, background and border rather than eyeballing them. Order is by year, which is the data's
order and not a ranking.

**The claims are ordered by year.** Any order is an implicit statement; year is the least
editorial one available, and it matches the spine.

## Known gaps

- The rip does not animate in. `FR-BOOK-06` requires it to be a consequence of state, which it is,
  but the moment currently happens between two renders with no transition.
- A spread with three or more competing claims wraps to a second row at narrow widths; the equal
  treatment survives, the side-by-side reading does not.
- Nothing draws the eye to a torn spread from another page except the red vertebra in the spine.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | untouched |
| R2 — shared write door | ☐ | the tear writes nothing; it renders a conflict someone else recorded |
| R3 — only the command layer touches the database | ☑ | reads the projection |
| R4 — the registry is a pure function | ☑ | the torn page sets `view: 'conflict'`, which is what registers `resolve_claim` |
| R5 — the view layer is read-only | ☑ | no state at all |

## Files changed

- `src/view/Tear.tsx`
- `src/view/Spread.tsx`
- `src/view/CssBook.tsx` — the wedge
- `src/app.css`
