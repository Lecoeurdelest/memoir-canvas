---
id: TASK-042
title: Somewhere to tell it
branch: A
day: 6
depends_on: [TASK-038]
status: done
---

# TASK-042 — Somewhere to tell it

| | |
|---|---|
| **Branch** | A · view/ |
| **Depends on** | `TASK-038` (the blank page) |
| **Design** | Artboard **5**, and its copy: *"trang 18 · chưa ai kể · còn 8 chỗ như thế"* |
| **Requirements** | [`FR-BOOK-10`](../requirements/functional/FR-BOOK-book-canvas.md), [`FR-EVID`](../requirements/functional/FR-EVID-evidence-sources.md), [`NFR-TRUST`](../requirements/non-functional/NFR-TRUST-epistemic-integrity.md) |

## Goal

Product owner: *"Đốm sáng không có câu chuyện phải có chỗ ghi vào câu chuyện."*

`TASK-038` built the blank page, but it only opens for a question **the agent has asked**. A
first-run archive has none, so a family member has no way to add a memory at all — the one thing a
family memory archive most obviously has to let them do.

## Where an empty spot comes from

Not from a fixed decoration. **From the archive's own silences.** The design says so in its copy:
the blank page is headed *"Khoảng 1985"* and the margin note reads *"Giữa 1983 và 1988 nhà mình
không còn mẩu nào về tiệm may"*.

So: sort the years the archive holds, find the runs with nothing in them, and put an unlit ring at
the middle of each. A gap in a family's memory is a real fact about that family, computed rather
than invented.

## What writing one records — and what it must not

A story typed into a blank year cannot become a structured assertion about what happened; deriving
a subject and a predicate from prose is the failure this project exists to prevent.

What is knowable is exactly this: **a named person told a story, and it belongs to about this
year.** So the claim says that and no more — `predicate = 'remembered'`, the year, certainty
`oral` — and the story itself lives verbatim in an oral-account source in that person's name. The
archive gains a memory it can show and cite, and asserts nothing it was not told.

## In scope

- year-gap rings, derived from the spreads, alongside the question rings already there
- the blank page accepts both kinds: a question to answer, or a year to fill
- `commands.tellMemory` — claim and oral account in **one** transaction
- the forest counts the empty spots it is showing

## Out of scope

- no free-text parsing, no entity extraction, no date guessing from prose
- no new agent tool. Telling a story is a person's act

## Acceptance criteria

- [x] A first-run archive shows empty spots without the agent having asked anything
- [x] Each ring sits at a year the archive genuinely has nothing for
- [x] Reaching one opens the blank page headed with that year
- [x] Writing records a claim of `oral` certainty and the story verbatim in the teller's name
- [x] The claim asserts only that someone remembered something around that year
- [x] The new memory appears in the forest as a light
- [x] An agent calling `tellMemory` is refused, or holds no tool that reaches it
- [x] `npm run db:verify` still 12/12

## Files touched

- `src/view/forestLayout.ts`, `src/view/Forest.tsx`, `src/view/BlankPage.tsx`
- `src/domain/commands.ts`
- `src/store/store.ts`, `src/view/BookStage.tsx`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/forestGaps.spec.ts` (new)

## Notes

**One control, not two.** The person who tells the story is also the subject of the claim. Asking
separately who it is *about* is a second question a family will not want and the archive cannot
check — and "Mẹ told a story about 1985" is true, checkable, and enough.

## When it is done

1. `npm run typecheck` · `npm test` · `npm run db:verify`
2. `npm run test:evidence -- TASK-042`
3. Write `docs/implement/IMPL-TASK-042.md`
4. Walk `.agent/workflows/review-checklist.md`
