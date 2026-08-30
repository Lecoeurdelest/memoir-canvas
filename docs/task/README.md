# Tasks

29 tasks, six days, three branches. Numbering leaves room — new tasks go on the end, never
inserted in the middle.

How to pick one: [`.agent/workflows/pick-a-task.md`](../../.agent/workflows/pick-a-task.md)

## Status

| ID | Title | Branch | Day | Depends on | Done |
|---|---|---|---|---|---|
| [`TASK-001`](TASK-001-repo-scaffold.md) | Repository scaffold | B | 1 | — | ☐ |
| [`TASK-002`](TASK-002-schema-freeze.md) | Freeze the data schema | B | 1 | `TASK-001` | ☑ |
| [`TASK-003`](TASK-003-pglite-bootstrap.md) | Boot PGlite in a Web Worker | B | 1 | `TASK-002` | ☑ |
| [`TASK-004`](TASK-004-domain-types.md) | Domain types | B | 1 | `TASK-002` | ☐ |
| [`TASK-005`](TASK-005-tool-descriptors.md) | Freeze the eight tool descriptors | B | 1 | `TASK-004` | ☐ |
| [`TASK-006`](TASK-006-model-context-shim.md) | The modelContext shim | B | 1 | `TASK-005` | ☐ |
| [`TASK-007`](TASK-007-seed-archive.md) | Seeded sample archive | C | 1 | `TASK-003`, `TASK-008` | ☑ |
| [`TASK-008`](TASK-008-command-layer.md) | The command layer | B | 2 | `TASK-003`, `TASK-004` | ☐ |
| [`TASK-009`](TASK-009-audit-event.md) | Audit logging | B | 2 | `TASK-008` | ☑ |
| [`TASK-010`](TASK-010-projection-store.md) | Projection and store | B | 2 | `TASK-003`, `TASK-004` | ☑ |
| [`TASK-011`](TASK-011-mcp-handlers.md) | The eight tool handlers | B | 2 | `TASK-005`, `TASK-008` | ☑ |
| [`TASK-012`](TASK-012-static-registry.md) | Static registry | B | 2 | `TASK-006`, `TASK-011` | ☐ |
| [`TASK-013`](TASK-013-dynamic-registry.md) | Stateful tool registration | B | 3 | `TASK-010`, `TASK-012` | ☑ |
| [`TASK-014`](TASK-014-conflict-detection.md) | Detect and record conflicts | B | 3 | `TASK-008`, `TASK-013` | ☑ |
| [`TASK-015`](TASK-015-book-scene.md) | The 3D book scene | A | 2 | `TASK-001` | ☐ |
| [`TASK-016`](TASK-016-page-spread.md) | The page spread | A | 2 | `TASK-010`, `TASK-015` | ☐ |
| [`TASK-017`](TASK-017-page-turn.md) | Turning pages | A | 3 | `TASK-016` | ☐ |
| [`TASK-018`](TASK-018-tear-conflict.md) | The conflict tear | A | 3 | `TASK-014`, `TASK-016` | ☑ |
| [`TASK-019`](TASK-019-tear-heal.md) | Healing the tear | A | 3 | `TASK-018` | ☑ |
| [`TASK-020`](TASK-020-constellation.md) | The relationship constellation | A | 4 | `TASK-016` | ☐ |
| [`TASK-021`](TASK-021-certainty-badges.md) | Certainty badges | C | 2 | `TASK-004` | ☑ |
| [`TASK-022`](TASK-022-evidence-panel.md) | The evidence panel | C | 3 | `TASK-010`, `TASK-021` | ☑ |
| [`TASK-023`](TASK-023-story-card.md) | The bilingual story card | C | 4 | `TASK-010`, `TASK-021` | ☑ |
| [`TASK-024`](TASK-024-audit-panel.md) | The audit panel | C | 4 | `TASK-009` | ☑ |
| [`TASK-025`](TASK-025-core-loop-e2e.md) | Demo core running end to end | B | 4 | `TASK-013`, `TASK-014`, `TASK-018`, `TASK-019`, `TASK-022` | ☐ |
| [`TASK-026`](TASK-026-css-book-fallback.md) | Fallback: the CSS 3D book | A | 4 | `TASK-016` | ☑ |
| [`TASK-027`](TASK-027-webview-conformance.md) | Confirm behaviour in the in-app browser | B | 5 | `TASK-025` | ☐ |
| [`TASK-028`](TASK-028-deploy-static.md) | Static deploy | B | 5 | `TASK-027` | ☐ |
| [`TASK-029`](TASK-029-devpost-submission.md) | Devpost submission and video | C | 6 | `TASK-027`, `TASK-028` | ☐ |

## Milestones

| Day | Must be finished |
|---|---|
| 1 | `TASK-001` … `TASK-007` — **contracts frozen**, PGlite booting, API shim probed |
| 2 | `TASK-008` … `TASK-012`, `TASK-015`, `TASK-016`, `TASK-021` — the write path is open |
| 3 | `TASK-013`, `TASK-014`, `TASK-017` … `TASK-019`, `TASK-022` — dynamic registration, tear and heal |
| **4** | **`TASK-025` — THE GATE. The demo core runs end to end.** |
| 5 | `TASK-027`, `TASK-028` — webview conformance, deploy |
| 6 | `TASK-029` — video, README, submit. Submit half a day early. |

## The one task that matters most

**`TASK-025`.** If it is not running by the end of day 4, cut `TASK-020`, `TASK-023` and
`TASK-024` and put everyone on it. A demo with only the core still beats a beautiful demo whose
core does not work.

## Fallbacks and decision deadlines

| Fallback | Decide by |
|---|---|
| `TASK-006` manual tool panel | Day 1 |
| Drop PGlite → TypeScript guards + JSON persistence | End of day 2 |
| `TASK-026` CSS 3D book | End of day 3 |
| Cut `TASK-020`, `TASK-023`, `TASK-024` | End of day 4 |
