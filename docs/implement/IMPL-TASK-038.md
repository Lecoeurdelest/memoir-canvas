---
task: TASK-038
status: done
date: 2026-08-31
author: Lecoeurdelest
---

# IMPL-TASK-038 — The page nobody has written yet

## What was built

The unlit rings stopped being decoration. A ring is now a named, focusable target, and reaching one
opens a **ruled page** with the assistant's question written in the margin in faint ink. The family
writes the answer onto the page, signs it with a name, and the ring goes out.

Behind it, `commands.answerFollowupQuestion` — a command with **no tool**, and there will not be
one. `schema.sql` has said so since it froze:

```sql
GRANT UPDATE (status, answer_text, answered_at) ON followup_question TO app_human;
```

`app_agent` is absent from that line. The grant has been sitting there unused since day one; this
task is the first thing to lean on it, and it holds.

## Acceptance criteria

- [x] A ring in the forest is focusable, named, and opens the blank page
- [x] The assistant's question appears in the margin, attributed to the assistant
- [x] Writing an answer records it against the claim the question was about
- [x] The answer is stored **verbatim** and attributed to the person who told it
- [x] The question becomes `answered`, and the ring goes out
- [x] An **agent** calling the same command is refused by Postgres, verbatim
- [x] Keyboard reaches the whole path
- [x] `npm run db:verify` 12/12; `tests/core-loop.spec.ts` untouched

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-038-junit.xml` — 159 passing, up from 147 |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — 12/12 |

The assertion this task exists for, from `tests/blankPage.spec.ts`:

```
rejects.toThrow(/permission denied/i)          — the agent answering its own question
questions[0].status === 'open'                 — and the question survives the attempt
```

Driven in Chrome, in Vietnamese, as the full loop:

| Step | Result |
|---|---|
| Agent calls `propose_followup_question` | `ok {"question_id": …, "status":"open"}` |
| Forest | `4 mẩu ký ức · 1 chỗ còn trống`; the ring is named `Chưa ai kể — Giữa 1983 và 1988 …` |
| Reaching the ring | the blank page, `Trang này còn trắng.`, question in the margin |
| Before words and a name | the write control is disabled |
| After writing and signing | back in the forest, `0 chỗ còn trống`, **ring gone** |

## Deviations

**The answer does not become a new firefly**, as the design's copy promises. It becomes an oral
account recorded verbatim against the claim the question was asked about. Making it a memory of its
own means deriving a subject and a predicate from prose — inventing a structured assertion out of
free text, which is the precise failure this project exists to prevent, committed by the feature
built to let people speak. The visible loop still closes: the ring goes out, and the family's words
are in the archive under their name.

**The stance is `mentions`, not `supports`.** A recollection prompted by a question about a gap is
not a verdict on the year it was asked about, so it must not strengthen it.

**The teller is chosen from a dropdown**, which is a control on a page that is otherwise written on.
`source_oral_needs_a_voice` makes an unattributed oral account impossible, and offering the names is
better than discovering that by refusal. It is the one place in this view that is a form.

## Known gaps

- **A question pointing at a conflict rather than a claim is refused** with a readable message
  telling the reader to settle it on the torn page instead. That is honest but abrupt — the ring
  is reachable and then declines to do anything.
- **The ruled lines and the writing area do not share a baseline.** The rules are a repeating
  gradient at 28 px and the textarea's line-height matches, but they are not locked together, so
  a resized textarea drifts off the lines.
- **No draft is kept.** Navigating away from a half-written page loses it.
- **The page number is a word, not a number.** The design shows `— 18 —`; a spread has an index but
  an unanswered question does not, so it reads `— trang còn trắng —` instead.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | No new tool. `descriptors.ts` stays frozen at eight. |
| R2 — shared write door | ☑ | The new command lives in `commands.ts` with every other write, audited the same way. It has no tool because Postgres would refuse the agent anyway — the absence is honest, not a shortcut. |
| R3 — only the command layer touches the database | ☑ | The SQL is in `commands.ts`; the view calls the command. |
| R4 — the registry is a pure function | ☐ | Untouched. `openQuestion` is a store field outside `ui`. |
| R5 — the view layer is read-only | ☑ | `BlankPage` writes only through `commands.*`. |

## Files changed

- `src/view/BlankPage.tsx` (new)
- `src/domain/commands.ts` (`answerFollowupQuestion`)
- `src/view/Forest.tsx` (rings become targets), `src/view/BookStage.tsx`
- `src/store/store.ts`
- `src/app.css`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/blankPage.spec.ts` (new)
