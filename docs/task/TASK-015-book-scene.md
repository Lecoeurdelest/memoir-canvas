---
id: TASK-015
title: The 3D book scene
branch: A
day: 2
depends_on: [TASK-001]
status: todo
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
