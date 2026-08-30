---
id: TASK-022
title: The evidence panel
branch: C
day: 3
depends_on: [TASK-010, TASK-021]
status: done
---

# TASK-022 — The evidence panel

| | |
|---|---|
| **Branch** | C · panels/ + seed/ + content |
| **Planned day** | Day 3 |
| **Depends on** | `TASK-010`, `TASK-021` |
| **Requirements** | [`FR-EVID`](../requirements/functional/FR-EVID-evidence-sources.md) |

## Goal

The right-hand page of each spread: sources, excerpts, stance, label.

## In scope

- source list with `stance`
- show `verbatim` exactly
- image viewing

## Out of scope

- no mutation — read-only (R5)

## Acceptance criteria

- [x] A `contradicts` source appears clearly and is never hidden
- [x] `verbatim` is shown exactly, never summarised

## Files touched

- `src/panels/EvidencePanel.tsx`

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-022`
3. Write `docs/implement/IMPL-TASK-022.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
