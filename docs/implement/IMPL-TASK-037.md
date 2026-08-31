---
task: TASK-037
status: done
date: 2026-08-31
author: Lecoeurdelest
---

# IMPL-TASK-037 — The forest fills the screen, and explains itself

## What was built

`<BookStage />` moved out of `.layout` and above it, so the forest is the first viewport: full
bleed, `100dvh`, nothing over it. The instruction line is gone from the component and from both
locale files, and hover took over the job it was doing — a light drops its animation and grows to
1.5× under the pointer, which is a target reacting rather than a caption explaining. The book
skins used to borrow `.layout`'s 900 px column, so they now carry their own `.reading` wrapper;
without it, opening a memory would have thrown the spread across the full width of a desktop
screen.

Density was retuned because the stage stopped being a 620 px letterbox: at viewport scale the old
counts left the forest looking thin rather than deep.

## Acceptance criteria

- [x] The forest fills the first viewport edge to edge — no `max-width` column, nothing above it
- [~] It is exactly the visible viewport tall on a phone (`dvh`, with a `vh` fallback) — **not provable here; see Known gaps**
- [x] No instruction sentence anywhere in the view, and the key is gone from both locale files
- [x] Pointer movement is answered immediately; a light reacts visibly to hover
- [x] The rest of the page is reachable by scrolling
- [~] The forest's lower edge shows there is more — **partially; see Deviations**
- [x] Every light keeps its accessible name, its focus order and its arrow-key travel
- [x] A vertical swipe on a phone scrolls the page; a horizontal drag walks the forest
- [x] `prefers-reduced-motion` is still honoured
- [x] Entry chunk does not regress; no runtime network request

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-037-junit.xml` — 94 passing, up from 92 |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — N/A, no schema or command change |

Measured in Chrome:

| What | 1440×900 | 390×844 |
|---|---|---|
| `.forest` height vs viewport | 900 / 900 | 844 / 844 |
| `.forest` top | 0 | 0 |
| `.layout` begins at | y = 900 | below the fold |
| `touch-action` on the stage | `pan-y` | `pan-y` |
| Ambient fireflies | 170 | 44 |
| Trunks | 78 | 42 |
| Memory lights | 4 | 4 |
| `.forest-invite` in the DOM | absent | absent |

`.reading` measures 900 px when a memory is open, so the spread keeps its column. Entry chunk
**145.37 kB / 46.97 kB gz** — unchanged again, third task running.

Two new tests pin the requirement rather than the rendering:

- `carries no instruction copy in either language` — `forest.invite` must not exist. Key parity in
  `tests/i18n.spec.ts` would happily let a caption back in as long as it were added to *both*
  files; this will not.
- `still names every light for someone who cannot see it` — the certainty word and the
  out-of-reach phrase resolve in both languages, so the caption cannot be traded for the labels.

## Deviations

**`ambientCount` was raised, having written in the task doc that it should stay a function of
width.** It still is one; the numbers changed — 24/60/108 became 44/92/170, and trees 8+3n/14+6n
became 10+4n/18+8n. The task's note was aimed at a different temptation (fixing a slow phone by
deleting lights, when the lever is `glowLayers`). This is the opposite move: the stage went from
620 px to a full viewport, so the same count spread over a much larger area and the forest read as
sparse instead of deep. The phone bucket still runs a single glow layer.

**The "there is more below" affordance is weaker than the task asked for.** What exists is the
boundary itself: 100 dvh of near-black meeting the paper-coloured page at a hard line, which does
read as *something starts here*. What does not exist is anything that positively invites the
scroll. The honest options were a chevron — which `FR-BOOK-08` calls a navigation control — or
cutting the stage to `calc(100dvh - 34px)` so a strip of the page peeks, which contradicts
*"chiếm toàn màn hình"*. Neither was worth overruling the brief on, so the criterion is marked
partial rather than ticked, and it is written here instead of being quietly dropped.

**Hover drops the animation instead of layering on top of it.** A running keyframe owns
`transform`; a hover rule that also sets `transform` wins only in the gaps between frames and
produces a stutter. `animation: none` on hover is the fix, and it has a second benefit — the light
holds still while you aim at it.

## Known gaps

- **`dvh` could not be verified where it matters.** In headless Chrome `dvh` and `vh` resolve to
  the same number, so the measurement above proves the rule applies, not that it solves the iOS
  problem it exists for. The real check is `TASK-027` on a physical phone, and it should be
  explicitly looked for there: with `vh`, the bottom of the forest hides under Safari's toolbar.
- **The private-browsing and rebuild banners are now below the fold.** They live in `.layout`,
  which starts after the forest. They are still in the DOM and still `role="status"`, so assistive
  technology announces them on change, but a sighted reader in a private window no longer sees
  `NFR-REL-03`'s warning without scrolling. `TASK-031` owns where the shell lives and should fix
  this properly; noting it because it is a real regression, not a neutral move.
- **On a phone there is now no hover and no caption.** `.memory-name` is `display: none` under
  700 px, so a touch reader gets neither the label nor the sentence — they get a glowing circle and
  the universal expectation that it can be tapped. That is probably enough, but it is an
  assumption, and the phone check is the place to find out.
- **The legend and the status line were kept**, on the reading recorded in the task doc: *"chữ
  hướng dẫn"* means instruction copy, not the key. If the product owner meant all text, the legend
  needs a non-textual replacement first — `NFR-A11Y-02` forbids carrying meaning by colour alone
  and `tests/certainty.spec.ts` enforces it.
- The forest scrolls away like ordinary content. It is not sticky and does not snap.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | No agent entry point involved. |
| R2 — shared write door | ☐ | No write path touched. |
| R3 — only the command layer touches the database | ☐ | No query added or changed. |
| R4 — the registry is a pure function | ☐ | `useSpreadNavigation` untouched; the `open` gate from `TASK-034` still decides the UI state. |
| R5 — the view layer is read-only | ☑ | Layout only. `Archive.tsx` reorders its children, `BookStage` gains a wrapper element, `Forest.tsx` loses a paragraph. No new state of any kind. |

`npm run arch:check` passes. As recorded in `IMPL-TASK-034`, that script has no R5 rule and cannot
see a wrong `UiState` — but this task adds neither, so the exposure is unchanged.

## Files changed

- `src/Archive.tsx`
- `src/view/BookStage.tsx`
- `src/view/Forest.tsx`
- `src/view/forestLayout.ts`
- `src/app.css`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/forest.spec.ts`
