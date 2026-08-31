---
id: TASK-038
title: The page nobody has written yet
branch: A
day: 6
depends_on: [TASK-034, TASK-035]
status: done
---

# TASK-038 — The page nobody has written yet

| | |
|---|---|
| **Branch** | A · view/ |
| **Depends on** | `TASK-034` (the rings), `TASK-035` (the book) |
| **Design** | Artboard **5 · Trang còn trắng — kể vào** |
| **Requirements** | [`FR-BOOK-01`](../requirements/functional/FR-BOOK-book-canvas.md), `FR-BOOK-10` (fifth amendment), [`FR-EVID`](../requirements/functional/FR-EVID-evidence-sources.md), [`NFR-TRUST`](../requirements/non-functional/NFR-TRUST-epistemic-integrity.md) |

## Goal

The forest already draws an **unlit ring** for every question nobody has answered (`TASK-034`).
Nothing happens when you reach one. This is what should: the ring opens a **blank ruled page** with
the assistant's question written in the margin in faint ink, and the family writes the story
straight onto the page.

It closes the loop the demo already half-tells. The agent cannot settle the year, so it asks a
question instead — and that question becomes a place in the book where a person can answer it.

## The line this task exists to hold

**The assistant asks; the words are the family's.** Design copy, artboard 5:

> *Trợ lý đặt câu hỏi; chữ là của người kể.*

Postgres already enforces it and has since the schema froze:

```sql
GRANT UPDATE (status, answer_text, answered_at) ON followup_question TO app_human;
```

`app_agent` holds no such grant. An agent that tries to answer its own question is refused by the
database, exactly as it is refused at `resolve_claim` — a second instance of the project's argument
that costs nothing to demonstrate because the GRANT is already written.

## In scope

- `src/view/BlankPage.tsx` — the ruled recto, the question in the margin, the writing area
- `commands.answerFollowupQuestion` — a **human-only** command: marks the question answered and
  records the answer as an oral account against the claim it was asked about, in one transaction
- rings in the forest become reachable: a ring opens this page
- the ring goes out when the page is written

## Out of scope

- no new agent tool. `descriptors.ts` is frozen at eight and stays frozen — this is a human
  affordance, and the agent's half (`propose_followup_question`) already exists
- no free-text parsing of any kind

## Acceptance criteria

- [x] A ring in the forest is focusable, named, and opens the blank page
- [x] The assistant's question appears in the margin, attributed to the assistant
- [x] Writing an answer records it against the claim the question was about, as `oral`
- [x] The answer is stored **verbatim** and attributed to the person who told it
- [x] The question becomes `answered`, and the ring goes out
- [x] An **agent** calling the same command is refused by Postgres, verbatim
- [x] Keyboard reaches the whole path
- [x] `npm run db:verify` still 12/12; `tests/core-loop.spec.ts` untouched

## Files touched

- `src/view/BlankPage.tsx` (new)
- `src/domain/commands.ts`
- `src/view/BookStage.tsx`, `src/view/Forest.tsx`
- `src/store/store.ts`
- `src/app.css`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/blankPage.spec.ts` (new)

## Notes

**The answer does not become a new claim, and that is deliberate.** The design says a written page
turns into a yellow firefly of its own. Doing that literally means deriving a subject and a
predicate from prose — inventing a structured assertion out of free text, which is the precise
failure this project exists to prevent, committed by the feature meant to enrich it. The family's
words are kept verbatim as an oral account, attributed, against the claim the question was about.
The visible loop still closes: the ring goes out.

`schema.sql` is **frozen** and this task does not touch it. The grant it relies on is already there.

## When it is done

1. `npm run typecheck` · `npm test` · `npm run db:verify`
2. `npm run test:evidence -- TASK-038`
3. Write `docs/implement/IMPL-TASK-038.md`
4. Walk `.agent/workflows/review-checklist.md`
