# Architecture map

Which file says what, and which files must not be changed casually. Read this before digging
through `docs/` or `src/` — it exists so you can jump straight to what you need.

Agents wanting the machine-readable version: [`.agent/index.json`](../.agent/index.json).

---

## Where to start

| You are | Read |
|---|---|
| An agent (Claude / Codex / Cursor / other) | [`.agent/AGENTS.md`](../.agent/AGENTS.md) |
| New to the team | [`README.md`](../README.md) → [`.agent/context/project.md`](../.agent/context/project.md) |
| Trying to understand the architecture | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) |
| Picking up a task | [`docs/task/README.md`](task/README.md) |
| Calling a tool | [`docs/API_SCHEMA.md`](API_SCHEMA.md) |
| An end user | [`docs/USER_GUIDE.md`](USER_GUIDE.md) |

---

## Two frozen files

Changing either requires a new task, a heads-up to the team, and an update to
`docs/API_SCHEMA.md` in the same PR.

| File | Contract for |
|---|---|
| `src/domain/schema.sql` | all three branches — the shape of the data |
| `src/mcp/descriptors.ts` | the agent — the tool surface |

Changing these quietly is the surest way to make the final integration day fail.

---

## `src/` — five layers

Read top to bottom for the **write path**; bottom to top for the **read path**.

| Layer | Path | Branch | May import | Rule |
|---|---|---|---|---|
| view | `src/view/` | A | `store/`, `domain/types` | R5 — read-only |
| panels | `src/panels/` | C | `store/`, `domain/types` | R5 — read-only |
| mcp | `src/mcp/` | B | `domain/commands`, `domain/types`, `store/` | R1, R4 |
| store | `src/store/` | B | `domain/db` (reads only) | one direction |
| commands | `src/domain/commands.ts` | B | `domain/db`, `domain/types` | **R2 — the single write door** |
| db | `src/domain/db.ts` | B | `schema.sql` | **R3 — the sole owner** |

### File by file

| File | Purpose | Task |
|---|---|---|
| `src/main.tsx` | boot state machine and error boundary only — nothing here may reach `db.ts` | `TASK-003`, `TASK-012` |
| `src/Archive.tsx` | the shell a person sees once the archive opens; lazily loaded | `TASK-012` |
| `src/bootstrap.ts` | seed, build the read model, hand the tool set to WebMCP; lazily loaded | `TASK-003`, `TASK-012` |
| `src/app.css` | the DOM styles that paint the first frame without WebGL | `TASK-012` |
| `src/domain/schema.sql` | 11 tables, 8 enums, the core constraints, two roles + column grants, the actor-stamping and coherence triggers, the disagreement view | `TASK-002`, `TASK-014` |
| `src/domain/db.ts` | owns the PGlite connection, schema bootstrap, IndexedDB fallback, and write queue | `TASK-003` |
| `src/domain/types.ts` | the single source of types, mirroring the schema | `TASK-004` |
| `src/domain/commands.ts` | **the single write door**; every command in a transaction | `TASK-008` |
| `src/domain/audit.ts` | writes `audit_event` in that same transaction; refusals get their own | `TASK-009` |
| `src/mcp/descriptors.ts` | 8 tools: name, description, `inputSchema` | `TASK-005` |
| `src/mcp/modelContext.ts` | feature-detecting API shim | `TASK-006` |
| `src/mcp/handlers.ts` | validate, then delegate — **no SQL** | `TASK-011` |
| `src/mcp/registry.ts` | `toolsFor(uiState)`, a pure function | `TASK-012`, `TASK-013` |
| `src/store/projection.ts` | PGlite → read model | `TASK-010` |
| `src/store/store.ts` | Zustand, holds the projection only | `TASK-010` |
| `src/store/uiState.ts` | what the user is looking at — the registry depends on this | `TASK-010` |
| `src/view/Book.tsx` | R3F scene, book mesh | `TASK-015` |
| `src/view/Spread.tsx` | the spread, content through `<Html>` | `TASK-016` |
| `src/view/PageTurn.tsx` | turning pages, spine as timeline | `TASK-017` |
| `src/view/Tear.tsx` | the conflict tear and its healing | `TASK-018`, `TASK-019` |
| `src/view/Constellation.tsx` | the relationship constellation | `TASK-020` |
| `src/view/CssBook.tsx` | the CSS 3D fallback | `TASK-026` |
| `src/panels/CertaintyBadge.tsx` | 5 labels, bilingual, not colour-only | `TASK-021` |
| `src/panels/EvidencePanel.tsx` | sources, excerpts, stance | `TASK-022` |
| `src/panels/StoryCard.tsx` | the bilingual story card | `TASK-023` |
| `src/panels/AuditTrail.tsx` | the readable audit log | `TASK-024` |
| `src/panels/ManualToolPanel.tsx` | invoke tools by hand when the API is absent | `TASK-006` |
| `src/seed/family.sql` | the fictional archive staging 1972/1974 | `TASK-007` |
| `src/seed/loadSeed.ts` | loads the seed **through the command layer** | `TASK-007` |

