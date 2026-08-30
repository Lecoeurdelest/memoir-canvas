# 02. The command layer

> **Status:** outline. Write it out when the corresponding task reaches it — do not write it
> ahead of time; six days leaves no room for speculative documentation.

## What this document answers

R2 explained in full: why humans and agents must push the same door, and what that constrains in the design.

## Outline

- Function signatures: every command takes `actor: 'human' | 'agent'`
- Transaction boundaries: a command and its `audit_event` are inseparable
- Why handlers must stay thin and hold no SQL
- Error handling: database constraint failures surface as structured errors for the agent
- PGlite's single connection, the write queue, and why it is not a bottleneck at a few hundred rows

## Related requirements

- `FR-MCP`
- `NFR-TRUST`
- `NFR-OBS`
