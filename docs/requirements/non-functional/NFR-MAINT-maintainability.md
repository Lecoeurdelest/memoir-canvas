---
id: NFR-MAINT
title: Maintainability
type: non-functional
status: draft
---

# NFR-MAINT — Maintainability

## Intent

Three people, six days, working in parallel. What kills a project like this is not ugly code — it is contracts drifting apart.

## Requirements

| ID | Requirement |
|---|---|
| `NFR-MAINT-01` | R1–R4 are checked mechanically by `npm run arch:check`; **R5 is enforced by review** plus a dependency rule (`view/` and `panels/` may import only `store/` and `domain/types`). The check must have zero false positives on the current tree, and must fail on: a write to any global object; any SQL or db handle in `handlers.ts`; any **static or dynamic** import of `domain/db.ts` from outside `domain/` and `store/projection.ts`; `provideContext` or `registerTool` outside `registry.ts` and `modelContext.ts`. |
| `NFR-MAINT-02` | `src/domain/schema.sql` and `src/mcp/descriptors.ts` are **shape-frozen** after TASK-002/TASK-005: no column, enum, table or tool may be renamed, removed or retyped. Additions are permitted only with a new task, a message to the team, `docs/API_SCHEMA.md` updated in the same PR, and — because `db.ts` applies the schema only to an *empty* database and there is no migration path — an explicit instruction for everyone to drop `idb://memoir-canvas`. A behavioural fix that can be made in `commands.ts` without DDL must be made there instead. |
| `NFR-MAINT-03` | Directory boundaries follow people boundaries: A owns `view/`, B owns `domain/`+`mcp/`+`store/`, C owns `panels/`+`seed/`. `src/main.tsx` is owned by B and is the only shared file; A and C add mount points there and nothing else. B publishes `domain/types.ts` and the shape of `store/` on day 1, **before** implementing them, so A and C are never blocked on B's internals. |
| `NFR-MAINT-04` | Every task on the demo-core path (TASK-002, 005, 008, 009, 011, 013, 014, 025) has a full `docs/implement/IMPL-*.md` with junit evidence. Every other finished task adds a dated two-line entry to `docs/implement/LOG.md` naming what was built and what is still missing. A task is not done without one or the other. |
| `NFR-MAINT-05` | `docs/_arch_map.md` is updated in the same PR whenever a file under `src/` is added or removed. |
| `NFR-MAINT-06` | TypeScript `strict`. No `any`, no `@ts-ignore`, and **no `as never` / `as unknown as T` escape hatches** — an unvalidated external value is narrowed by a runtime type guard that throws `RefusedError`, never by a cast. Enforced by a grep gate in `npm run arch:check`, not by review. |

## Acceptance

A newcomer reads `.agent/AGENTS.md` and can start a task without asking anyone.

## Related

- `.agent/rules/invariants.md`
- `docs/_arch_map.md`

## Amended 2026-08-30

- **-01** was false. `arch:check` implements no R5 check at all, catches 11 of 21 injected
  violations, and fires false FAILs on legal code (`window.devicePixelRatio === 2`; an English
  comment containing "select … from"). R5's core prohibitions — the view holding domain state,
  scattered `registerTool` — are structural, not lexical, and grep cannot see them. The requirement
  now says what is mechanical and what is not.
- **-02** as written forbade the very schema work TRUST and OBS need. Reconciled: freeze the
  *shape*, allow additions with a process. Also records the trap that `db.ts` runs `schema.sql`
  only when the `claim` table is missing, so any post-day-1 edit silently does not reach an
  already-booted browser.
- **-04** 27 further IMPL files is roughly 11 person-hours — a full day removed from each of three
  people, competing directly with the demo. The predictable failure is that day 3 skips the docs
  and the requirement becomes a lie. Narrowed to the eight tasks that carry the argument.
- **-06** `handlers.ts` satisfies "no `any`" while casting through `as never`, which gives up the
  same safety more quietly.
