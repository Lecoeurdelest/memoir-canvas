---
id: TASK-003
title: Boot PGlite in a Web Worker
branch: B
day: 1
depends_on: [TASK-002]
status: done
---

# TASK-003 — Boot PGlite in a Web Worker

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 1 |
| **Depends on** | `TASK-002` |
| **Requirements** | [`NFR-PERF`](../requirements/non-functional/NFR-PERF-performance.md), [`NFR-REL`](../requirements/non-functional/NFR-REL-reliability.md), [`NFR-PRIV`](../requirements/non-functional/NFR-PRIV-privacy-local-first.md) |

## Goal

`src/domain/db.ts` owns the single PGlite connection, runs it in a Web Worker, persists to IndexedDB, and lazy-loads after the first frame.

## In scope

- initialise PGlite with `idb://memoir-canvas`
- run `schema.sql` on first boot
- a queue that serialises writes (one connection)
- a `query` / `exec` / `transaction` API

## Out of scope

- do not use OPFS — it would drag in a COOP/COEP requirement
- do not expose the database outside `src/domain/`

## Acceptance criteria

- [x] Reloading the page preserves data
- [x] Queries do not block the frame
- [x] Private browsing: run in memory and tell the user
- [x] No module outside `domain/` and `store/projection.ts` can import it

## Files touched

- `src/domain/db.ts`
- `src/domain/db.worker.ts`

## Notes

R3 lives here. If this file leaks outward, the architecture stops meaning anything.

> **Amended 2026-08-30.** The title and `src/domain/db.worker.ts` are out of date: `NFR-PERF-03`
> now specifies the main thread, because the `@electric-sql/pglite/worker` wrapper multiplies
> per-statement latency ~7x and breaks `NFR-PERF-05`. See `IMPL-TASK-003.md` → Deviations.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-003`
3. Write `docs/implement/IMPL-TASK-003.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
