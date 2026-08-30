---
name: gen-test
description: Generate a Vitest test file for a src/domain or src/mcp module, against a real PGlite instance — not a mock. Use when the user asks to add tests for commands.ts, audit.ts, db.ts, modelContext.ts, handlers.ts, or any file that currently has no test coverage.
disable-model-invocation: true
---

# Generate tests for the write door

`tests/registry.spec.ts` is the only test file in this repo. It covers `toolNamesFor` (R4) — a
pure function, no DOM, no agent. Everything that actually touches the database has zero
coverage: `src/domain/commands.ts`, `src/domain/audit.ts`, `src/domain/db.ts`, and
`src/mcp/modelContext.ts`. Those are exactly the files where this session's manual review found
real bugs (`resolveClaim` confirming an unrelated claim; the `modelContext.ts` unregister-loop
bug) — bugs a test suite should have caught before a human had to find them by hand.

## Rule: test against real PGlite, never a mock

`src/domain/commands.ts` exists to compose SQL that a set of `CHECK` constraints and a
`DEFERRABLE CONSTRAINT TRIGGER` can refuse. A mocked `db.ts` cannot refuse anything — it would
make every test pass regardless of whether the real constraint still bites. Boot a real
in-memory PGlite instance per test file:

```ts
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

let db: PGlite;

beforeAll(async () => {
  db = await PGlite.create();
  await db.exec(readFileSync('src/domain/schema.sql', 'utf8'));
});
```

Do not import `src/domain/db.ts` directly for this — it's a module-level singleton bound to
`idb://`. Either add a way to inject a `PGlite` instance for tests, or write the test at the SQL
level (query the schema directly, the way `scripts/verify-constraints.mjs` does) when testing a
constraint, and reserve importing `commands.ts` for cases where the module can accept an
already-created connection.

## What to generate, given a target file

**`commands.ts`** — one `describe` block per exported command. For every command, at minimum:
- the happy path succeeds and the audit row it should produce exists
- every `RefusedError` throw site has a test that triggers it
- **the adversarial case**: can a well-formed-but-dishonest set of arguments reach a state the
  function's own doc comment says shouldn't be reachable? (This is how the `resolveClaim` bug
  was found — write the test that tries to confirm a claim that was never a member of the
  conflict, before you trust the fix.)

**`audit.ts`** — that `auditParams()` produces the right positional array for `AUDIT_INSERT`, and
(once the refusal-logging fix lands) that a refused call's `after` jsonb actually contains
`{outcome, reason, constraint}`.

**`modelContext.ts`** — call `provide()` twice with different tool sets on the `registerTool` /
`unregisterTool` fallback path (no `provideContext` on the fake host) and assert the SECOND
call's tool set is what ends up registered, not the first. This is the exact shape of bug this
file already had.

**`db.ts`** — `serialize()` actually queues rather than races: fire two overlapping
`transaction()` calls and assert they don't interleave.

## Style

Match `tests/registry.spec.ts`: `describe`/`it` from vitest, one behavior per `it`, a short
top-of-file comment explaining what property is being pinned down and why it matters — not what
the code does.
