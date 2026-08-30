---
id: TASK-005
title: Freeze the eight tool descriptors
branch: B
day: 1
depends_on: [TASK-004]
status: todo
---

# TASK-005 — Freeze the eight tool descriptors

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 1 |
| **Depends on** | `TASK-004` |
| **Requirements** | [`FR-MCP`](../requirements/functional/FR-MCP-tool-surface.md), [`NFR-SEC`](../requirements/non-functional/NFR-SEC-security.md) |

## Goal

`src/mcp/descriptors.ts` — name, description and JSON Schema `inputSchema` for all eight tools. Descriptions are written **for the agent to read**, not for humans.

## In scope

- 8 complete descriptors
- JSON Schema for every parameter
- descriptions that state what each tool refuses to do

## Out of scope

- handlers come later (`TASK-011`)
- the registry comes later (`TASK-012`)

## Acceptance criteria

- [ ] Every descriptor has a valid `inputSchema`
- [ ] `docs/API_SCHEMA.md` matches word for word
- [ ] The `resolve_claim` description states plainly that it requires a named person

## Files touched

- `src/mcp/descriptors.ts`
- `docs/API_SCHEMA.md`

## Notes

**Frozen file.** Tool descriptions are what the model reads when deciding which tool to reach for — write them carefully, they shape agent behaviour more than people expect.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-005`
3. Write `docs/implement/IMPL-TASK-005.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
