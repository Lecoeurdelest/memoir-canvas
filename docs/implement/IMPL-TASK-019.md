---
task: TASK-019
status: done
date: 2026-08-30
author: Lecoeurdelest
---

# IMPL-TASK-019 — Healing the tear

## What was built

When the conflict on a spread is `resolved`, `Tear` stops rendering the rip and renders the healed
line instead — carrying the display name of the person who confirmed it. The projection resolves
that name from `conflict.resolved_by`, so the page shows a human, not an id. The winning claim's
label flips to `Confirmed` through `CertaintyBadge`, and the book turns forward again.

## Acceptance criteria

- [x] Heals only when `conflict.status='resolved'`
- [x] The confirming person's name appears on the page — a human is visible in the result

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-019-junit.xml` — the healing case in `tests/spreads.spec.ts` asserts torn before, healed and named after |
| Browser | Chrome 151: `✓ Vết rách đã lành · Người xác nhận: Cậu Ba`, and the next button re-enables |

## Deviations

**`resolvedBy` is resolved in the projection, not the component.** A view that looked the person
up itself would be domain logic in the view layer. The read model carries the `Person`, so the
component only renders a name.

**No heal animation.** The task says "heal animation". The transition is currently a re-render.
Adding one means also honouring `prefers-reduced-motion` (`NFR-A11Y-04`), which is a change to
make once, alongside the page turn, rather than twice.

**The label flip is not separate work.** `CertaintyBadge` already reads `claim.certainty`, and
`resolveClaim` writes `confirmed`, so the flip happens because the data changed. Nothing in the
view decides it.

## Known gaps

- No animation (above), so the most satisfying beat in the demo currently just appears.
- The resolution note is stored and never shown; the reader sees who decided but not why.
- The superseded claim vanishes from the spread entirely, because the projection reads only
  active claims. What was replaced is in the audit trail but not on the page.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | untouched |
| R2 — shared write door | ☐ | healing is a consequence of `commands.resolveClaim`, not a separate write |
| R3 — only the command layer touches the database | ☑ | the person is resolved in the projection |
| R4 — the registry is a pure function | ☑ | the conflict closing withdraws `resolve_claim`, verified in the browser |
| R5 — the view layer is read-only | ☑ | no state at all |

## Files changed

- `src/view/Tear.tsx`
- `src/store/projection.ts` — `resolvedBy`
- `src/app.css`
