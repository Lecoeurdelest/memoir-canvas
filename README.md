# Memoir Canvas

**A family memory canvas where the AI is not allowed to turn a guess into a fact.**

An entry for [The WebMCP Challenge](https://webmcp.devpost.com/). People and an agent
reconstruct family history together from oral accounts, old photographs and documents — but the
agent must cite its sources, must show where it is unsure, and **may never resolve a
contradiction on its own**.

The screen *is* the memory graph rendered. The archive opens as a **forest at night, one firefly
per memory**, where brightness and hue are certainty — so how sure this family is of its own past
reads before a word does. A light opens into a bound volume you turn **by hand**; there is not a
single navigation button anywhere.

When two sources disagree, that page **will not turn**. It lifts under your hand and springs back,
torn down the gutter, and the forest behind it goes dark — until a person puts their name to a
year.

All of it is CSS perspective and `box-shadow`. **No WebGL, no `three`, no canvas** — measured at
+212 kB gzipped for a scene whose Vietnamese text would then have to be solved separately, against
a 47 kB entry chunk.

---

## The argument lives in the database, not in a prompt

```sql
CONSTRAINT claim_confirmed_needs_a_human CHECK (
  certainty <> 'confirmed'
  OR (confirmed_by IS NOT NULL AND confirmed_at IS NOT NULL))
```

Jailbreak the agent, call the tools out of order — the database still refuses. Three core
constraints, plus a `app_agent` role that holds no UPDATE privilege on the columns a fact is
made of:

| Constraint | What it enforces |
|---|---|
| `claim_confirmed_needs_a_human` | no signature, no "fact" |
| `claim_evidence_backed` | a "document-supported" label needs a document (constraint trigger, DEFERRABLE) |
| `conflict_resolution_needs_a_human` | an agent may detect a contradiction; it may not settle one — and the winning claim must be a member of that conflict |

```bash
npm run db:verify   # drives the real tool handlers and proves all three actually bite
```

> **What this does not claim.** SQL cannot verify that a *human* typed something. The actor on
> every row is stamped by the database from the role the write door assumed, which makes it
> unforgeable by the application — the threat we actually face. It does not make it unforgeable by
> someone with a devtools console. See `NFR-TRUST` for where that boundary sits.

---

## Try it

```bash
npm install
npm run dev
```

No server, no environment variables, no account. A real Postgres runs inside the tab via
[PGlite](https://pglite.dev) (PostgreSQL 18.3 → wasm32), persisted to IndexedDB. The archive stays
in your browser — there is nowhere for it to be uploaded to.

One thing does leave, by design: **whatever you hand to the agent.** WebMCP tool arguments and
results travel to the model driving the session, which is a hosted service. That is the trade the
project is making, and it is stated rather than glossed.

Photographs do not leave, and do not even enter. Drop one on a memory and its date is read out of
the EXIF header in the tab; the archive keeps the date, the filename and whether the photograph
**agrees** with the story. A photograph dated 1974 dropped on a memory that says 1972 is recorded
as contradicting it — which is the archive working, not breaking. The pixels are never stored.

There is no Google Photos integration, and the reason is specific rather than lazy: Google
withdrew the broad Photos Library scopes after 2025-03-31, and it blocks its OAuth consent screen
inside embedded webviews — which is exactly the browser this has to run in.

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | static build into `dist/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | vitest |
| `npm run db:verify` | **prove the three constraints still bite** |
| `npm run arch:check` | check R1–R4 with grep (R5 is enforced by review — see `NFR-MAINT-01`) |
| `npm run deploy` | build and push to Cloudflare Pages (browser login; **no token in this repo**) |

---

## Eight WebMCP tools, three of which come and go

`read_memory_graph` · `add_person` · `add_memory_claim` · `link_claim_to_source` ·
`flag_conflict` · `propose_followup_question` · `resolve_claim` · `generate_story_card`

The agent's tool list **changes with what the user is looking at**. `resolve_claim` exists only
while the user has that specific conflict open — close the page and the tool disappears.

That is `tools = f(uiState)`, a pure function, handed over with `provideContext()`.
See [`docs/API_SCHEMA.md`](docs/API_SCHEMA.md).

---

## Architecture

Five layers and **one write door**. The "Confirm" button a person clicks and the `resolve_claim`
tool an agent calls run *the same function* in `src/domain/commands.ts`. Neither gets a private
path — that is what makes this genuinely agent-native rather than an MCP server bolted onto a
website.

```
view/ · panels/  ──┐                    R5 read-only
                   ├─▶ domain/commands.ts   R2 the single write door
mcp/handlers.ts  ──┘         │
                             ▼
                    domain/db.ts (PGlite)   R3 sole owner
                             │
                    domain/schema.sql       CHECK · CONSTRAINT TRIGGER
                             │ projection
                             ▼
                          store/            ──▶ view
```

Full text: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ·
File map: [`docs/_arch_map.md`](docs/_arch_map.md)

---

## Working on this repo

**Agents** (Claude Code, Codex, Cursor, Copilot, anything else): read
[`.agent/AGENTS.md`](.agent/AGENTS.md). It is the single source of truth — `CLAUDE.md`,
`AGENTS.md`, `.cursor/rules/` and `.github/copilot-instructions.md` are shims pointing there.

**People**: [`docs/README.md`](docs/README.md) → [`docs/task/README.md`](docs/task/README.md).

The five invariants ([`.agent/rules/invariants.md`](.agent/rules/invariants.md)):

- **R1** Agents enter only through `mcp/handlers.ts`
- **R2** Humans and agents share the write door
- **R3** Only the command layer touches the database
- **R4** The registry is a pure function `tools = f(uiState)`
- **R5** The view layer is read-only

---

## Attribution

The challenge is hosted by **OpenAI**. The **WebMCP specification** belongs to the
[W3C Web Machine Learning Community Group](https://www.w3.org/community/webmachinelearning/),
associated with Google and Microsoft. Two different things — and for a project whose whole
argument is "cite your sources properly", that distinction is worth keeping.

## Licence

MIT — see [`LICENSE`](LICENSE).
