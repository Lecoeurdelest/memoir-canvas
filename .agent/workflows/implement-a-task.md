# Implementing a task

## 1. Read — in this order, and do not read all of `docs/`

```
docs/task/<TASK-ID>-*.md          ← the work, the acceptance criteria
  ↓ follow the "Requirements" links
docs/requirements/functional/FR-*.md
  ↓ follow the "Technical" links
docs/technical/NN-*.md
  ↓
the actual files under src/ that the task touches
```

`docs/_arch_map.md` tells you which file says what — use it to jump straight there.

## 2. Check before writing

- Does this task touch `src/domain/schema.sql` or `src/mcp/descriptors.ts`?
  → **Those are frozen.** Tell the team and update `docs/API_SCHEMA.md` in the same PR.
- Does it break any of R1–R5? See the quick reference at the end of
  `.agent/rules/invariants.md`.

## 3. Write

Follow `.agent/rules/code-style.md`. Short version: English throughout, no filler comments,
no `any`, no leftover `console.log`.

## 4. Run

```bash
npm run typecheck
npm test
npm run db:verify      # required if you touched schema.sql or commands.ts
```

All three green before you move on. Not "I will fix it later".

## 5. Record the evidence

```bash
npm run test:evidence -- <TASK-ID>
```

That produces `docs/implement/evidence/<TASK-ID>-junit.xml`. Then write
`docs/implement/IMPL-<TASK-ID>.md` from `docs/implement/TEMPLATE.md`.

See `.agent/workflows/write-evidence.md`.

## 6. Commit

Follow `.agent/rules/commit-and-pr.md`. One task, one PR.

## 7. Self-review

Walk `.agent/workflows/review-checklist.md` **before** asking a human to review. That list
catches most of the mistakes without costing anyone else time.
