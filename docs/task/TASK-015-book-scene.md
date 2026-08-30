---
id: TASK-015
title: The 3D book scene
branch: A
day: 2
depends_on: [TASK-001]
status: superseded
superseded_by: TASK-030
---

# TASK-015 — The 3D book scene

| | |
|---|---|
| **Branch** | A · view/ |
| **Planned day** | Day 2 |
| **Depends on** | `TASK-001` |
| **Requirements** | [`FR-BOOK`](../requirements/functional/FR-BOOK-book-canvas.md), [`NFR-PORT`](../requirements/non-functional/NFR-PORT-webview-portability.md) |

## Goal

R3F scene, book mesh, lighting, camera. Runs on **fixture data**, waiting for nothing below it.

## In scope

- an R3F canvas
- book mesh and lighting
- camera controls
- local fixture data

## Out of scope

- not wired to the store yet (`TASK-016`)
- no physics simulation for page turns

## Acceptance criteria

- [ ] The book appears and can be rotated
- [ ] The first frame does not need WebGL — 3D loads afterwards
- [ ] Holds at or above 30 fps on a mid-range device

## Files touched

- `src/view/Book.tsx`
- `src/view/scene.ts`
- `src/view/fixtures.ts`

## Notes

Branch A starts on day 2 and is blocked by nobody. The largest WebGL risk sits in this task.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-015`
3. Write `docs/implement/IMPL-TASK-015.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`

## Superseded 2026-08-30 — by `TASK-030`

The direction changed after the DAY 4 GATE: the book opens into a **road**, and `TASK-030` builds
it in CSS perspective rather than WebGL.

Measured before deciding, against this repo's own `node_modules`: `three` + `@react-three/fiber`
in a production Vite build costs **+212 kB gzipped** over a React-only baseline, ~222 kB with the
drei helpers a scene needs. `three` does not tree-shake under R3F — R3F does `import * as THREE`
and `extend(THREE)` — so that is the floor. Against a 47 kB gz entry chunk, and with
`troika-three-text` blocked by the shipped CSP for hard-coding a jsdelivr font URL, the scene
would have cost 4.7× the app to deliver worse Vietnamese text.

`src/view/Book.tsx` remains a stub and is now dead. Deleting it is deferred to keep this
supersession legible in the tree.
