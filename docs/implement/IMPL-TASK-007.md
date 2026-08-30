---
task: TASK-007
status: done
date: 2026-08-30
author: Lecoeurdelest
---

# IMPL-TASK-007 — Seeded sample archive

## What was built

`src/seed/loadSeed.ts` stages the archive described in `src/seed/family.sql` **through the
command layer**: three people, two places, the 1972 recollection with Mẹ's oral account, and the
1974 claim carried by the photograph. `seedIfEmpty()` runs on boot and does nothing when the
archive already holds something; `reseed()` wipes and re-stages so the demo can be run more than
once. No conflict row is written — the disagreement is left latent for `v_open_disagreement` to
notice and for the agent to flag, which is steps 5–6 of the core scenario.

## Acceptance criteria

- [x] Opening the app for the first time shows an archive with content
- [x] `v_open_disagreement` returns exactly one row after seeding
- [x] Seeding runs through the command layer and no constraint blocks it

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-007-junit.xml` — `tests/conflict.spec.ts` seeds in `beforeEach` |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — 12/12 |
| Browser | E2E in Chrome 151: fresh profile → 2 claims, 1 disagreement, 5 base tools |
| Isolation | `npm run arch:check` — R3 green |

## Deviations

**The photograph is one `source` row, reused by id.** The first implementation recorded it twice
— once supporting the 1974 claim, once contradicting the 1972 one — which would have shown a
judge two photographs where the story has one. `linkClaimToSource` gained a `source_id` option
for this. One artefact starting a family argument is the whole point of the scene.

**`addMemoryClaim` gained an optional `certainty`.** The seed spec calls for claim 1 to be
`'oral'`, but a human-actor claim defaulted to `'uncertain'`. The parameter is capped: agents are
still forced to `'oral'`, and no caller reaches `'conflicting'` or `'confirmed'` through this
door.

**Claim 2 is `'document_supported'`, which the spec does not state.** The photograph supports it,
and `linkClaimToSource` raises the label inside the same transaction so the DEFERRABLE
`claim_evidence_backed` trigger validates at COMMIT. This is the only code path that exercises
that trigger — it was previously reachable only from `db:verify`'s hand-written SQL.

**Seeding is memoised in `bootstrap.ts`.** StrictMode mounts effects twice in development, both
passes saw an empty archive, and the demo opened with four claims. Found by the E2E probe, not by
reasoning.

## Known gaps

- `src/seed/family.sql` remains 31 lines of comment. It is the spec, and `loadSeed.ts` is the
  implementation, which is what the file itself asks for — but the two can drift with nothing to
  catch it.
- No `followup_question` is seeded. The demo relies on the agent proposing one live.
- The seed has no photograph *file*, only a title and a verbatim note. `TASK-022`'s evidence panel
  will want an image.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☑ | seeding is not a tool and is absent from `descriptors.ts` |
| R2 — shared write door | ☑ | every seeded row goes through `commands.*`; no raw INSERT anywhere in `src/seed/` |
| R3 — only the command layer touches the database | ☑ | `isEmpty` delegates to `commands.isArchiveEmpty()`; `arch:check` caught the first attempt, which imported `db.ts` directly |
| R4 — the registry is a pure function | ☐ | untouched |
| R5 — the view layer is read-only | ☐ | untouched |

## Files changed

- `src/seed/loadSeed.ts`
- `src/domain/commands.ts` — `addPlace`, `linkClaimToSource`, `resetArchive`, `isArchiveEmpty`
- `src/bootstrap.ts` — `seedIfEmpty()` on boot, memoised
