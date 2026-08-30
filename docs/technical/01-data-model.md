# 01. Data model

> **Status:** outline. Write it out when the corresponding task reaches it — do not write it
> ahead of time; six days leaves no room for speculative documentation.

## What this document answers

Why no table holds “truth”, and how three constraints turn the project's argument into something the database enforces.

## Outline

- The ten tables and why each one exists
- **`person` has no birth year** — the pivotal decision; a birth year is a `claim`
- The `claim` table as a light EAV: polymorphic subject, text predicate, person/place/text/year object
- The `certainty` enum is ordered, so `floor_certainty` is a `min()` rather than a hand-written map
- The three core constraints, with full SQL
- `year_precision`, and why `circa` is a first-class citizen
- The trade-off: `predicate` is free text with no foreign key — the list is pinned in TypeScript, not SQL

## Related requirements

- `FR-MEM`
- `FR-CLAIM`
- `FR-EVID`
- `NFR-TRUST`
