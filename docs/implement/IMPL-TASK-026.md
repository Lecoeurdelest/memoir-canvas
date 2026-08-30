---
task: TASK-026
status: done
date: 2026-08-30
author: Lecoeurdelest
---

# IMPL-TASK-026 — The non-WebGL book

## What was built

`CssBook` renders the archive as a book in plain DOM: a spine of spreads in year order, one
spread showing recollection left and evidence right, and prev/next navigation. Zero `<canvas>`
elements — verified, not assumed. Turning to a spread sets the UI state, so the registry
(`R4`) follows the page: opening a torn one is what puts `resolve_claim` in the agent's hands.

## Acceptance criteria

- [x] The whole metaphor survives
- [x] The three layers below are untouched — thanks to R5
- [x] Costs no more than half a day

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-026-junit.xml` — 7 cases in `tests/spreads.spec.ts` |
| Browser | 19/19 in Chrome 151, including `0 canvas elements` |
| Isolation | `npm run arch:check` — R3, R5 green. `src/domain/`, `src/store/` and `src/mcp/` were not touched by this task |

## Deviations

**Built first, not as a contingency.** The task says "only build this if the primary path fails"
with a decision deadline at end of day 3. The amended `NFR-PORT-05` overrides that: a faithful
CSS 3D twin is out of scope for the submission, and the flat DOM book is required regardless
because `NFR-PORT-01` says the app must paint and stay painted without WebGL. It is also the only
version an automated test can read, which is why every acceptance check above exists at all.

**No `perspective` / `rotateY`.** The task describes a CSS 3D book. What shipped is a flat
spread. That is the amended scope, and pretending otherwise would put a 1.5–2 day animation on a
branch that has none.

**"The book cannot close" became "the book cannot turn forward".** Flat, there is no fold to
block. Turning *past* a torn spread is disabled with a stated reason; turning back is allowed, so
a reader is never trapped. The meaning is preserved: you cannot move on until a person decides.

**No feature flag.** The task asks for one. There is nothing to switch between yet — the R3F
book (`TASK-015`) does not exist. The flag belongs with whichever lands second.

## Known gaps

- No 3D book, so nothing selects between the two. `TASK-015` and the WebGL preflight in
  `NFR-PORT-01` are both still open.
- Keyboard: the spine and turn buttons are focusable and operable, but there are no
  ArrowLeft/ArrowRight shortcuts yet (`NFR-A11Y-03`).
- No page-turn animation, so `prefers-reduced-motion` has nothing to honour yet
  (`NFR-A11Y-04`).
- The spine shows a year per spread; a spread whose claims carry no year shows `—`.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | untouched |
| R2 — shared write door | ☐ | the book writes nothing |
| R3 — only the command layer touches the database | ☑ | reads `spreads` from the projection |
| R4 — the registry is a pure function | ☑ | the book sets UI state and nothing else; `toolsFor()` is unchanged and still pure |
| R5 — the view layer is read-only | ☑ | the only state is which spread is open, which is UI state by definition |

## Files changed

- `src/view/CssBook.tsx`
- `src/view/Spread.tsx`
- `src/store/projection.ts` — `spreads`
- `src/Archive.tsx`
- `src/app.css`
- `tests/spreads.spec.ts`
