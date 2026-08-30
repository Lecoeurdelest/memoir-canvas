# R1–R5 — the invariants

This is the highest-authority document in the repo. When anything else disagrees with this
file, this file wins.

These five are not style preferences. They are what keeps the project's argument — *an AI must
not turn a guess into a fact* — from eroding one convenient commit at a time.

---

## R1 — Agents get in through one door

**The rule.** Tool handlers in `src/mcp/handlers.ts` are the only entry point for an agent. No
hidden routes, no globals, no `window.__memoir`, no event bus the agent can reach.

**Typical violation**
```ts
// ✗ WRONG — this is a back door
window.__memoir = { db, commands };
```

**Correct**
```ts
// ✓ the agent sees exactly what the registry hands it, nothing more
mc.provideContext({ tools: toolsFor(uiState) });
```

**How to check.** `grep -rn "window\." src/` must not return anything assigning system state.

---

## R2 — Humans and agents share the write door

**The rule.** The "Confirm" button a person clicks and the `resolve_claim` tool an agent calls
must run **the same function** in `src/domain/commands.ts`. Neither gets a private path.

**Why this is the load-bearing one.** If the agent has its own write path, every constraint you
placed on the human path is decorative — and vice versa. One shared door means: checks written
once, audit written once, and anyone reading `commands.ts` can see the complete set of things
this system permits to happen.

It is also what makes the project genuinely *agent-native* rather than an MCP server bolted
onto a website.

**Typical violation**
```ts
// ✗ WRONG — the handler writes for itself
export async function resolveClaim(args) {
  await db.query('UPDATE claim SET certainty = $1 ...', ['confirmed']);
}
```

**Correct**
```ts
// ✓ the handler validates, then delegates
export async function resolveClaim(args) {
  const input = ResolveClaimInput.parse(args);
  return commands.resolveClaim({ ...input, actor: 'agent' });
}
```

**How to check.** `src/mcp/handlers.ts` must contain no SQL strings at all.

---

## R3 — Only the command layer touches the database

**The rule.** `src/domain/db.ts` is the sole owner of the PGlite connection. Only
`src/domain/commands.ts` (and `src/store/projection.ts` for the read path) may import it.

Every write and its `audit_event` go in **one transaction**. No exceptions. An operation that
happened without leaving a trace is a hole in the audit trail, and the audit trail is what we
are taking to the judges.

**The extra technical reason.** PGlite has one connection and no pool. Multiple callers would
serialise or contend unpredictably. A single owner fixes both problems at once.

**How to check.** `grep -rn "from.*domain/db" src/ | grep -v "domain/\|store/projection"`
must be empty.

---

## R4 — The registry is a pure function

**The rule.** The set of available tools is a pure function of the UI state:

```ts
export function toolsFor(ui: UiState): ToolDescriptor[]
```

Computed in exactly one place (`src/mcp/registry.ts`) and handed over with `provideContext()` —
whole-set replacement, which is precisely what a pure function wants to return.

**Do not** scatter `registerTool()` / `unregisterTool()` across components. That builds a
hidden state machine nobody can debug, and it will break exactly when you are recording the
demo.

**The pleasant consequence.** Being pure, it tests without a DOM and without an agent:
```ts
expect(toolsFor({ view: 'conflict', conflictId: 'x' }).map(t => t.name))
  .toContain('resolve_claim');
```

---

## R5 — The view layer is read-only

**The rule.** `src/view/` and `src/panels/` render a projection from `src/store/`. They never
mutate. To change something they call `commands.*` — and then it goes through R2 and R3 like
everything else.

**The consequence that matters.** Because the view holds no state of its own, replacing the
entire view layer does not touch the three layers below. That is exactly why the "drop 3D to
CSS" fallback in `docs/task/TASK-026` costs half a day instead of a rewrite. Do not give that
property away for one convenient `useState` holding domain data.

---

## Quick reference

| You are in | May import | May call |
|---|---|---|
| `src/view/`, `src/panels/` | `store/`, `domain/types` | `commands.*` |
| `src/mcp/handlers.ts` | `domain/commands`, `domain/types` | `commands.*` |
| `src/mcp/registry.ts` | `mcp/descriptors`, `store/` | `provideContext()` |
| `src/domain/commands.ts` | `domain/db`, `domain/types` | SQL |
| `src/store/projection.ts` | `domain/db` (reads only) | `SELECT` |
