# 07. Conflict lifecycle

> **Status:** outline. Write it out when the corresponding task reaches it — do not write it
> ahead of time; six days leaves no room for speculative documentation.

## What this document answers

From two assertions colliding to a human closing the case — and why the agent may not take that last step.

## Outline

- `v_open_disagreement`: eight lines of SQL instead of an inference engine
- `flag_conflict` reads the view and never infers; no row means nothing is written
- Why a conflict is a **row** rather than a computation
- `conflict_member` as many-to-many: three disagreeing recollections join one conflict
- `propose_followup_question`: turning uncertainty into something actionable
- Closing requires `resolved_by` — a database constraint, not a convention
- Later: catching contradictions beyond years, with sibling views of the same shape

## Related requirements

- `FR-CONF`
- `FR-QUES`
- `NFR-TRUST`
