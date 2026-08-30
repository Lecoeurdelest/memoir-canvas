---
id: TASK-013
title: Stateful tool registration
branch: B
day: 3
depends_on: [TASK-010, TASK-012]
status: done
---

# TASK-013 — Stateful tool registration

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 3 |
| **Depends on** | `TASK-010`, `TASK-012` |
| **Requirements** | [`FR-REG`](../requirements/functional/FR-REG-stateful-registration.md) |

## Goal

Make `toolsFor(uiState)` a genuine **pure function**, filtering by what the user is looking at.

## In scope

- five base tools always on
- `flag_conflict` only when the open subject has a disagreement
- `propose_followup_question` and `resolve_claim` only while that specific conflict is open
- leave `registered_because` plumbing for a later audit pass

## Out of scope

- do not scatter register/unregister across components

## Acceptance criteria

- [x] The function tests without a DOM and without an agent
- [x] The table in `docs/technical/04-stateful-registration.md` matches real behaviour
- [x] Closing the conflict page makes `resolve_claim` disappear from the list
- [x] `grep -rn 'provideContext(' src/` shows only `registry.ts` and `modelContext.ts`

## Files touched

- `src/mcp/registry.ts`
- `src/store/uiState.ts`

## Notes

**This is the project's strongest WebMCP-native detail.** It has to appear early in the demo video.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-013`
3. Write `docs/implement/IMPL-TASK-013.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
