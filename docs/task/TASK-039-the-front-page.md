---
id: TASK-039
title: The front page — ask the book, and it marks itself
branch: A
day: 6
depends_on: [TASK-035]
status: done
---

# TASK-039 — The front page: ask the book, and it marks itself

| | |
|---|---|
| **Branch** | A · view/ |
| **Depends on** | `TASK-035` |
| **Design** | Artboard **6 · Trang đầu sách — hỏi và đánh dấu** |
| **Requirements** | [`FR-BOOK-11`](../requirements/functional/FR-BOOK-book-canvas.md) (fifth amendment), [`FR-CARD`](../requirements/functional/FR-CARD-story-cards.md), [`NFR-TRUST`](../requirements/non-functional/NFR-TRUST-epistemic-integrity.md) |

## Goal

The product owner asked for this twice: *"Sách thần như 1 công cụ tìm các quyển hồi ký"* — a book
you ask, which finds the memoirs. This is it, and it is not a search box bolted to a corner.

Ask a question on the book's **front page**. Three **ribbons** slide out of the spine, each marking
a page that bears on the answer, each carrying its year and its certainty colour. Pull a ribbon and
the book opens straight to that page.

## The line this task exists to hold

Design copy, artboard 6:

> *Câu trả lời không chắc hơn trang yếu nhất trong ba trang.*
> — The answer is no more certain than the weakest of the three pages.

That is `floorCertainty`, which already exists in `src/domain/types.ts` and already backs
`story_card.floor_certainty`. The front page must show it, and must show it as the **floor**, never
as an average and never as the best match. A search that quietly presents a confident-looking
answer built on one uncertain page is the same lie the rest of this project refuses.

## In scope

- `src/view/FrontPage.tsx` — the recto with the question, the verso with the ribbons
- matching, client-side and pure: subject name, predicate, place, source text, year
- at most three ribbons; each is the page's year, a short label, its page number and its certainty
- the floor certainty of the marked pages, stated as a floor
- pulling a ribbon jumps to that spread, obeying the wedge like every other route

## Out of scope

- no network, no index, no embedding, no ranking model — a few hundred rows is a `filter`
- no new write. The front page reads; it never records what was asked

## Acceptance criteria

- [x] Asking a question marks at most three pages, each with its year and certainty
- [x] The stated certainty is the **floor** of the marked pages, not the best of them
- [x] Pulling a ribbon opens that page, and the wedge still refuses a locked one
- [x] A question that matches nothing says so, and marks nothing
- [x] Matching works in both languages and against Vietnamese diacritics
- [x] Keyboard reaches every ribbon; each is named
- [x] Nothing is written to the archive by asking

## Files touched

- `src/view/FrontPage.tsx` (new)
- `src/view/bookSearch.ts` (new — pure, so it tests without a DOM)
- `src/view/BookStage.tsx`
- `src/app.css`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/bookSearch.spec.ts` (new)

## Notes

**Diacritics are the whole difficulty.** A family will type `da nang` for `Đà Nẵng` and `ba ngoai`
for `Bà ngoại`. Fold both sides with `normalize('NFD')` and strip combining marks, plus `đ → d`,
which NFD does **not** decompose. Getting this wrong makes the feature look broken to exactly the
people it is for.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-039`
3. Write `docs/implement/IMPL-TASK-039.md`
4. Walk `.agent/workflows/review-checklist.md`
