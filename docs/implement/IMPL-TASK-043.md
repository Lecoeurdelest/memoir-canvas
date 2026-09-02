---
task: TASK-043
status: done
date: 2026-09-02
author: Codex
---

# IMPL-TASK-043 — WebMCP registration and the live interview loop

## What was built

The browser bridge now prefers `document.modelContext`, awaits `registerTool`, and owns an
AbortController for each registration. It retains navigator, unregisterTool and whole-set
provideContext compatibility. Registered tools resolve current handlers when invoked, refuse
withdrawn calls, and repaint the projection after native writes. Backstage reports registration
progress and errors rather than treating API presence as success. Graph reads now include linked
evidence, sources, family questions and answers, story cards, and a suggested next action.

The frozen tool descriptions now explain claim-linked questions and attributed answers. Their
input schemas, the eight-tool inventory, database schema, grants and command paths are unchanged.

## Acceptance criteria

- [x] Modern AbortSignal registration and legacy API shapes tested.
- [x] Withdrawn invocations refused; retained tools use live handlers without duplicate registration.
- [x] Async registration failures reported and retryable; disposal aborts pending registrations.
- [x] Real browser native writes update the UI and conditional tool inventory without reload.
- [x] Claim-linked family answers remain attributed sources; agents cannot supply human answers.
- [x] Scoped reads return the answer, evidence link and source contributor together.
- [x] Actual Codex in-app-browser discovery and invocation succeeded.

## Evidence

| Kind | Result |
|---|---|
| Full regression suite | `evidence/TASK-043-junit.xml`: 184 tests, 0 failures, 0 errors |
| Command | `npx vitest run --maxWorkers=1 --no-file-parallelism --reporter=junit --outputFile=docs/implement/evidence/TASK-043-junit.xml` |
| Typecheck / build | `npm run typecheck` and `npm run build` passed |
| Architecture | `scripts/check-invariants.sh` passed using Git Bash |
| Constraints | N/A — schema and commands unchanged; existing database tests included above |
| API reference | [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api), checked 2026-09-02 |

Browser run on localhost, using the fictional seed: five base tools were discovered in the
forest, six while opening Grandma's disputed memory, and eight after native `flag_conflict`.
Native `propose_followup_question` immediately exposed the answer button. A UI answer then
appeared as a source attributed to Cậu Ba. Native `generate_story_card` immediately rendered a
conflicting bilingual draft. Leaving the story withdrew the conditional tools, returning to five.
This used the actual browser WebMCP capability rather than the manual panel or a mock bridge.

## Deviations

Tests used one worker because parallel PGlite/WASM startup exceeded the local machine's test
timeouts in the baseline too. The default Windows `bash` resolved to unavailable WSL; the same
architecture script passed with installed Git Bash. No test assertions or timeouts were weakened.

## Known gaps

WebMCP remains browser-dependent; the actual run verified Codex's in-app browser, not every
Chrome or ChatGPT build. The production build retains pre-existing PGlite external-module,
eval and chunk-size warnings. Team acknowledgment of the frozen description change is still
required before merging; no merge or deployment was performed.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 | Yes | Native execution delegates only to existing handlers; no agent globals added. |
| R2 | Yes | All writes still enter existing domain commands and their audited transactions. |
| R3 | Yes | Graph reads use the projection; no new database imports or SQL in handlers. |
| R4 | Yes | Registry remains pure; one bridge reconciles its whole-set output with the host. |
| R5 | Yes | Registration status is UI state; the view reads refreshed projections. |

The self-review checklist was walked, including frozen-contract documentation and no new
runtime network calls, `any`, constraint changes, or domain state in components.

## Files changed

- `src/mcp/modelContext.ts`, `src/mcp/handlers.ts`, `src/mcp/descriptors.ts`
- `src/bootstrap.ts`, `src/store/store.ts`, `src/panels/Backstage.tsx`
- `src/i18n/locales/en.json`, `src/i18n/locales/vi.json` (registration status copy)
- `tests/modelContext.spec.ts`, `tests/handlers.spec.ts`
- `docs/API_SCHEMA.md`, `docs/_arch_map.md`, `docs/task/README.md`
- `docs/task/TASK-043-webmcp-reliability.md`, this log and JUnit evidence
