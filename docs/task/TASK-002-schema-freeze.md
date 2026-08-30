---
id: TASK-002
title: Freeze the data schema
branch: B
day: 1
depends_on: [TASK-001]
status: done
---

# TASK-002 — Freeze the data schema

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 1 |
| **Depends on** | `TASK-001` |
| **Requirements** | [`FR-MEM`](../requirements/functional/FR-MEM-memory-graph.md), [`FR-CLAIM`](../requirements/functional/FR-CLAIM-claims-certainty.md), [`FR-EVID`](../requirements/functional/FR-EVID-evidence-sources.md), [`FR-CONF`](../requirements/functional/FR-CONF-conflicts.md), [`NFR-TRUST`](../requirements/non-functional/NFR-TRUST-epistemic-integrity.md) |

## Goal

Settle `src/domain/schema.sql`: 10 tables, 8 enums, the three core constraints, the constraint trigger, and the disagreement view.

## In scope

- the full DDL
- `v_open_disagreement`
- `assert_evidence_backed()` plus a DEFERRABLE constraint trigger
- indexes

## Out of scope

- PGlite bootstrap comes later (`TASK-003`)
- seeding comes later (`TASK-007`)

## Acceptance criteria

- [x] The schema runs end to end on PGlite without error
- [x] All 8 enum types exist
- [x] The constraint trigger exists and is DEFERRABLE
- [x] `npm run db:verify` green at 10/10

## Files touched

- `src/domain/schema.sql`
- `scripts/verify-constraints.mjs`

## Notes

**Frozen file.** After this task, changing it requires a new task and a heads-up to the team. It is the contract all three branches build against.

## When it is done

1. `npm run typecheck` · `npm test` · `npm run db:verify`
2. `npm run test:evidence -- TASK-002`
3. Write `docs/implement/IMPL-TASK-002.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
