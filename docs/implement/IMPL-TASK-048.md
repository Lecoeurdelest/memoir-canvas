---
task: TASK-048
status: done
date: 2026-09-03
author: Claude (with the owner approving each design revision)
---

# IMPL-TASK-048 — The forest becomes a moonlit meadow

## What was built

The first screen now paints the approved direction-C canvas: a deterministic SVG night-meadow
(starfield, nebula, a rim-lit moon, a horizon treeline that opens in the middle, rolling hills
with moonlit crests, glowing flowers) on the existing three parallax planes, with a transparent
three.js canvas giving the ambient fireflies real GPU motion. The owner's firefly language
replaced the certainty palette in the picture only: white = an empty place you press to tell a
memory, orange-red = a story in open conflict, green = a told story with brightness scaling by
story length. Every interactive light stays a DOM button with its 44px target, keyboard order
and accessible name (which still announces certainty), and the whole GL layer is `aria-hidden`
decoration that falls back to the TASK-034 CSS fireflies when WebGL is missing or lost.

## Acceptance criteria

- [x] Every spread is one light; gaps (open questions + silences) are white lights; counts match
- [x] Conflict is findable without reading: orange-red, fastest blink, meadow darkens behind it
- [x] Green brightness increases monotonically with story length, same hue family
- [x] Clicking a white light opens the blank page for that question/year (verified in the live app)
- [x] Keyboard, focus order, hover-only names and `prefers-reduced-motion` behave as in TASK-040/044
- [x] Without WebGL the forest still renders complete and interactive (CSS fallback path)
- [x] `npm run typecheck`, `npm test` (190/190), `npm run arch:check` all green

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-048-junit.xml` |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — N/A (no schema or command change) |
| Live check | dev server + browser: white light → blank page, green light → cover, a11y tree names every light |

## Deviations

- **three.js, not React Three Fiber.** The stack doc names r3f, but its dependencies were removed
  in TASK-026/035. For one point cloud, raw `three` is smaller and has no reconciler cost; r3f
  would earn its weight only if more of the scene moved into GL.
- **`trees()` and the trunk planes were removed** together with their budget test — the meadow
  scenery supersedes them (announced in the task doc). The density budget lives on as the
  `sparse` flag in `forestArt` and the reduced GL swarm.
- **Parallax rates and `TRAVEL_LIMIT` shrank ~10×.** The trunk wall was a tileable texture that
  could sweep 750px; the meadow is one composed picture. Plane overscan in `app.css` is sized to
  the new numbers; one TASK-040 test was updated to drag within the new limit.
- **Light band moved from y 26–82% to 60–84%** — a memory floating in the sky read as a star.

## Known gaps

- The torn (grey) meadow state is covered by tests and palette-swapped art, but was not
  screenshot-verified against the mockup's ConflictState artboard.
- `storyLength` counts characters of both language bodies; a card written in one language only
  glows about half as bright as a fully bilingual one. Acceptable while seed content is bilingual.

## Follow-up: the ring (same day, owner's ask)

The world became SCENE_COUNT (5) scenes of the same night joined in a loop: three scenery
strips (sky 0.35×, meadow 1×, foreground 1.3×) each drawn once across the whole ring with a
`<use>` clone one loop over, wrapped by `wrapOffset` at their own rate — so a horizontal drag
pans forever with no visible seam, while the vertical walk stays clamped. Ridges and hills
close their own loops (last point = first). Each scene keeps the shared style with its own
furniture: the moon scene, the left grove, the flower field, the heavy canopy, the lone giant
pine. The memory timeline now runs across the whole ring; lights wrap with the meadow, arrow
keys carry the world to the focused light, click-to-year maps through the wrapped world
position, and the GL swarm re-enters the opposite edge as it leaves. Verified by scripted mouse
drags across 1.3 loops: strips diverge by rate, wrap numerically exactly, no seam artifacts,
and the 1976 light stood at its world position after the crossing.

## Follow-up (same day, owner feedback on the live app)

Three fixes after the owner ran it on an ultrawide screen: the art's design-space width now
follows the stage aspect (`designWidth`) instead of a fixed 1440 — the fixed frame under `slice`
had blown the treeline into sparse shark fins; the GL swarm now rides the same lean-and-travel
parallax as the light layers (per-fly depth attribute), so dragging the terrain carries the
fireflies, and their vertical wander was halved so they hover instead of appearing to sink; and
wind arrived — grass clumps, flower clusters and the hanging canopy sway on CSS keyframes with
x-staggered delays so gusts travel across the meadow, clouds drift, shooting stars flash briefly
instead of standing as scratches. All wind stops under `prefers-reduced-motion`.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | No agent surface changed |
| R2 — shared write door | ☐ | No writes added; white lights reuse existing `setOpenQuestion`/`setOpenYear` UI state |
| R3 — only the command layer touches the database | ☐ | View reads the projection only |
| R4 — the registry is a pure function | ☐ | `uiState` transitions unchanged |
| R5 — the view layer is read-only | ✅ | New files render from props/projection; the GL canvas draws and decides nothing |

## Files changed

- `src/view/forestArt.tsx` (new)
- `src/view/FirefliesGL.tsx` (new)
- `src/view/forestLayout.ts`
- `src/view/Forest.tsx`
- `src/app.css`
- `tests/forest.spec.ts`, `tests/forestTones.spec.ts` (new)
- `package.json`, `package-lock.json` (+ `three`, `@types/three`)
- `docs/task/TASK-048-the-forest-becomes-a-meadow.md` (new)
