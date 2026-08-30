---
task: TASK-013
status: done
date: 2026-08-29
author: scaffold
---

# IMPL-TASK-013 — Stateful tool registration

## What was built

`src/mcp/registry.ts` exposes `toolNamesFor(input)` — a **pure function** taking `uiState` plus
two id sets derived from the read model (`subjectsWithDisagreement`, `openConflictIds`) and
returning the tool list.

Five base tools are always on. `flag_conflict` switches on when the open subject has a row in
`v_open_disagreement`. `propose_followup_question` and `resolve_claim` switch on only while the
user has one specific still-open conflict in view.

Because it is pure, it tests without a DOM, without an agent and without a database — seven
tests run in 6 ms.

## Acceptance criteria

- [x] The function tests without a DOM and without an agent
- [x] The table in `docs/API_SCHEMA.md` matches real behaviour
- [x] Closing the conflict page makes `resolve_claim` disappear from the list
- [x] `grep -rn 'provideContext(' src/` shows only `registry.ts` and `modelContext.ts`

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-013-junit.xml` — 7/7 |
| Typecheck | `npm run typecheck` — green |
| Invariants | `npm run arch:check` — R1–R5 clean |

The two most important tests are the last two: `resolve_claim` **disappears** once the conflict
is closed, and all three conditional tools disappear on returning to the archive. A tool
switching off is the part worth showing, not a tool switching on.

## Deviations

The task described `toolsFor(uiState)` taking one argument. In practice it takes a
`RegistryInput` of `ui` plus two derived id sets, because answering "does this subject have a
disagreement?" needs data — and folding that data into `uiState` would muddy the meaning of
"what the user is looking at" and break the function's purity.

Both sets are derived by `src/store/projection.ts`, so the registry still never touches the
database.

## Known gaps

- `provideContext()` is not yet wired into the React lifecycle — `src/main.tsx` still has a
  TODO. It needs to subscribe to `uiState` and re-provide on every change.
- `registered_because` has a `describeUiState()` helper in `src/store/uiState.ts` but is not yet
  threaded systematically from the handler down into `commands.ts`.
- Not yet tested against a real agent inside the in-app browser — waiting on `TASK-006` to
  settle the API name.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☑ | the registry decides what the agent can see; there is no other path |
| R2 — shared write door | ☐ | |
| R3 — only the command layer touches the database | ☑ | the registry receives id sets from the projection; it never queries |
| R4 — the registry is a pure function | ☑ | **this is the task** — no side effects, no I/O |
| R5 — the view layer is read-only | ☐ | |

## Files changed

- `src/mcp/registry.ts`
- `src/store/uiState.ts`
- `tests/registry.spec.ts`
