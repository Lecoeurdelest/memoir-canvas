---
task: TASK-024
status: done
date: 2026-08-30
author: Lecoeurdelest
---

# IMPL-TASK-024 — The audit panel

## What was built

`AuditTrail` renders the log as a chronological list of sentences — "The agent recorded a
recollection", "The agent tried to flag a contradiction — REFUSED because no open disagreement
exists" — with filters by actor, by operation, and a "only what was blocked" toggle that shows
the count. Refused rows are marked and tinted, and carry the constraint name when a named check
fired. Each row shows its `registered_because`, so a reader can see why the tool was available at
all.

## Acceptance criteria

- [x] Someone who does not write code can read it
- [x] Blocked operations appear clearly with their reason
- [x] The sequence of events can be reconstructed after the demo

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-024-junit.xml` — 4 cases in `tests/panels.spec.ts` |
| Browser | 12/12 in Chrome 151: 12 entries, 1 marked refused with its reason in the sentence, no braces in any entry, blocked-only filter returns exactly the refused rows |
| Typecheck | `npm run typecheck` — green |

## Deviations

**Refusal reasons are still English inside a Vietnamese sentence.** The surrounding phrasing is
bilingual, but `RefusedError` messages come from the command layer, where `code-style.md` mandates
English. A Vietnamese reader sees "…BỊ TỪ CHỐI vì no open disagreement exists for this subject".
That is a real defect in a panel whose acceptance is "someone who does not write code can read
it", and it is left as a gap rather than papered over: translating them properly means giving
refusals stable codes, which touches every command and is not a three-days-out change.

**A test asserts every tool has a sentence.** The obvious failure mode is a ninth tool landing
with no phrasing and silently rendering its raw name — which is the JSON dump the task rules out.
`tests/panels.spec.ts` fails if any tool in `ALL_TOOL_NAMES` is missing one.

**The panel reads a capped 200 rows**, newest first. The task says "a timeline", not "an export".

## Known gaps

- **Refusal reasons are untranslated** (above). The highest-value follow-up for this panel.
- Argument-validation refusals thrown inside `handlers.ts` never reach the command layer, so they
  leave no audit row and cannot appear here. See `IMPL-TASK-009` → Known gaps.
- `before` is never populated, so an update shows what a value became and not what it was.
- No pagination past 200 rows and no export; the demo never approaches that.
- Times are rendered in the viewer's locale with no date, so a demo spanning midnight would read
  out of order.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | untouched |
| R2 — shared write door | ☐ | untouched |
| R3 — only the command layer touches the database | ☑ | reads `audit` from the projection |
| R4 — the registry is a pure function | ☐ | untouched |
| R5 — the view layer is read-only | ☑ | the only local state is the three filter controls |

## Files changed

- `src/panels/AuditTrail.tsx`
- `src/store/projection.ts` — `audit`
- `src/store/store.ts` — shared `lang`
- `src/Archive.tsx` — mounts it, and hosts the single language toggle
- `src/app.css`
- `tests/panels.spec.ts`
