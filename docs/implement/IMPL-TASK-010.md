---
task: TASK-010
status: done
date: 2026-08-30
author: Lecoeurdelest
---

# IMPL-TASK-010 — Projection and store

## What was built

`buildReadModel()` reads people, places, active claims, sources, conflicts, open disagreements
and story cards in one pass and derives the two sets the registry consumes
(`subjectsWithDisagreement`, `openConflictIds`). The Zustand store holds that model plus
`uiState`, and nothing else. Every write path calls `refresh()`, which rebuilds wholesale.

## Acceptance criteria

- [x] The view re-renders correctly after every write
- [x] The store holds no state that did not come from the database
- [x] The projection is the view's only read path

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-010-junit.xml` |
| Browser | E2E 21/21: flagging a conflict makes it appear in the nav, resolving makes it vanish, tools track both |
| Isolation | `npm run arch:check` — R3 green; only `projection.ts` and `domain/` import `db.ts` |

## Deviations

**`uiState` lives in the store but is not from the database.** That is deliberate and predates
this task: the registry is a pure function of what the user is looking at, and keeping that
separate from domain data is what makes `toolsFor()` testable without a DOM. The acceptance
criterion means no *domain* state is invented client-side.

**The store gained `cards`.** `TASK-023` needs them and the projection is the only read path.

**`read_memory_graph` reads through this projection**, not through `db.ts`, so a handler and the
UI cannot disagree about what the archive contains.

## Known gaps

- `refresh()` is called explicitly by each writer. A missed call leaves the UI stale, and nothing
  enforces it — the store does not subscribe to the database.
- The projection rebuilds everything on every write. Correct at this scale by `NFR-PERF-06`, and
  deliberately not optimised.
- No selector memoisation: every store change re-renders every subscriber.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | untouched |
| R2 — shared write door | ☐ | untouched |
| R3 — only the command layer touches the database | ☑ | `projection.ts` is the one read path outside `domain/`; `arch:check` green |
| R4 — the registry is a pure function | ☑ | the two derived sets are computed here, so `toolsFor()` stays pure |
| R5 — the view layer is read-only | ☑ | `Archive` and the panels read the model and write only through handlers |

## Files changed

- `src/store/projection.ts`
- `src/Archive.tsx`
- `src/mcp/handlers.ts`
