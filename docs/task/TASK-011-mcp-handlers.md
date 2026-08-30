---
id: TASK-011
title: The eight tool handlers
branch: B
day: 2
depends_on: [TASK-005, TASK-008]
status: todo
---

# TASK-011 — The eight tool handlers

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 2 |
| **Depends on** | `TASK-005`, `TASK-008` |
| **Requirements** | [`FR-MCP`](../requirements/functional/FR-MCP-tool-surface.md), [`NFR-SEC`](../requirements/non-functional/NFR-SEC-security.md) |

## Goal

`src/mcp/handlers.ts` — validate arguments, then delegate to `commands.*`. No SQL.

## In scope

- 8 handlers
- runtime validation matching each `inputSchema`
- return values carrying facts and certainty

## Out of scope

- **no SQL in this file**
- **no verdict in any return value**

## Acceptance criteria

- [ ] `grep -iE 'insert |update |select ' src/mcp/handlers.ts` returns nothing
- [ ] Badly typed arguments produce a structured error, not a crash
- [ ] The `flag_conflict` return value does not say which claim is right

## Files touched

- `src/mcp/handlers.ts`

## Notes

R1 and R2 meet here. A thin handler is the sign the architecture is intact.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-011`
3. Write `docs/implement/IMPL-TASK-011.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
