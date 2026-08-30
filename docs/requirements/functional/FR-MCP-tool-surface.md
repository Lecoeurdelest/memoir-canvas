---
id: FR-MCP
title: WebMCP tool surface
type: functional
status: draft
---

# FR-MCP — WebMCP tool surface

## Intent

Eight tools are the whole of what an agent can touch. There is no other way in.

## Requirements

| ID | Requirement |
|---|---|
| `FR-MCP-01` | Exactly eight tools: `read_memory_graph`, `add_person`, `add_memory_claim`, `link_claim_to_source`, `flag_conflict`, `propose_followup_question`, `resolve_claim`, `generate_story_card`. |
| `FR-MCP-02` | Each tool has a JSON Schema `inputSchema`; arguments are validated at runtime before reaching the command layer. |
| `FR-MCP-03` | Handlers contain **no SQL**. They delegate to `src/domain/commands.ts` (R2). |
| `FR-MCP-04` | Return values carry facts and certainty, **never a verdict**. |
| `FR-MCP-05` | Every tool call writes one `audit_event` in the same transaction as the write. |

## Acceptance

This requirement is met when every row above has at least one corresponding test, and that
test appears in some `docs/implement/evidence/TASK-*-junit.xml`.

## Related

- `docs/API_SCHEMA.md`
- `docs/technical/03-webmcp-integration.md`
