# 03. WebMCP integration

> **Status:** outline. Write it out when the corresponding task reaches it — do not write it
> ahead of time; six days leaves no room for speculative documentation.

## What this document answers

How the page exposes tools to an agent, and how to survive the API name not being settled.

## Outline

- `navigator.modelContext` vs `document.modelContext` — the current state and how the shim handles it
- `provideContext()` vs `registerTool()`: why whole-set replacement is the right semantics
- Writing `inputSchema` for an agent to read, not for a human
- Runtime validation: never trust `args`
- Return values carry facts and certainty, **never a verdict**
- The manual tool panel: insurance for the demo video

## Related requirements

- `FR-MCP`
- `NFR-PORT`
- `NFR-SEC`
