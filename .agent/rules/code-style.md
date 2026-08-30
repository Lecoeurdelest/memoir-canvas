# Code style

## Language

English everywhere: code, identifiers, filenames, commit messages, and documentation.

**Product content is bilingual** — story cards, follow-up questions and UI copy carry paired
`*_vi` / `*_en` values. That is a feature: the family reads Vietnamese, the judges read English.
Vietnamese in seed data and demo copy is intentional, because the story is Vietnamese.

## TypeScript

- `strict: true`. No `any`, no `@ts-ignore`. When a type is genuinely unknown use `unknown` and
  narrow it.
- Validate anything coming from an agent with a runtime schema. Never trust `args`.
- Domain types come from `src/domain/types.ts`. Do not re-declare `interface Claim` elsewhere.
- Named exports. Avoid `export default` except for React components.

## Comments

Prefer no comment. Let names carry the meaning — a well-named variable or function
beats a comment that restates it.

- Keep comments short and dense. One line where one line does.
- Comment only genuinely complex logic — the **why** the code cannot show.
- Never restate **what** the code already says.

```ts
// ✗ increment the counter
count += 1;

// ✗ let the name explain instead
const c = x + 1; // running total

// ✓ self-explaining name, no comment needed
const runningTotal = previousTotal + amount;

// ✓ PGlite has a single connection — serialise here to avoid writer contention
await queue.run(() => db.exec(sql));
```

## SQL

- Every write lives in `src/domain/commands.ts`, always inside a transaction.
- Parameterise. Never concatenate SQL, not even with data you believe is yours.
- Name constraints as meaningful sentences: `claim_confirmed_needs_a_human`, not `chk_claim_3`.
  Constraint names surface in the error messages users read.

## React

- Components take props; they do not fetch. Data arrives from `src/store/`.
- No `useEffect` mutating domain state. Call `commands.*`.
- `src/view/` is 3D, `src/panels/` is DOM. Do not mix them.

## File naming

| Kind | Convention | Example |
|---|---|---|
| React component | `PascalCase.tsx` | `StoryCard.tsx` |
| Plain module | `camelCase.ts` | `projection.ts` |
| Task | `TASK-NNN-kebab-case.md` | `TASK-012-mcp-handlers.md` |
| Impl doc | `IMPL-TASK-NNN.md` | `IMPL-TASK-012.md` |
| Requirement | `FR-<AREA>-kebab.md` | `FR-CONF-conflicts.md` |
