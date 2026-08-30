---
task: TASK-030
status: done
date: 2026-08-30
author: Lecoeurdelest
---

# IMPL-TASK-030 — The road

## What was built

The archive now opens onto a road that recedes into the dark, with four stations spanning
1972–1995; travelling forward is travelling through the family's time. An open conflict stands a
torn sheet of paper across the way, and forward travel is refused by every route until a person
settles it.

The road is CSS perspective, not WebGL. `useSpreadNavigation` was extracted as the single
navigation truth — state, the wedge rule, and the `R4` `setUi` contract — so the road and the flat
list consume it rather than each owning a copy. `BookStage` picks the skin; `BookControls` holds
the real DOM controls both skins share; `CssBook` is now the escape hatch rather than a fallback.

Station content stays in flat DOM below the horizon: a person selector inside a transformed
subtree anchors native pickers to the untransformed rect in WKWebView, which is the browser
`NFR-PORT` names.

## Acceptance criteria

- [x] The archive opens onto a road with more than one station — four: 1972, 1976, 1981, 1995
- [x] Travelling forward works from the controls and from the keyboard
- [x] An open conflict blocks the road visibly, and forward travel is refused
- [x] The blockage is refused by **every** route, including the milestone list
- [x] Backward travel is always allowed — the reader is never trapped
- [x] Resolution clears the way
- [x] The app paints and stays painted with WebGL unavailable
- [x] Vietnamese diacritics render correctly
- [x] The entry chunk does not regress — 145.37 kB / 46.97 kB gz, unchanged

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-030-junit.xml` — 60 passing, 9 files |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — 12/12 (`loadSeed.ts` writes through `commands.ts`) |
| Invariants | `npm run arch:check` — 5/5 |
| Browser | `docs/implement/evidence/road/*.png`, captured against the production build with the shipped CSP |

### Measured in Chrome, against `dist/` served with `public/_headers`

| Check | Result |
|---|---|
| Stations on the road | `1972, 1976, 1981, 1995` |
| Travel | world transform `none` → `translateZ(260px)`; station advances to 1976 |
| Agent flags the conflict | road blocked, 1 torn sheet, 1 milestone in lacquer |
| Milestone list beyond the tear | all three `aria-disabled="true"` |
| Click the last milestone while blocked | stays at 1972 |
| Agent calls `resolve_claim` | refused, verbatim reason rendered |
| Page errors / CSP violations / external requests | **0 / 0 / 0** |

### With WebGL disabled (`--disable-3d-apis`)

| Check | Result |
|---|---|
| `canvas.getContext('webgl')` | `null` |
| Canvas elements in the document | **0** |
| Road painted | yes, `perspective: 720px` |
| Travel still works | `translateZ(260px)`, station advances to 1976 |
| Page errors | 0 |

`NFR-PORT-01` is therefore satisfied by construction rather than by a fallback path: there is no
WebGL to lose.

## Deviations

**The process was inverted, and that is the significant deviation.** This task document, the
second `FR-BOOK` amendment and this record were all written *after* the code was committed
(`a66c2a9`). The repo requires the opposite order, and `.agent/workflows/implement-a-task.md` step
1 is explicit about it. Recorded here rather than tidied away. `TASK-031` and `TASK-032` were
written before any of their code, which is the correction.

**`TASK-015`/`016`/`017` superseded rather than implemented.** The WebGL cost was measured before
deciding: +212 kB gz for `three` + R3F, ~222 kB with drei, against a 47 kB gz entry chunk — and
`three` does not tree-shake under R3F because R3F does `import * as THREE` and `extend(THREE)`.
Reasoning in the second `FR-BOOK` amendment.

**The seed was changed.** `TASK-030` could not exist without it: `buildSpreads` grouped both
seeded claims into one spread, so the archive had exactly one station and nowhere to travel. Three
claims were added, all dated after 1974 so `spreads[0]` still means "the disputed group" for the
twelve positional assertions that depend on it. `tests/core-loop.spec.ts` — the DAY 4 GATE — passes
untouched.

**A live defect was fixed in passing.** `CssBook.tsx:78` was `onClick={() => setAt(i)}`, unguarded,
so the spine walked straight through a tear the book had just refused. It contradicted `FR-BOOK-03`
in shipped code. The rule now lives in one pure function every route calls.

## Known gaps

- **The milestone/plane fit is empirical.** `PLANE_ORIGIN` and `PLANE_GAP` in `Road.tsx` were measured by sweeping a probe strip down the ground plane in Chrome, because upright billboards in world Z and a rotated ground plane do not share an origin. Changing `GAP`, the plane's rotation or the stage height means re-measuring. This is commented at the constants.
- **Milestone years crowd near the vanishing point.** Mitigated by showing only the current station and three ahead, with distance fade. Not solved.
- **`src/view/Book.tsx`, `PageTurn.tsx`, `Constellation.tsx` are dead stubs.** Left in the tree so the supersession stays legible; they export `null` and nothing imports them.
- **No touch-drag travel.** Controls, keyboard and the milestone list only.
- **Not yet run on a physical phone.** `TASK-027` still owns that, and it is the one check that cannot be done from here.
- **The shell is still built for a judge, not a family** — `TASK-031`.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | Not touched; no new agent entry point. |
| R2 — shared write door | ☐ | The road writes nothing. `Tear.tsx` still calls `commands.resolveClaim`, the same function the tool calls. |
| R3 — only the command layer touches the database | ☑ | `loadSeed.ts` changed, and its new claims go through `commands.addMemoryClaim` / `linkClaimToSource` like the rest. No view file imports `db.ts`; `arch:check` green. |
| R4 — the registry is a pure function | ☑ | The `setUi` effect moved from `CssBook` into `useSpreadNavigation` **byte-identical in behaviour**. The registry's input is still a discrete station index — no animation state, no canvas, no rAF reaches it, so `toolNamesFor` stays testable without a DOM. |
| R5 — the view layer is read-only | ☑ | `Road`, `BookStage`, `BookControls`, `CssBook` read the projection and write only UI state. |

## Files changed

- `src/view/useSpreadNavigation.ts` (new)
- `src/view/BookStage.tsx` (new)
- `src/view/BookControls.tsx` (new)
- `src/view/Road.tsx` (new)
- `src/view/webgl.ts` (new)
- `src/view/CssBook.tsx`
- `src/Archive.tsx`
- `src/app.css`
- `src/seed/loadSeed.ts`
- `tests/navigation.spec.ts` (new)
- `tests/spreads.spec.ts`
