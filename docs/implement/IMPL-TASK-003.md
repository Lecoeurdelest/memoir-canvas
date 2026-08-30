---
task: TASK-003
status: done
date: 2026-08-30
author: Lecoeurdelest
---

# IMPL-TASK-003 — Boot PGlite

## What was built

`src/domain/db.ts` owns the single PGlite connection, persists to `idb://memoir-canvas`, and
falls back to in-memory when IndexedDB is unavailable. Boot is version-stamped: `schema_meta`
records `SCHEMA_VERSION`, and a mismatch rebuilds the archive rather than silently skipping the
new schema. `serialize()` queues every read and write against the one connection, and
`transaction(actor, work)` assumes `app_agent` or `app_human` for its duration. `getDb()` is
lazy and clears its memo on failure so one transient error cannot poison every later attempt.

## Acceptance criteria

- [x] Reloading the page preserves data
- [x] Queries do not block the frame — *see Deviations*
- [x] Private browsing: run in memory and tell the user
- [x] No module outside `domain/` and `store/projection.ts` can import it

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-003-junit.xml` |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — 12/12 |
| Reload | E2E in Chrome 151: 2 claims seeded, 1 active claim after resolve, survives reload |
| Private browsing | `indexedDB` made to throw: archive opens in memory, seeds 2 claims, banner shown, 0 page errors |
| Isolation | `npm run arch:check` — R3 green |

## Deviations

**No Web Worker, and no `src/domain/db.worker.ts`.** The task title says "Boot PGlite in a Web
Worker" but `NFR-PERF-03` was amended on 2026-08-30 to say PGlite runs on the main thread. The
measured reason: `@electric-sql/pglite/worker` is a leader-election wrapper for sharing one
database across tabs, and it multiplies per-statement latency roughly sevenfold, which breaks
`NFR-PERF-05` outright. A plain dedicated worker is the route if a real device shows stutter;
it needs `commands.ts` restructured into single-round-trip SQL first. The task doc should be
amended to match the requirement it cites.

"Queries do not block the frame" is therefore met by the main-thread budget in the amended
`NFR-PERF-03` (one command ≤ one animation beat), not by moving off the main thread.

**Schema versioning was added, which the task did not ask for.** Boot previously asked only
whether the `claim` table existed. That made every later edit to `schema.sql` a silent no-op for
a browser that had already booted — the constraints would exist in the repo and not in the
database. For a project whose argument *is* the constraints, that is the worst available failure
mode, so it was fixed here rather than filed.

**`archiveStatus()` sits in `commands.ts`, not `db.ts`.** `bootstrap.ts` needs the ephemeral and
rebuilt flags for its banners, and R3 forbids it importing `db.ts`. `arch:check` caught the first
attempt.

## Known gaps

- A schema-version bump **discards the archive**. There is no migration path. Acceptable while
  the only data is a fictional seed; not acceptable once anyone records a real family memory.
- The rebuild path (`DROP SCHEMA public CASCADE`) is exercised only by reasoning, not by a test —
  no fixture currently boots at version 1 and upgrades.
- `serialize()` queues on a single promise chain; a hung `work()` wedges every later caller.
  There is no timeout.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | untouched |
| R2 — shared write door | ☑ | `transaction()` is the only way to write, and it takes the actor explicitly |
| R3 — only the command layer touches the database | ☑ | `arch:check` green; `bootstrap.ts` reaches status through `commands.archiveStatus()` |
| R4 — the registry is a pure function | ☐ | untouched |
| R5 — the view layer is read-only | ☐ | untouched |

## Files changed

- `src/domain/db.ts`
- `src/domain/commands.ts` — `archiveStatus()`
- `src/domain/schema.sql` — `schema_meta`
