---
task: TASK-011
status: done
date: 2026-08-30
author: Lecoeurdelest
---

# IMPL-TASK-011 — The eight tool handlers

## What was built

All eight handlers validate and delegate; none answers "not implemented" any more.
`read_memory_graph` reads through `store/projection.ts` and returns every claim with its label
and nothing resembling a verdict. `generate_story_card` delegates to a new command that computes
`floor_certainty` from the cited claims. `link_claim_to_source` was wired to the command that
already existed. Argument validation gained `strArray` and `int`, so the fields the descriptors
advertise are enforced rather than silently dropped.

## Acceptance criteria

- [x] `grep -iE 'insert |update |select ' src/mcp/handlers.ts` returns nothing
- [x] Badly typed arguments produce a structured error, not a crash
- [x] The `flag_conflict` return value does not say which claim is right

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-011-junit.xml` — 6 handler cases in `tests/handlers.spec.ts` |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — 12/12 |
| Invariants | `npm run arch:check` — R2 green (no SQL in this file) |

## Deviations

**`add_memory_claim` no longer asserts the certainty it returned.** It read back
`certainty: 'oral'` as a literal, which was wrong for a human caller and, more importantly, was
the same shape of lie as an agent writing its own `actor` — a handler reporting what it *meant*
to write rather than what the row says. It now reads the stored label back through
`commands.claimCertainty()`.

**Three advertised fields were being dropped.** `add_person` discarded `aka` and `note`;
`add_memory_claim` discarded `year_min` and `year_max`. The descriptors are a frozen contract, so
the handler was the thing that was wrong.

**No descriptor-driven validator yet.** `NFR-SEC-01`'s amended text asks for validation against
each tool's `inputSchema`. What landed is hand-written per handler, which is equivalent for the
current eight but will drift. Left as a known gap rather than claimed.

## Known gaps

- Validation is per-handler rather than generated from `inputSchema` (`NFR-SEC-01`).
- `str(o, key)` still casts enum-valued arguments through `as never`; a bad `stance` or
  `subject_kind` reaches the database and is refused there rather than in the handler. The
  refusal is correct but the message is a Postgres enum error, not a readable one.
- Argument-validation refusals throw before the command layer, so they leave no `audit_event`
  (see `IMPL-TASK-009` → Known gaps).

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☑ | every tool an agent can reach is defined here and nowhere else |
| R2 — shared write door | ☑ | no SQL in this file; every write delegates to `commands.*`, verified by `arch:check` |
| R3 — only the command layer touches the database | ☑ | `read_memory_graph` goes through `store/projection.ts`, not `db.ts` |
| R4 — the registry is a pure function | ☐ | untouched |
| R5 — the view layer is read-only | ☐ | untouched |

## Files changed

- `src/mcp/handlers.ts`
- `src/domain/commands.ts` — `generateStoryCard`, `claimCertainty`
- `tests/handlers.spec.ts`
