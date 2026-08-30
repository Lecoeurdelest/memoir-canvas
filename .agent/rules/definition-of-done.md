# Definition of done

A task is done when **all** of these hold, not most of them:

| # | Condition | Checked by |
|---|---|---|
| 1 | Every acceptance criterion in the task doc is met | re-read the task doc |
| 2 | `npm run typecheck` green | CI |
| 3 | `npm test` green | CI |
| 4 | `npm run db:verify` green (if it touched `schema.sql` / `commands.ts`) | CI |
| 5 | `docs/implement/IMPL-<TASK-ID>.md` exists and is complete | review |
| 6 | `docs/implement/evidence/<TASK-ID>-junit.xml` exists, or N/A is stated with a reason | review |
| 7 | `.agent/workflows/review-checklist.md` has been walked | self-declared in the PR |
| 8 | R1–R5 are intact | review |

## Not done

- "Works on my machine" without a test in the in-app browser (for anything touching UI or WebMCP)
- Code merged with the IMPL doc "coming tomorrow"
- Tests written only to make CI green, that do not actually check behaviour
- A constraint relaxed so the tests would pass

## One extra condition for the demo core

`TASK-025-core-loop-e2e` carries an extra bar: **you can screen-record the chain
flag_conflict → torn page → propose_followup → resolve_claim → healed tear in one unbroken
take.** If you cannot record it, it is not done, however green the tests are.
