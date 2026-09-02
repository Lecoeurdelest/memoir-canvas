# TASK-046 — WebMCP registration and the live interview loop

Status: done. Branch: `codex/webmcp-reliability`. Evidence: [IMPL-TASK-046](../implement/IMPL-TASK-046.md).

Register the existing eight tools on current `document.modelContext` hosts using asynchronous
`registerTool` and AbortSignal withdrawal. Retain legacy hosts without duplicate registration.
Resolve handlers and availability at invocation time, refresh the projection after agent writes,
and expose registration failures without preventing manual use of the archive.

Read results must include evidence links, family questions and answers, and story cards. Questions
the family can answer point at a claim as well as the conflict, so the attributed oral account can
be linked as a mention without choosing a winning claim or automatically confirming anything.

This task changes the frozen descriptions in `src/mcp/descriptors.ts` and updates
`docs/API_SCHEMA.md` with the same contract. No schema change. Team acknowledgment is required
before merging the descriptor change; this task does not merge or publish.

Acceptance: modern and legacy registration tests; stale invocation refusal; native tool writes
update the UI; claim-linked questions can be answered by humans but never agents; scoped reads keep
evidence and answers connected; a real in-app-browser discovery and invocation run succeeds.

Preserve R1–R5 and all database grants and constraints. Record evidence in IMPL-TASK-046.
