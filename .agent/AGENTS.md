# AGENTS.md — the working contract for every agent

You are working on **Memoir Canvas**, a WebMCP app. This document is the **single source of truth**
for every agent (Claude Code, Codex, Cursor, Copilot, anything else). The `CLAUDE.md` and
`AGENTS.md` at the repo root, `.cursor/rules/`, and `.github/copilot-instructions.md` are all
thin shims pointing here — **do not add rules there, add them here.**

---

## 0. Read in this order

| Step | File | Why |
|---|---|---|
| 1 | `.agent/context/project.md` | What the project is, what it argues |
| 2 | `.agent/rules/invariants.md` | **R1–R5. Break one and the rest stop meaning anything.** |
| 3 | `.agent/context/stack.md` | Tech, versions, commands |
| 4 | `docs/_arch_map.md` | The map: which file says what |
| 5 | Your assigned task in `docs/task/` | The actual work |

Do not read all of `docs/` before starting. `_arch_map.md` exists so you can jump straight to
what you need.

---

## 1. What this project argues — do not erode it

Memoir Canvas is a family memory canvas. Its entire value is one sentence:

> **An AI must not turn a guess into a fact.**

That is **not** enforced by a prompt. It is enforced by database constraints in
`src/domain/schema.sql`. If you find yourself writing code to work *around* a constraint, you
are heading the wrong way — stop and ask.

Three constraints are untouchable:

- `claim_confirmed_needs_a_human` — no `confirmed_by`, no `certainty='confirmed'`
- `claim_evidence_backed` — a `document_supported` label needs evidence with `stance='supports'`
- `conflict_resolution_needs_a_human` — an agent may detect a contradiction; it may not settle one

**Never** relax, bypass, or `DROP` any of these. Never add a side path that writes to the
database directly to avoid them.

---

## 2. Invariants (summary — full text in `.agent/rules/invariants.md`)

- **R1** Agents get in through tool handlers only. No hidden routes, no globals.
- **R2** Humans and agents share one write door: functions in `src/domain/commands.ts`.
- **R3** Only the command layer touches the database. `src/domain/db.ts` is the sole owner.
- **R4** The registry is a pure function: `tools = f(uiState)`.
- **R5** The view layer is read-only. It never mutates.

---

## 3. Two frozen files

`src/domain/schema.sql` and `src/mcp/descriptors.ts` are the **contract between the three
branches**.

Need to change one? You must:
1. Open a new task in `docs/task/`
2. Tell the whole team before merging
3. Update `docs/API_SCHEMA.md` in the same PR

Changing these two quietly is the surest way to make the final integration day fail.

---

## 4. The standard loop

```
read the task  →  read the files it touches  →  write code  →  run tests
               →  write the IMPL doc  →  commit
```

Step by step: `.agent/workflows/implement-a-task.md`.

**Every finished task needs a `docs/implement/IMPL-<TASK-ID>.md`.** Without it the task is not
done, no matter how well the code runs. See `.agent/workflows/write-evidence.md`.

---

## 5. Never do this

| Never | Why |
|---|---|
| Import `src/domain/db.ts` from outside `src/domain/` | Breaks R3 |
| Call `provideContext()` outside `src/mcp/registry.ts` | Breaks R4 |
| Mutate state inside `src/view/` or `src/panels/` | Breaks R5 |
| Edit `schema.sql` without opening a task | Breaks the contract |
| Add a backend, an API route, or any runtime network call | Breaks the local-first position |
| Let an agent set `certainty='confirmed'` on its own | Breaks what the project argues |
| Commit `node_modules/`, `.env`, or any secret | The submission is a public repo |
| Create new files at the repo root without asking | Keep the root clean |

---

## 6. When you are unsure

Authority order when documents disagree:

```
.agent/rules/invariants.md  >  docs/ARCHITECTURE.md  >  docs/task/TASK-*.md  >  existing code
```

Still unclear: **stop and ask a human.** This project has six days; a wrong direction found
late costs more than a question asked early.

---

## 7. Language

- **Code, identifiers, commit messages, filenames, documentation**: English.
- **Product content** (story cards, follow-up questions, UI copy): **bilingual** Vietnamese +
  English, stored in paired `*_vi` / `*_en` columns. That is a product feature, not a
  translation chore — the family reads Vietnamese, the judges read English.
- Vietnamese appears in seed data and demo copy because the story is Vietnamese. Keep it.
