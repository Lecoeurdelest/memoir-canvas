---
id: TASK-008
title: The command layer
branch: B
day: 2
depends_on: [TASK-003, TASK-004]
status: todo
---

# TASK-008 — The command layer

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 2 |
| **Depends on** | `TASK-003`, `TASK-004` |
| **Requirements** | [`FR-MCP`](../requirements/functional/FR-MCP-tool-surface.md), [`NFR-TRUST`](../requirements/non-functional/NFR-TRUST-epistemic-integrity.md), [`NFR-OBS`](../requirements/non-functional/NFR-OBS-observability.md) |

## Goal

`src/domain/commands.ts` — **the single write door**. Humans and agents call the same functions (R2).

## In scope

- one function per domain operation
- every function takes `actor: 'human' | 'agent'`
- every function opens a transaction
- every function writes `audit_event` in that same transaction

## Out of scope

- no UI logic
- not called directly from the view — through props / handlers

## Acceptance criteria

- [ ] No SQL exists outside this file and `projection.ts`
- [ ] A failing command rolls back cleanly, leaving no half state
- [ ] `resolveClaim` called from the UI button and from the tool handler behaves identically

## Files touched

- `src/domain/commands.ts`

## Notes

**R2 lives here.** This is the most important file in the repo after `schema.sql`. If you can only review one file, review this one.

## When it is done

1. `npm run typecheck` · `npm test` · `npm run db:verify`
2. `npm run test:evidence -- TASK-008`
3. Write `docs/implement/IMPL-TASK-008.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
