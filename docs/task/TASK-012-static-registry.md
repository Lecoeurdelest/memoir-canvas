---
id: TASK-012
title: Static registry
branch: B
day: 2
depends_on: [TASK-006, TASK-011]
status: todo
---

# TASK-012 — Static registry

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 2 |
| **Depends on** | `TASK-006`, `TASK-011` |
| **Requirements** | [`FR-REG`](../requirements/functional/FR-REG-stateful-registration.md) |

## Goal

Register all eight tools unconditionally, so the write path works end to end before dynamic registration adds a variable.

## In scope

- `toolsFor()` returns all eight
- handed over with `provideContext()`

## Out of scope

- no `uiState` filtering yet (`TASK-013`)

## Acceptance criteria

- [ ] An agent can invoke all eight tools over WebMCP
- [ ] Every call leaves an `audit_event`

## Files touched

- `src/mcp/registry.ts`

## Notes

A deliberate intermediate step: prove the write path is open before adding the registration variable on top.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-012`
3. Write `docs/implement/IMPL-TASK-012.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
