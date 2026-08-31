---
task: TASK-039
status: done
date: 2026-08-31
author: Lecoeurdelest
---

# IMPL-TASK-039 — The front page: ask the book, and it marks itself

## What was built

The flyleaf. Turn **back past page one** and the book's front page appears — no button, because
that is how you reach the front of a book. Write a question on it and ribbons slide out of the
spine marking the pages that bear on the answer, each carrying its year, its page number and its
certainty colour. Pull one and the book opens there.

The line the view exists for is printed under the ribbons: **the answer is no surer than the
weakest page among them.** That is `floorCertainty`, the same function behind
`story_card.floor_certainty` — never an average, because averaging would let two confident pages
launder an uncertain one into a confident-looking answer.

## Acceptance criteria

- [x] Asking marks at most three pages, each with its year and certainty
- [x] The stated certainty is the **floor**, not the best of them
- [x] Pulling a ribbon opens that page, and the wedge still refuses a locked one
- [x] A question that matches nothing says so, and marks nothing
- [x] Matching works against Vietnamese diacritics
- [x] Keyboard reaches every ribbon; each is named
- [x] Nothing is written to the archive by asking

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-039-junit.xml` — 159 passing |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — N/A, this view writes nothing |

Driven in Chrome. Turning back past page one reached the flyleaf; typing **`ba ngoai da nang`** —
no diacritics, the way a family actually types — marked three pages:

```
1972 · Bà ngoại chuyển tới    · tr. 1 · Mâu thuẫn
1976 · Bà ngoại mở tiệm ở     · tr. 2 · Lời kể   · Chưa tới được…
1981 · Mẹ sinh ra ở           · tr. 3 · Chưa rõ  · Chưa tới được…
floor: ○ Chưa rõ — Câu trả lời không chắc hơn trang yếu nhất trong số này.
```

The floor is `Chưa rõ` — the weakest of the three, not the conflicting one and not the best. Two
ribbons are marked but unreachable, because the wedge applies to this route like every other.

`tests/bookSearch.spec.ts` pins the two things that would be easy to get wrong and hard to notice:
diacritic folding (`fold('Đà Nẵng') === 'da nang'`, and `đ → d`, which NFD does **not** decompose
because it is its own letter), and that the floor is always a rung actually present among the
marked pages rather than a computed middle.

## Deviations

**A found page beyond the tear is shown, but marked unreachable.** Hiding it would be the archive
concealing what it holds, which is worse than showing something a reader cannot yet open. The
ribbon is dimmed, `aria-disabled`, and its accessible name says why.

**Matching is a `filter` over folded text, and that is the whole algorithm.** No index, no ranking
model, no embeddings — a family archive is a few hundred rows, and ranking is by how many of the
asked words a page contains, ties broken by time order so the book reads forwards.

**Reaching the flyleaf has no discoverable affordance.** Turning back past page one is correct and
buttonless, but nothing suggests it. `FR-BOOK-08` forbids the caption that would rescue it, and the
honest position is that this is the weakest gesture in the book. Recorded rather than patched.

## Known gaps

- **Asking is not remembered.** Leave the flyleaf and the question is gone; there is no history of
  what the family has asked, and no `story_card` is generated from an answer.
- **The three ribbons do not synthesise.** The design shows a sentence joining the marked pages
  into an answer (*"Ba trang này gộp lại…"*). Writing that sentence means generating prose from
  claims, which is `generate_story_card`'s job and an agent's to do — the front page marks pages
  and states their floor, and stops there. Arguably that is the more honest half.
- **A one-letter word is ignored** to stop a stray keystroke marking the whole book, so a question
  that is genuinely one short word finds nothing.
- **Nothing is highlighted on the page it opens.** Pulling a ribbon opens the spread but does not
  point at what matched.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | No agent surface at all. |
| R2 — shared write door | ☐ | The front page performs no write. |
| R3 — only the command layer touches the database | ☐ | Reads the read model only. |
| R4 — the registry is a pure function | ☐ | Untouched. |
| R5 — the view layer is read-only | ☑ | `bookSearch.ts` is pure; `FrontPage` holds the typed question and nothing else. |

## Files changed

- `src/view/bookSearch.ts` (new — pure)
- `src/view/FrontPage.tsx` (new)
- `src/view/Volume.tsx`, `src/view/BookStage.tsx`
- `src/view/usePageDrag.ts` (pull-down to shut the book)
- `src/app.css`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/bookSearch.spec.ts` (new), `tests/pageturn.spec.ts`
