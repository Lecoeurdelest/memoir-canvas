# 05. Projection and store

> **Status:** outline. Write it out when the corresponding task reaches it — do not write it
> ahead of time; six days leaves no room for speculative documentation.

## What this document answers

The read path: from PGlite up to React, one direction, no loop back.

## Outline

- Rebuilding wholesale after every write — why that is good enough at this scale
- The shape of the read model and its selectors
- `uiState` kept separate from domain data, because the registry depends on it
- R5 in practice: the signs that a view is quietly holding state

## Related requirements

- `NFR-PERF`
- `.agent/rules/invariants.md` (R5)
