# Architecture

Memoir Canvas runs entirely inside one browser tab. No server, no API, no runtime network calls.
People and agents look at the same canvas and **push the same door to write**.

File map: [`_arch_map.md`](_arch_map.md) · Full rules:
[`.agent/rules/invariants.md`](../.agent/rules/invariants.md)

---

## 1. The picture

```
                     ┌──────────────────────────────┐
                     │      Agent (the model)       │
                     └──────────────┬───────────────┘
                                    │ tool call
  ══════════════════════════════════╪══════════ trust boundary ═══════════
                                    │  the agent never touches data
   ┌────────────────────────────────┼─────────────────────────────────────┐
   │  THE PAGE · one origin · no server                                   │
   │                                ▼                                     │
   │   ┌──────────────────┐   uiState   ┌──────────────────────────────┐  │
   │   │  view/  panels/  │────────────▶│  mcp/registry                │  │
   │   │  R5 · read-only  │             │  R4 · tools = f(uiState)     │  │
   │   └────────┬─────────┘             └──────────────┬───────────────┘  │
   │            │                                      │ R1 · one door in │
   │            │ person clicks                        ▼                  │
   │            │ "Confirm"               ┌──────────────────────────┐    │
   │            │                         │  mcp/handlers × 8        │    │
   │            │                         │  validate, no SQL        │    │
   │            │                         └──────────────┬───────────┘    │
   │            └──────────────┐         ┌───────────────┘                │
   │                          ▼         ▼                                 │
   │            ╔═══════════════════════════════════════╗                 │
   │            ║  domain/commands.ts                   ║                 │
   │            ║  R2 · THE SINGLE WRITE DOOR           ║                 │
   │            ║  humans and agents call one function  ║                 │
   │            ╚═══════════════════╤═══════════════════╝                 │
   │                                │ R3 · one owner                      │
   │                                ▼                                     │
   │                   ┌────────────────────────────┐                     │
   │                   │  domain/db.ts              │                     │
   │                   │  PGlite · IndexedDB        │                     │
   │                   └────────────┬───────────────┘                     │
   │                                │ 1 tx: command + audit_event         │
   │                                ▼                                     │
   │                   ┌────────────────────────────┐                     │
   │                   │  schema.sql                │                     │
   │                   │  CHECK · CONSTRAINT TRIGGER│                     │
   │                   └────────────┬───────────────┘                     │
   │                                │ projection                          │
   │                                ▼                                     │
   │                   ┌────────────────────────────┐                     │
   │                   │  store/  ·  Zustand        │──┐                  │
   │                   └────────────────────────────┘  │                  │
   │                          ▲  read-only              │                  │
   │                          └────────────────────────┘                  │
   └──────────────────────────────────────────────────────────────────────┘
```

**The important part is where the two arrows meet at `commands.ts`.** The "Confirm" button a
person clicks and the `resolve_claim` tool an agent calls run the same function. That is what
makes this genuinely *agent-native* rather than an MCP server bolted onto a website.

---

## 2. The five invariants

A summary. The full text, with violation examples and `grep` checks, is in
[`.agent/rules/invariants.md`](../.agent/rules/invariants.md).

| | Rule | Why |
|---|---|---|
| **R1** | Agents enter only through `mcp/handlers.ts` | One door to watch instead of a perimeter |
| **R2** | Humans and agents share the write door | Checks written once, audit written once |
| **R3** | Only the command layer touches the database | PGlite has one connection; and every write gets audited |
| **R4** | The registry is a pure function `tools = f(uiState)` | Testable without a DOM and without an agent |
| **R5** | The view layer is read-only | The whole view can be replaced without touching three layers |

R5 is what makes the "drop 3D to CSS" fallback (`TASK-026`) cost half a day instead of a rewrite.

---

## 3. Why there is no backend

Not to save effort. Four reasons, in order of weight:

**It is the right product.** Family memories are private. A memory canvas that ships grandma's
recollections to a stranger's Postgres is wrong in kind. Local-first here is a position, and it
matches what the project argues.

**The demo cannot die from network trouble.** The ChatGPT in-app browser is an environment we do
not control. A cold start or a blocked CORS preflight is a total loss at the exact moment a
judge opens the link.

**Judges do not trample each other.** A shared backend means everyone opening the URL writes
into the same graph — the second person sees data the first invented.

**Nothing in the schema had to be given up.** PGlite is PostgreSQL 18.3 compiled to wasm32 and
runs `schema.sql` unchanged: 8 enum types, a plpgsql function, and a
`CONSTRAINT TRIGGER … DEFERRABLE`. `npm run db:verify` runs the behavioural suite against PGlite
in wasm and is the evidence we cite; a comparison run against a server Postgres was discussed but
no artefact of it exists in this repo, so we do not claim one.

SQLite-WASM was evaluated and rejected because it costs `DEFERRABLE` and enum types — two of the
ten checks in `db:verify` test exactly those, so a SQLite port could not have passed the same
suite unchanged.

