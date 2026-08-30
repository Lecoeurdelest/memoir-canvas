---
id: TASK-024
title: The audit panel
branch: C
day: 4
depends_on: [TASK-009]
status: done
---

# TASK-024 — The audit panel

| | |
|---|---|
| **Branch** | C · panels/ + seed/ + content |
| **Planned day** | Day 4 |
| **Depends on** | `TASK-009` |
| **Requirements** | [`FR-AUDIT`](../requirements/functional/FR-AUDIT-audit-trail.md), [`NFR-OBS`](../requirements/non-functional/NFR-OBS-observability.md) |

## Goal

A chronological log, readable by a non-technical person, filterable by tool.

## In scope

- a timeline
- filter by tool and by actor
- show `registered_because`

## Out of scope

- not a JSON dump

## Acceptance criteria

- [x] Someone who does not write code can read it
- [x] Blocked operations appear clearly with their reason
- [x] The sequence of events can be reconstructed after the demo

## Files touched

- `src/panels/AuditTrail.tsx`

## Notes

A judge will open this panel. It is the evidence for what the project argues.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-024`
3. Write `docs/implement/IMPL-TASK-024.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
