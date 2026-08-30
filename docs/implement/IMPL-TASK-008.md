---
task: TASK-008
status: done
date: 2026-08-30
author: Lecoeurdelest
---

# IMPL-TASK-008 — The command layer

## What was built

`src/domain/commands.ts` is the only place SQL is written outside `projection.ts`. Every command
runs in one transaction, assumed as the caller's role, carrying its `audit_event` — and, on
failure, writing a second row recording the attempt. The Confirm button on a torn page calls
`commands.resolveClaim` directly, so the human path and the tool path are the same function with
the same checks and the same refusals.

## Acceptance criteria

- [x] No SQL exists outside this file and `projection.ts`
- [x] A failing command rolls back cleanly, leaving no half state
- [x] `resolveClaim` called from the UI button and from the tool handler behaves identically

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-008-junit.xml` — 2 cases in `tests/core-loop.spec.ts` |
| Identical behaviour | asserted as string equality: the button's thrown message and the tool's `error.message` are compared directly, not described as similar |
| Rollback | `linkClaimToSource` fails on `source_oral_needs_a_voice`; the source count is unchanged, so the source insert rolled back with the evidence insert |
| Isolation | `npm run arch:check` — R2 and R3 green |

## Deviations

**The Confirm button asks who is deciding.** `resolveClaim` requires `resolved_by`, so a button
that just said "Confirm" would have had to invent a person or fail. The torn page carries a
selector listing only people with `created_by='human'` — the same rule `claim_confirmed_by_a_human`
enforces in SQL — and Confirm stays disabled until one is chosen, with the reason stated. The
constraint became the interface rather than an error to hit.

**Both competing claims get an identical Confirm control.** The button is on each claim, enabled
by the same condition, so the UI does not pre-select a winner any more than the data does.

**`resolveClaim` grew three checks and a role.** Documented in `IMPL-TASK-014`; the acceptance
criterion here is about the two paths agreeing, and they agree because there is only one function.

## Known gaps

- The UI has no path to `dismiss` a conflict flagged in error — `resolveClaim` is the only exit,
  and it supersedes a claim. Same gap as `IMPL-TASK-014`.
- Nothing in the UI writes claims, sources or people; those still go through the tool panel. The
  Confirm button is the only genuine UI write path so far.
- `RefusedError` messages are English (see `IMPL-TASK-024`).

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☑ | untouched by the button: it calls the command, not a handler |
| R2 — shared write door | ☑ | the point of this task, and asserted rather than asserted-about |
| R3 — only the command layer touches the database | ☑ | `arch:check` green |
| R4 — the registry is a pure function | ☐ | untouched |
| R5 — the view layer is read-only | ☑ | `Tear.tsx` writes only by calling `commands.resolveClaim`, which R5 explicitly permits |

## Files changed

- `src/domain/commands.ts`
- `src/view/Tear.tsx` — the Confirm control and the person selector
- `src/app.css`
- `tests/core-loop.spec.ts`