---

## `docs/` — what each document says

| Path | Contents | Audience |
|---|---|---|
| [`_arch_map.md`](_arch_map.md) | this file — the map | everyone, read first |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | five layers, R1–R5, the write and read paths | everyone |
| [`API_SCHEMA.md`](API_SCHEMA.md) | 8 tools, `inputSchema`, return values, registration table | branch B, judges |
| [`USER_GUIDE.md`](USER_GUIDE.md) | how to use the app | end users, judges |
| [`requirements/`](requirements/README.md) | 12 FR + 9 NFR | when you need to know *why* |
| [`task/`](task/README.md) | 29 tasks, status table, milestones, fallbacks | daily |
| [`implement/`](implement/README.md) | implementation log plus test evidence | when closing a task |
| [`technical/`](technical/) | technical notes by topic | when going deep on one layer |
| [`_arch_review.md`](_arch_review.md) | periodic architecture review results | end of day 2, 4, 5 |
| [`_harness_review.md`](_harness_review.md) | review of test suite quality | end of day 3 |
| [`_homogeneity_blackbox_review.md`](_homogeneity_blackbox_review.md) | naming and shape consistency, black-box view | end of day 4 |

---

## `.agent/` — instructions for agents

The real content lives here. `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/` and
`.github/copilot-instructions.md` are shims pointing in — **do not add rules to a shim.**

| Path | Contents |
|---|---|
| [`.agent/AGENTS.md`](../.agent/AGENTS.md) | the working contract, read first |
| [`.agent/index.json`](../.agent/index.json) | machine-readable map |
| [`.agent/rules/invariants.md`](../.agent/rules/invariants.md) | **R1–R5 — highest authority in the repo** |
| [`.agent/rules/code-style.md`](../.agent/rules/code-style.md) | TypeScript, SQL and React conventions |
| [`.agent/rules/definition-of-done.md`](../.agent/rules/definition-of-done.md) | the eight conditions for "done" |
| [`.agent/rules/commit-and-pr.md`](../.agent/rules/commit-and-pr.md) | commit messages, pull requests |
| [`.agent/context/project.md`](../.agent/context/project.md) | what the project is, the core scenario |
| [`.agent/context/glossary.md`](../.agent/context/glossary.md) | vocabulary — use exactly these words |
| [`.agent/context/stack.md`](../.agent/context/stack.md) | tech, versions, commands |
| [`.agent/context/constraints.md`](../.agent/context/constraints.md) | deadline, webview, no backend |
| [`.agent/workflows/`](../.agent/workflows/) | pick a task, implement it, record evidence, self-review |
| [`.agent/commands/`](../.agent/commands/) | reusable, tool-agnostic prompts |

---

## Authority order

When two documents disagree:

```
.agent/rules/invariants.md  >  docs/ARCHITECTURE.md  >  docs/task/TASK-*.md  >  existing code
```

Still unclear: **stop and ask a human.** Six days is not enough to go the wrong way and come back.

---

## Maintaining this file

Adding or removing a file under `src/` means updating the "File by file" table **in the same
PR**. A map pointing the wrong way is worse than no map.

## `tests/`

| File | What it pins down | Task |
|---|---|---|
| `tests/registry.spec.ts` | `toolsFor(uiState)` switches tools on and off again | `TASK-013` |
| `tests/modelContext.spec.ts` | a withdrawn tool is actually gone from the host, on both API shapes | `TASK-006` |
| `tests/conflict.spec.ts` | conflict detection and the audit trail, against a real PGlite | `TASK-009`, `TASK-014` |
| `tests/handlers.spec.ts` | all eight handlers, and that a story card cannot overstate itself | `TASK-011`, `TASK-023` |
| `tests/certainty.spec.ts` | the ladder's glossary wording and its WCAG AA contrast | `TASK-021` |
| `tests/panels.spec.ts` | every tool has a readable sentence; contradicting sources sort first | `TASK-022`, `TASK-024` |
| `tests/spreads.spec.ts` | the tear exists iff a conflict is open, and healing names a person | `TASK-018`, `TASK-019`, `TASK-026` |
| `tests/core-loop.spec.ts` | **the demo core end to end**, and that the button and the tool are one function | `TASK-025`, `TASK-008` |

Tests run against a real in-memory PGlite, never a mock: every guarantee they check is enforced
by SQL, and a mocked database cannot refuse anything.
