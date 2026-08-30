# /task-finish <TASK-ID>

> A reusable prompt. Paste into any agent's chat, replacing `<TASK-ID>`.

---

The code for `<TASK-ID>` is written. Now close it out properly:

1. Run `npm run typecheck`, `npm test`, and `npm run db:verify` if you touched
   `schema.sql` / `commands.ts`. Paste the results. **If anything is red, fix it — do not move on.**
2. Run `npm run test:evidence -- <TASK-ID>`. Confirm
   `docs/implement/evidence/<TASK-ID>-junit.xml` was written and is not empty.
3. From `docs/implement/TEMPLATE.md`, write `docs/implement/IMPL-<TASK-ID>.md`. Three sections
   must be written honestly, not filled in for form:
   - **Deviations** — where you did something different from the task and why (write "None" if
     there genuinely were none)
   - **Known gaps** — what is still missing, so the next person does not rediscover it
   - **Invariant check** — which of R1–R5 you touched and how you kept them
4. Walk every line of `.agent/workflows/review-checklist.md`. Report any line you could **not**
   tick and why.
5. If you touched anything under `src/`: update `docs/_arch_map.md`.
6. Draft a commit message per `.agent/rules/commit-and-pr.md`. Show it to me — do not commit yet.
