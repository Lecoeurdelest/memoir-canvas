---
task: TASK-023
status: done
date: 2026-08-30
author: Lecoeurdelest
---

# IMPL-TASK-023 — The bilingual story card

## What was built

`generateStoryCard` computes `floor_certainty` as the weakest label among the cited claims and
refuses to cite a claim that does not exist. `card_floor_is_honest`, a DEFERRABLE constraint
trigger, re-derives the same value in SQL and refuses a mismatch, so a bug in the command cannot
ship a card that overstates itself. `src/panels/StoryCard.tsx` renders it bilingually, switching
language in place.

## Acceptance criteria

- [x] A card standing on one unverified recollection **must** carry that label, however well written it is
- [x] Switching language does not reload the page

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-023-junit.xml` — 3 card cases in `tests/handlers.spec.ts` |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — 12/12 |
| Browser | 9/9 in Chrome 151: floor computed from the data, badge above the prose, language switches without a reload |

## Deviations

**The aesthetic constraint was implemented as layout, not as a note.** The task says "a beautiful
card must not bury a weak label". The badge is rendered *above* the title and body, and the card's
left border is tinted by its own floor certainty, so an `uncertain` card cannot be made to look
settled by writing it well. Verified by comparing bounding boxes, not by eye.

**`floor_certainty` is enforced twice.** The command computes it and the schema re-derives it.
That is deliberate duplication: `NFR-TRUST-01` says the guarantee lives in SQL, and the
application copy exists only to give a readable answer.

## Known gaps

- A cited claim that has since been superseded renders as "a superseded claim" rather than its
  content. Correct, but thin — the reader cannot see what was replaced.
- No `generate_story_card` UI: cards can only be created through the tool panel or by an agent.
- `floor_certainty` is a snapshot. If a cited claim is later confirmed, the card keeps its old
  label until regenerated. Arguably right, but nothing says so to the reader.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | untouched |
| R2 — shared write door | ☑ | the card is written by `commands.generateStoryCard` only |
| R3 — only the command layer touches the database | ☑ | `StoryCard.tsx` reads the projection through the store |
| R4 — the registry is a pure function | ☐ | untouched |
| R5 — the view layer is read-only | ☑ | `StoryCard` and `CertaintyBadge` render and never mutate; the only local state is the chosen language |

## Files changed

- `src/panels/StoryCard.tsx`
- `src/panels/CertaintyBadge.tsx`
- `src/domain/commands.ts` — `generateStoryCard`
- `src/domain/schema.sql` — `card_floor_is_honest`
- `src/store/projection.ts` — `cards`
- `src/Archive.tsx`
- `src/app.css`
