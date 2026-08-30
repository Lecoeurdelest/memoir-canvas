---
id: NFR-TRUST
title: Epistemic integrity
type: non-functional
status: draft
---

# NFR-TRUST — Epistemic integrity

## Intent

The most important requirement in the project. It says the system *cannot* present a guess as a fact — not that it *should avoid* doing so, but that it cannot.

## Requirements

| ID | Requirement |
|---|---|
| `NFR-TRUST-01` | Every constraint protecting the argument is enforced by SQL — CHECK constraints, DEFERRABLE constraint triggers, and column-level GRANTs in `src/domain/schema.sql` — so that a **well-formed but dishonest** write from the application layer is still refused. The one thing SQL cannot verify is which actor typed a value; see *The boundary* below. |
| `NFR-TRUST-02` | `claim_confirmed_needs_a_human` — `certainty='confirmed'` requires `confirmed_at` and a `confirmed_by` pointing at a person whose `created_by='human'`. A person the agent created cannot sign for a fact. |
| `NFR-TRUST-03` | `claim_evidence_backed` — `document_supported` requires evidence with `stance='supports'` (constraint trigger, DEFERRABLE). |
| `NFR-TRUST-04` | `conflict_resolution_needs_a_human` — closing a conflict requires `winning_claim_id` + `resolved_by` + `resolved_at`, **and** the winning claim must be a member of that conflict. The `app_agent` role holds no UPDATE privilege on those columns, so the refusal is a privilege error, not a check. |
| `NFR-TRUST-05` | `npm run db:verify` drives `src/mcp/handlers.ts` against a fresh PGlite and asserts that each named constraint refuses a well-formed but dishonest **tool call**, not merely a malformed INSERT. It must be green on every commit. |
| `NFR-TRUST-06` | No write path into `claim` / `conflict` bypasses `src/domain/commands.ts`. |
| `NFR-TRUST-07` | Values returned to an agent carry no verdict and no unverified assertion: every field is read back from what the database actually stored, and a tool that changed nothing says so. |

## Acceptance

`npm run db:verify` green, driving the real handlers. That, and the audit trail showing refusals,
is what we take to the judges.

## The boundary

SQL cannot verify that a human typed something. `person.created_by`, `claim.asserted_by` and
`audit_event.actor` are stamped by a `BEFORE INSERT` trigger from `current_user`, which is
`app_agent` or `app_human` depending on the role the single write door assumed. That makes the
actor unforgeable *by the application*, which is the threat we actually face — an agent that
composes a well-formed but dishonest write. It does not make it unforgeable by someone with a
devtools console and the `postgres` superuser, and we do not claim it does.

State this boundary in the pitch. A project arguing that assertions must carry evidence cannot
afford an unstated one of its own.

## Related

- `FR-CLAIM-claims-certainty`
- `FR-CONF-conflicts`
- `.agent/rules/invariants.md`

## Amended 2026-08-30

After measuring the real behaviour through `handlers.ts` in a browser:

- **-01** said the guarantee "lives at the database layer". It did not: `resolveClaim` composed
  three UPDATEs and the database caught none of the three holes. Reworded to name what SQL does
  enforce, and *The boundary* section added for what it cannot.
- **-02**, **-04** said "requires a human". `add_person` is a base tool, so the agent created the
  person that then signed for its own guess. Now requires `created_by='human'` and conflict
  membership.
- **-05** said `db:verify` proves the constraints bite. It ran hand-written SQL the application
  never executes, so it scored 10/10 while the guarantee was false.
- **-07** three handler return values reported outcomes that had not happened.
