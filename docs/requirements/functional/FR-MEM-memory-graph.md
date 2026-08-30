---
id: FR-MEM
title: Memory graph
type: functional
status: draft
---

# FR-MEM — Memory graph

## Intent

The system stores people, places and the assertions joining them, so that no statement can exist without somewhere to attach evidence.

## Requirements

| ID | Requirement |
|---|---|
| `FR-MEM-01` | A `person` can be created with a display name alone; no other field is required. |
| `FR-MEM-02` | `person` has **no birth-year column**. A birth year must be a `claim`. |
| `FR-MEM-03` | A `place` can be created with a name and an optional administrative area. |
| `FR-MEM-04` | Every record carries `created_by`, recording whether a human or an agent made it. |
| `FR-MEM-05` | The whole graph is readable in one call so an agent can take context. |

## Acceptance

This requirement is met when every row above has at least one corresponding test, and that
test appears in some `docs/implement/evidence/TASK-*-junit.xml`.

## Related

- `docs/technical/01-data-model.md`
- `src/domain/schema.sql`
