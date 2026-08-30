---
id: TASK-004
title: Domain types
branch: B
day: 1
depends_on: [TASK-002]
status: todo
---

# TASK-004 — Domain types

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 1 |
| **Depends on** | `TASK-002` |
| **Requirements** | [`FR-CLAIM`](../requirements/functional/FR-CLAIM-claims-certainty.md), [`NFR-MAINT`](../requirements/non-functional/NFR-MAINT-maintainability.md) |

## Goal

`src/domain/types.ts` — TypeScript types mirroring the schema 1:1, the single source of types for the whole repo.

## In scope

- types for all 10 tables
- union types for the 8 enums
- a `CERTAINTY_ORDER` constant for comparing the ladder

## Out of scope

- do not re-declare domain types anywhere else

## Acceptance criteria

- [ ] `npm run typecheck` green
- [ ] Adding an enum value to the schema without updating types turns typecheck red at the use site

## Files touched

- `src/domain/types.ts`

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-004`
3. Write `docs/implement/IMPL-TASK-004.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
