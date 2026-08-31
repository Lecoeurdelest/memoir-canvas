---
task: TASK-042
status: done
date: 2026-08-31
author: Lecoeurdelest
---

# IMPL-TASK-042 — Somewhere to tell it

## What was built

A first-run archive now offers somewhere to write. The forest draws an unlit ring for every **run of
years the archive holds nothing for**, computed from the years it does hold — not decoration, and
not waiting on the agent to ask anything.

Reaching one opens the blank page headed with that year, and the margin states the silence rather
than a prompt: *"Giữa 1986 và 1990 nhà mình chưa có mẩu nào."* Writing it records a memory in the
teller's name, and a new light appears in the forest.

## Acceptance criteria

- [x] A first-run archive shows empty spots without the agent having asked anything
- [x] Each ring sits at a year the archive genuinely has nothing for
- [x] Reaching one opens the blank page headed with that year
- [x] Writing records `oral` certainty and the story verbatim in the teller's name
- [x] The claim asserts only that someone remembered something around that year
- [x] The new memory appears in the forest as a light
- [x] No agent tool reaches `tellMemory`
- [x] `npm run db:verify` 12/12

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-042-junit.xml` — 178 passing |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — 12/12 |

Driven in Chrome on a **wiped** archive, so nothing had been asked:

| | |
|---|---|
| Forest at first run | `4 mẩu ký ức · 1 chỗ còn trống`, the ring named `Chưa ai kể — Khoảng 1988` |
| The page | headed `Khoảng 1988`; margin: `Giữa 1986 và 1990 nhà mình chưa có mẩu nào.` |
| After writing | `5 mẩu ký ức`, and a new light: `Mẹ kể một chuyện · 1988 · Lời kể` |

`tests/forestGaps.spec.ts` pins what the write is **not** allowed to claim: `predicate` is
`remembered` and never derived from the prose; `object_place_id`, `object_person_id` and
`object_text` all stay null, so nothing about a place or an event is guessed out of the sentence;
certainty is `oral`; `confirmed_by` is null. It also asserts the claim and the account are written
together **or neither** — a failure between them would leave a memory in the forest that nobody
said.

## Deviations

**Filling a silence usually creates two smaller ones.** 1981→1995 held one ring; writing at 1988
leaves 1981→1988 and 1988→1995, both still over the threshold, so the count went 1 → 2. That reads
like whack-a-mole and it is arithmetically honest: the archive genuinely still has those gaps, and
they shrink under `SILENT_YEARS` as they are filled. Recorded because the first reaction to seeing
it is that something is broken.

**One control, not two.** The person telling the story is also the subject of the claim. Asking
separately who it is *about* is a second question a family will not want and the archive cannot
check — and "Mẹ told a story belonging to about 1988" is true, checkable, and enough.

**`tellMemory` has no tool and needs no GRANT to stop an agent.** Unlike `answerFollowupQuestion`,
nothing in the schema forbids `app_agent` from inserting a claim — inserting claims is exactly what
an agent is *for*. What keeps this human-only is that it is not in `descriptors.ts`, which is
frozen. That is a weaker guarantee than a GRANT, and it is worth saying plainly rather than
implying the database is doing work it is not.

## Known gaps

- **`SILENT_YEARS` is 6, chosen not measured.** It gives one ring on the seeded archive, which
  suits the demo. A real family archive would want it tuned, and nothing tunes it.
- **A silence before the first memory or after the last is not drawn.** Only gaps *between* known
  years count, so the years before 1972 — where the oldest memories would be — offer nothing.
- **The ring's year is the midpoint**, so a story written into a fourteen-year gap is filed at its
  centre whether or not that is where it belongs. `circa` says so honestly; nothing lets the teller
  say otherwise.
- **A memory written this way has no place, no people, no predicate.** It is a light in the forest
  and a paragraph in a book, and it will never join a spread with anything else.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | No new tool; `descriptors.ts` frozen at eight. |
| R2 — shared write door | ☑ | `tellMemory` lives in `commands.ts` with every other write, audited the same way, one transaction. |
| R3 — only the command layer touches the database | ☑ | The SQL is in `commands.ts`. |
| R4 — the registry is a pure function | ☐ | `openYear` is a store field outside `ui`. |
| R5 — the view layer is read-only | ☑ | `BlankPage` writes only through `commands.*`. |

## Files changed

- `src/view/forestLayout.ts` (`silences`, `placeSilences`)
- `src/view/Forest.tsx`, `src/view/BlankPage.tsx`, `src/view/BookStage.tsx`
- `src/domain/commands.ts` (`tellMemory`)
- `src/store/store.ts`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/forestGaps.spec.ts` (new)
