---
id: TASK-010
title: Projection and store
branch: B
day: 2
depends_on: [TASK-003, TASK-004]
status: todo
---

# TASK-010 — Projection and store

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 2 |
| **Depends on** | `TASK-003`, `TASK-004` |
| **Requirements** | [`NFR-PERF`](../requirements/non-functional/NFR-PERF-performance.md) |

## Goal

`src/store/projection.ts` reads PGlite into a read model; `src/store/store.ts` holds it for React.

## In scope

- rebuild the projection wholesale after every write
- the Zustand store holds only the projection
- selectors for the view and the panels

## Out of scope

- no incremental optimisation — a family archive is a few hundred rows

## Acceptance criteria

- [ ] The view re-renders correctly after every write
- [ ] The store holds no state that did not come from the database
- [ ] The projection is the view's only read path

## Files touched

- `src/store/projection.ts`
- `src/store/store.ts`
- `src/store/uiState.ts`

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-010`
3. Write `docs/implement/IMPL-TASK-010.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
