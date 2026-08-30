---
id: TASK-025
title: Demo core running end to end
branch: B
day: 4
depends_on: [TASK-013, TASK-014, TASK-018, TASK-019, TASK-022]
status: done
---

# TASK-025 — Demo core running end to end

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 4 |
| **Depends on** | `TASK-013`, `TASK-014`, `TASK-018`, `TASK-019`, `TASK-022` |
| **Requirements** | [`NFR-TRUST`](../requirements/non-functional/NFR-TRUST-epistemic-integrity.md), [`FR-REG`](../requirements/functional/FR-REG-stateful-registration.md), [`FR-CONF`](../requirements/functional/FR-CONF-conflicts.md) |

## Goal

The core chain runs in one unbroken pass: `flag_conflict` → torn page → `propose_followup_question` → `resolve_claim` → healed tear.

## In scope

- an end-to-end test across the whole chain
- a screen recording of the chain in one take
- verify `resolve_claim` appears only at the right moment

## Out of scope

- —

## Acceptance criteria

- [x] The e2e test is green
- [x] **The whole chain can be screen-recorded in one unbroken take**
- [x] `resolve_claim` is absent before the conflict page is opened and after it is closed
- [x] The audit log records the full chain with `registered_because`

## Files touched

- `tests/core-loop.spec.ts`

## Notes

**DAY 4 GATE.** If it is not working by end of day 4, cut everything else to make it work. Every remaining task is decoration next to this one.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-025`
3. Write `docs/implement/IMPL-TASK-025.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
