---
task: TASK-014
status: done
date: 2026-08-30
author: Lecoeurdelest
---

# IMPL-TASK-014 — Detect and record conflicts

## What was built

`flagConflict()` reads `v_open_disagreement`, refuses when the view has no row, and otherwise
writes one `conflict` row plus a `conflict_member` per disputed claim, marking each
`certainty='conflicting'` in a single transaction. The view was corrected to group on the
claim's **object** as well as its subject and predicate. Closing a conflict is unreachable for
an agent at three depths: the registry never offers `resolve_claim` outside the conflict view,
`app_agent` holds no `UPDATE` privilege on `conflict.status` or `claim.confirmed_by`, and
`conflict_resolution_coherent` refuses a winner that is not a member of the conflict.

## Acceptance criteria

- [x] No row in the view → throw and **write nothing**
- [x] Three disagreeing recollections join one conflict, not three pairs
- [x] No path exists for an agent to close a conflict

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-014-junit.xml` — 4 conflict cases in `tests/conflict.spec.ts` |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — 12/12, including "closing a conflict with a claim that was never part of it" |
| Browser | 19/19 attacks refused through the real command layer in Chrome 151 |

## Deviations

**The view was wrong and had to change.** It grouped on `(subject_kind, subject_id, predicate)`
and ignored the object, so "Bà ngoại moved_to Đà Nẵng 1972" and "Bà ngoại moved_to Sài Gòn 1980"
— two true, compatible claims — were reported as a contradiction. Since `flag_conflict` is gated
on this view, the agent was handed a tool to tear the page over a disagreement that did not
exist, and the only implemented way out (`resolveClaim`) would then have superseded a true
memory to close it.

The fix costs a false negative: two claims that mean the same thing but store it differently
(`object_place_id` vs `object_text`) no longer group, so a real disagreement between them goes
undetected. That is the safer direction for this project — missing a conflict leaves the archive
incomplete, inventing one makes the system assert something untrue.

**Two refusals were added that the task doc does not mention.** One predicate can now carry
several independent disagreements, and the frozen tool contract has no object argument to tell
them apart, so `flagConflict` refuses rather than silently picking the first. It also refuses to
re-flag a conflict that is already open, which previously produced duplicate conflict rows over
the same claims.

**`flagConflict` no longer downgrades a confirmed claim.** The `UPDATE` carries
`AND certainty <> 'confirmed'`, so an agent's later guess cannot drag a decision a person
already made back into doubt.

## Known gaps

- `conflict_status` has a `'dismissed'` value and no command writes it. A conflict flagged in
  error can currently only be closed by resolving it, which supersedes a claim. Needs a task.
- The `conflict` table is keyed on `(subject, predicate)` with no object column, while the view
  now discriminates by object. They disagree in shape; the ambiguity refusal papers over it.
- Nothing renders the tear — `TASK-018` / `TASK-019` are what make this visible.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☑ | `resetArchive` deliberately absent from `descriptors.ts`, so it is unreachable through the tool surface |
| R2 — shared write door | ☑ | `flagConflict` and `resolveClaim` are the only writers of `conflicting` / `confirmed`, and both live in `commands.ts` |
| R3 — only the command layer touches the database | ☑ | `arch:check` green |
| R4 — the registry is a pure function | ☐ | untouched — `toolNamesFor` still reads only UI state and the two id sets |
| R5 — the view layer is read-only | ☐ | untouched |

## Files changed

- `src/domain/commands.ts`
- `src/domain/schema.sql` — `v_open_disagreement`, `conflict_resolution_coherent`, roles and grants
- `src/domain/types.ts` — `OpenDisagreement` gains the object columns
- `scripts/verify-constraints.mjs`
- `docs/API_SCHEMA.md`
- `tests/conflict.spec.ts`
