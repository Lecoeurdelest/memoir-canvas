# Self-review checklist

Run this before asking a human to review. Three minutes here saves a review round.

## Invariants

Fastest path: `npm run arch:check`. Or by hand:

- [ ] `grep -rn "from.*domain/db" src/` returns only `domain/` and `store/projection.ts` → **R3**
- [ ] `src/mcp/handlers.ts` contains no SQL strings → **R2**
- [ ] `provideContext(` appears only in `src/mcp/registry.ts` → **R4**
- [ ] No `useState` / `useRef` holds domain data in `src/view/` or `src/panels/` → **R5**
- [ ] Nothing is assigned to `window.*` → **R1**

## What the project argues

- [ ] There is no path by which an agent sets `certainty='confirmed'` without a `confirmed_by`
- [ ] No `DROP`, no `ALTER … DROP CONSTRAINT`, nothing weakening the three core constraints
- [ ] Every write records an `audit_event` **in the same transaction**
- [ ] Values returned to the agent carry facts and certainty, never a verdict

## Quality

- [ ] `npm run typecheck` green
- [ ] `npm test` green
- [ ] `npm run db:verify` green (if you touched `schema.sql` or `commands.ts`)
- [ ] No new `any`, no new `@ts-ignore`
- [ ] No leftover `console.log`
- [ ] No runtime network calls

## Documentation

- [ ] `docs/implement/IMPL-<TASK-ID>.md` exists and every section is filled in
- [ ] `docs/implement/evidence/<TASK-ID>-junit.xml` exists (or N/A is stated with a reason)
- [ ] If you touched a frozen file: `docs/API_SCHEMA.md` updated in the same PR
- [ ] If you added or removed a file under `src/`: `docs/_arch_map.md` updated
