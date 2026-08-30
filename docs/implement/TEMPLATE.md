---
task: TASK-NNN
status: done
date: YYYY-MM-DD
author: <name>
---

# IMPL-TASK-NNN — <task title>

## What was built

<3–6 sentences. What exists now, and the approach taken. Do not paste the diff — git has it.>

## Acceptance criteria

Copy from the task doc and tick each one:

- [ ] <criterion 1>
- [ ] <criterion 2>

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-NNN-junit.xml` |
| Typecheck | `npm run typecheck` — <green / red> |
| Constraints | `npm run db:verify` — <10/10 / N/A> |

<If there are no tests, write `Evidence: N/A — <reason>`. Do not leave it blank.>

## Deviations

<Where you did something different from the task, and **why**. Doing it differently is fine;
doing it differently without telling anyone is not. If there genuinely were none, write "None"
— do not leave it blank.>

## Known gaps

<What is still missing, what is temporary, which edge cases are unhandled. Write it down so the
next person does not spend half a day rediscovering it. If a gap is large enough, open a task
and reference it here.>

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | |
| R2 — shared write door | ☐ | |
| R3 — only the command layer touches the database | ☐ | |
| R4 — the registry is a pure function | ☐ | |
| R5 — the view layer is read-only | ☐ | |

## Files changed

- `<path>`
