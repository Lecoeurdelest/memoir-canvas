---
id: TASK-036
title: The page that will not turn
branch: A
day: 6
depends_on: [TASK-035]
status: done
---

# TASK-036 — The page that will not turn

| | |
|---|---|
| **Branch** | A · view/ |
| **Depends on** | `TASK-035` |
| **Requirements** | [`FR-BOOK-03`](../requirements/functional/FR-BOOK-book-canvas.md), `FR-BOOK-04`, [`NFR-TRUST`](../requirements/non-functional/NFR-TRUST-epistemic-integrity.md) |

## Goal

An open conflict becomes a page that lifts under your hand and springs back, torn along the gutter.
**This is the task that carries the project's argument**, and if anything else in the redesign is
cut, this is not.

## In scope

- the refusal rendered from `spread.conflict` and nothing else (`FR-BOOK-06`)
- the leaf lifts and returns; a tear runs down the gutter in lacquer
- both competing claims on the two facing pages, neither favoured by construction
- settling by **dragging a person's name onto the year they confirm** — the gesture that replaces the Confirm button, and a better fit for the act: settling a memory is putting your name to it
- the healing: the tear closes, the spread carries the confirming person's name

## Out of scope

- no new write path. It calls `commands.resolveClaim`, the same function the `resolve_claim` tool calls (`R2`)

## Acceptance criteria

- [x] The refusal appears if and only if a conflict is open
- [x] Dragging forward lifts the page and returns it; the reader cannot pass
- [x] Neither competing claim is visually favoured
- [x] Dropping a name on a year calls `commands.resolveClaim` as `'human'`
- [x] An agent reaching the same function is still refused by Postgres, verbatim
- [x] Keyboard reaches the same outcome without a pointer
- [x] `tests/core-loop.spec.ts` — the DAY 4 GATE — passes untouched

## Files touched

- `src/view/RefusedPage.tsx` (new)
- `src/view/Tear.tsx`
- `src/app.css`
- `tests/refusal.spec.ts` (new — `core-loop.spec.ts` did not need changing)
- `src/view/Volume.tsx`, `src/view/CssBook.tsx`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`

## Notes

The DAY 4 GATE currently passes. Nothing in this task may make it fail; if a change here needs the
gate test edited, the change is wrong.

## When it is done

1. `npm run typecheck` · `npm test` · `npm run db:verify`
2. `npm run test:evidence -- TASK-036`
3. Write `docs/implement/IMPL-TASK-036.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
