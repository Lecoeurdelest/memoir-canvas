# 04. Stateful tool registration

> **Status:** implemented for `TASK-013`; React lifecycle wiring and `registered_because`
> propagation remain follow-up work.

## What This Document Answers

The project's strongest WebMCP-native detail: the tool list changes with what the user is
looking at.

`src/mcp/registry.ts` exports a pure `toolsFor(input)` function. The input is the current
`uiState` plus two derived sets from the read model: subjects with a row in
`v_open_disagreement`, and conflict ids whose status is still `open`. The registry does not
touch the DOM, the agent API, or the database.

## Registration Table

| Tool | Archive | Person open | Person has disagreement | Conflict open | Resolved |
|---|:--:|:--:|:--:|:--:|:--:|
| `read_memory_graph` | yes | yes | yes | yes | yes |
| `add_person` | yes | yes | yes | yes | yes |
| `add_memory_claim` | yes | yes | yes | yes | yes |
| `link_claim_to_source` | yes | yes | yes | yes | yes |
| `generate_story_card` | yes | yes | yes | yes | yes |
| `flag_conflict` | no | no | yes | yes | no |
| `propose_followup_question` | no | no | no | yes | no |
| `resolve_claim` | no | no | no | yes | no |

The switch-off cases matter as much as the switch-on cases. Once a conflict is closed, both
`resolve_claim` and `propose_followup_question` disappear; returning to the archive removes all
three conditional tools.

## Boundaries

Do not scatter `registerTool()` / `unregisterTool()` across components. `toolsFor(input)`
returns the whole set, and `src/mcp/modelContext.ts` is the only adapter that knows how to hand
that set to the browser API.

`registered_because` is not fully threaded yet. `src/store/uiState.ts` can describe the UI
state, and `CommandContext` carries the string, but the React lifecycle wiring that supplies it
on every tool call is still pending.

## Related Requirements

- `FR-REG`
- `.agent/rules/invariants.md` (R4)
