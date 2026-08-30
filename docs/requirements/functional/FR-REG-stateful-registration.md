---
id: FR-REG
title: Stateful tool registration
type: functional
status: draft
---

# FR-REG — Stateful tool registration

## Intent

The agent's tool list changes with what the user is looking at. This is the project's strongest WebMCP-native detail.

## Requirements

| ID | Requirement |
|---|---|
| `FR-REG-01` | `toolsFor(uiState)` is a **pure function**, testable without a DOM and without an agent. |
| `FR-REG-02` | Five base tools are always available. |
| `FR-REG-03` | `flag_conflict` is available only when the open subject has a row in `v_open_disagreement`. |
| `FR-REG-04` | `propose_followup_question` and `resolve_claim` are available only while the user has that specific conflict open. |
| `FR-REG-05` | Handed over with `provideContext()` (whole-set replacement), not scattered `registerTool`/`unregisterTool` calls. |
| `FR-REG-06` | `audit_event.registered_because` records **why** the tool was available at call time. |

## Acceptance

This requirement is met when every row above has at least one corresponding test, and that
test appears in some `docs/implement/evidence/TASK-*-junit.xml`.

## Related

- `docs/technical/04-stateful-registration.md`
