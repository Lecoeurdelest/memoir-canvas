---
id: TASK-045
title: The agent, shown by acting
branch: A
day: 6
depends_on: [TASK-043]
status: todo
---

# TASK-045 — The agent, shown by acting

| | |
|---|---|
| **Branch** | A · view/ |
| **Depends on** | `TASK-043` |
| **Requirements** | [`FR-MCP`](../requirements/functional/FR-MCP-tool-surface.md), `FR-BOOK-12`, [`NFR-TRUST`](../requirements/non-functional/NFR-TRUST-epistemic-integrity.md) |

## Goal

`TASK-040` made the agent visible with a sentence — *"Trợ lý đang cầm 5 công cụ"* — because the
same product owner said the agent's mechanism was unclear. `FR-BOOK-12` now removes sentences.

**Both are right, and the resolution is not to pick one.** A count that changes was always a weak
way to show this. The strong way is that the agent is seen **doing** something, and seen being
**refused**.

## The replacement

| Was | Becomes |
|---|---|
| a sentence counting tools | nothing at rest |
| — | when a tool runs, the thing it touched reacts: a light brightens as a claim is recorded, a ring appears as a question is asked |
| *Nhờ trợ lý quyết hộ*, a button | the assistant is asked by **putting its name to a year**, the same gesture a person uses — and Postgres refuses it in its own words, in place |

The last row is the one that matters. Today a person settles a conflict by putting a name on a
year, and asks the assistant by pressing a differently-shaped button. Make the assistant **one more
name on the page**, and the refusal stops being a demonstration and becomes the thing itself: the
same gesture, the same function, one name allowed and one not.

## In scope

- remove the tool-count line from the forest and the reading view
- the assistant appears among the names that can be put to a year, and is refused there, verbatim
- the refusal keeps its route to the audit row it wrote

## Out of scope

- no new tool, no change to `descriptors.ts`
- no change to any GRANT — the refusal must stay Postgres's, never the view's

## Acceptance criteria

- [ ] No sentence about the agent appears anywhere outside Backstage
- [ ] The assistant is offered by the same gesture as a person, and refused by Postgres verbatim
- [ ] The refusal is shown in place and still reaches its audit row
- [ ] The refusal text is never paraphrased — asserted
- [ ] A person putting their name to a year still succeeds
- [ ] `npm run db:verify` 12/12; `tests/core-loop.spec.ts` untouched

## Files touched

- `src/view/RefusedPage.tsx`, `src/view/Forest.tsx`, `src/view/BookStage.tsx`
- `src/app.css`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/backstage.spec.ts`

## Notes

A judge's six needs (`TASK-031`) must all still be met. Five are met in Backstage; the sixth — that
the human path and the agent path are the same function — is met **better** by this change than by
the button it removes.

## When it is done

1. `npm run typecheck` · `npm test` · `npm run db:verify`
2. `npm run test:evidence -- TASK-045`
3. Write `docs/implement/IMPL-TASK-045.md`
4. Walk `.agent/workflows/review-checklist.md`
