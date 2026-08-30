---
id: TASK-014
title: Detect and record conflicts
branch: B
day: 3
depends_on: [TASK-008, TASK-013]
status: todo
---

# TASK-014 — Detect and record conflicts

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 3 |
| **Depends on** | `TASK-008`, `TASK-013` |
| **Requirements** | [`FR-CONF`](../requirements/functional/FR-CONF-conflicts.md) |

## Goal

`flag_conflict` reads `v_open_disagreement`, writes `conflict` + `conflict_member`, and moves the claims to `conflicting`.

## In scope

- read the view, do not infer
- many-to-many through `conflict_member`
- member claims move to `conflicting`

## Out of scope

- no LLM, no inference engine

## Acceptance criteria

- [ ] No row in the view → throw and **write nothing**
- [ ] Three disagreeing recollections join one conflict, not three pairs
- [ ] No path exists for an agent to close a conflict

## Files touched

- `src/domain/commands.ts`
- `src/mcp/handlers.ts`

## When it is done

1. `npm run typecheck` · `npm test` · `npm run db:verify`
2. `npm run test:evidence -- TASK-014`
3. Write `docs/implement/IMPL-TASK-014.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