PGlite's price is **~5.3 MB gzip (~3.9 MB brotli, 16.8 MB raw)**, paid with lazy-loading after the
first frame. `initdb.wasm` is re-fetched on every boot, not only the first visit.

---

## 4. The write path — one call through the system

`flag_conflict` as the example. Steps 3 and 10 are where the argument lives.

1. The agent calls `flag_conflict({ subject_id, predicate })`.
2. `mcp/handlers.ts` validates required arguments with lightweight runtime checks, then calls
   `commands.flagConflict()` — it **does not touch the database itself**.
3. The command reads `v_open_disagreement`. **No row → throw, write nothing.** An agent may not
   conjure a conflict out of nothing.
4. Open a transaction. `INSERT conflict` plus `conflict_member` for each claim involved.
5. `UPDATE claim SET certainty='conflicting'` for the members.
6. `INSERT audit_event` with `registered_because`, **in the same transaction**.
7. `COMMIT`. One failing CHECK turns all six steps back.
8. `store/projection.ts` rebuilds the read model from PGlite.
9. The view renders: the page splits. `uiState` changes → the registry provides a new tool set
   and `resolve_claim` appears.
10. Return to the agent: a summary of the conflict and a question worth asking — **no answer**.
    The return value itself refuses to guess.

---

## 5. The read path

One direction, no loop back:

```
PGlite ──▶ store/projection.ts ──▶ store/store.ts ──▶ view/ + panels/
```

The projection rebuilds **wholesale** after every write. At the scale of a family archive — a
few hundred rows — that is much cheaper than the maintenance cost of an incremental update
mechanism. Do not optimise it early.

`store/uiState.ts` is kept apart from domain data, because the registry (R4) depends on it
rather than on the data.

---

## 6. The three constraints that hold the argument

The argument — *an AI must not turn a guess into a fact* — is **not** in a prompt and not in the
application layer. It is in `src/domain/schema.sql`:

| Constraint | What it enforces |
|---|---|
| `claim_confirmed_needs_a_human` | no signature, no "fact" |
| `claim_evidence_backed` | a "document-supported" label needs a document (constraint trigger, DEFERRABLE) |
| `conflict_resolution_needs_a_human` | an agent may detect a contradiction; it may not settle one |

Jailbreak the agent, call the tools out of order — the database still refuses. That is the
difference between a promise and an architecture, and it is what a judge sees on opening the repo.

`npm run db:verify` runs the suite proving all three bite. It must be green on every commit.

Details: [`NFR-TRUST`](requirements/non-functional/NFR-TRUST-epistemic-integrity.md) ·
[`docs/technical/01-data-model.md`](technical/01-data-model.md)

---

## 7. Stateful tool registration

The agent's tool list changes with what the user is looking at. This is the project's strongest
WebMCP-native detail.

| Where the user is | Tools added |
|---|---|
| anywhere | `read_memory_graph`, `add_person`, `add_memory_claim`, `link_claim_to_source`, `generate_story_card` |
| viewing a subject **with a disagreement** | `+ flag_conflict` |
| viewing **one specific conflict** | `+ propose_followup_question`, `+ resolve_claim` |

Handed over with `provideContext()` — whole-set replacement, precisely what a pure function of
state wants to return. Do not scatter `registerTool` / `unregisterTool` across components: that
builds a hidden state machine nobody can debug, and it breaks while you are recording the demo.

Successful tool writes record `audit_event.registered_because` — why that tool was available
at the time. Recording refused operations is still tracked by `FR-AUDIT` / `NFR-OBS`.

Details: [`docs/technical/04-stateful-registration.md`](technical/04-stateful-registration.md)

---

## 8. Team boundaries

Directory boundaries follow people boundaries.

| Branch | Owns | Main risk |
|---|---|---|
| A | `src/view/` | WebGL may not survive the webview |
| B | `src/domain/`, `src/mcp/`, `src/store/` | the WebMCP API name is unsettled |
| C | `src/panels/`, `src/seed/`, bilingual content, video | content takes longer than expected |

**The only connection:** A and C *read* `src/store/` and *write* through
`src/domain/commands.ts`. Nobody outside branch B imports `db.ts`.

Two files frozen on day one: `src/domain/schema.sql` and `src/mcp/descriptors.ts`. Once frozen,
all three branches can mock each other freely and nobody waits.

---

## 9. Fallbacks and decision deadlines

| Risk | Fallback | Decide by |
|---|---|---|
| `modelContext` named differently or absent | feature-detecting shim + manual tool panel | Day 1 |
| PGlite too heavy for the webview or main thread | move it behind a Web Worker; if still too heavy, keep `schema.sql` as documentation and move constraints into TypeScript guards + JSON persistence | End of day 2 |
| R3F does not survive the webview | CSS 3D book — thanks to R5, the three layers below are untouched | End of day 3 |
| Demo core not working | cut `TASK-020`, `TASK-023`, `TASK-024`, put everyone on `TASK-025` | End of day 4 |

When a deadline arrives and it still does not work, fall back. Pushing on for one more day
costs the submission.
