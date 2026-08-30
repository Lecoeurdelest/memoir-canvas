# /task-start <TASK-ID>

> A reusable prompt. Paste into any agent's chat, replacing `<TASK-ID>`.

---

You are about to work on `<TASK-ID>` in the Memoir Canvas repo.

Before writing a single line of code, do the following and **report back to me**:

1. Read `.agent/AGENTS.md` and `.agent/rules/invariants.md`.
2. Read `docs/task/<TASK-ID>-*.md`. List the acceptance criteria.
3. Follow that task's links to the relevant requirements and technical docs. Summarise each in
   one sentence.
4. Using `docs/_arch_map.md`, list the **exact** files under `src/` you will touch.
5. Answer four questions:
   - Which of R1–R5 does this task touch? How will you keep them?
   - Does it touch `src/domain/schema.sql` or `src/mcp/descriptors.ts`? (if yes → **stop and
     tell the team first**)
   - What tests are needed to satisfy the acceptance criteria?
   - Is anything in the task unclear, or in conflict with another document?

**Do not write code yet.** Wait for me to confirm the plan.
