---
id: TASK-037
title: The forest fills the screen, and explains itself
branch: A
day: 6
depends_on: [TASK-034]
status: done
---

# TASK-037 — The forest fills the screen, and explains itself

| | |
|---|---|
| **Branch** | A · view/ |
| **Depends on** | `TASK-034` |
| **Related** | `TASK-031` (Backstage) — they share `Archive.tsx`; see *Where this ends and TASK-031 begins* |
| **Requirements** | [`FR-BOOK-08`, `FR-BOOK-09`](../requirements/functional/FR-BOOK-book-canvas.md) (fourth amendment), [`NFR-A11Y`](../requirements/non-functional/NFR-A11Y-accessibility.md), [`NFR-PORT`](../requirements/non-functional/NFR-PORT-webview-portability.md) |

## Goal

Product owner, 2026-08-31: *"garden là chiếm toàn màn hình và không có chữ hướng dẫn"* — the forest
takes the whole screen, and there is no instruction text on it.

Two demands, and they are the same demand. A picture that needs a caption telling you how to use
it is not yet doing its job. A picture that is 620 px tall in a column, under a heading and four
lines of boot diagnostics, was never going to do its job.

## Where the forest is today, precisely

| Where | What it costs |
|---|---|
| `Archive.tsx:82` | `<BookStage />` sits inside `.layout` |
| `app.css:24` | `.layout` is `max-width: 900px` with 32 px of padding, so on a 1440 px screen the forest is 62 % of the width |
| `app.css` · `.forest-stage` | `height: min(74vh, 620px)` — a letterbox, not a world |
| `Archive.tsx:34-67` | a title, an English tagline and a `WEBMCP / ARCHIVE READY IN / CLAIMS / OPEN CONFLICTS` list push it below the fold before it starts |
| `Forest.tsx` · `.forest-invite` | *"Rê để đi trong rừng. Bấm một đốm sáng, nó mở ra thành quyển sổ."* |

Measured at 1440×900: the forest occupies roughly **a third of the first screen**. The first thing
a judge sees is `not offered by this browser`.

## In scope

- the forest becomes the first viewport: full-bleed, edge to edge, `100dvh`
- the instruction line is deleted — from the component and from both locales
- the affordance takes over the job the sentence was doing (see *How it teaches itself*)
- the page below still exists and is still reachable by ordinary scrolling

## Out of scope

- **no rewrite of the shell.** The header, the tools and the audit trail move *below* the forest
  and are otherwise untouched. Rehousing them is `TASK-031`.
- no change to what a light means, where it goes, or what clicking one does — that is `TASK-034`
  and it is done
- no WebGL, still

## The rule this task must not break

**Removing the instruction is not removing the accessible name.**

`NFR-A11Y-01` and `NFR-A11Y-03` are about whether a person who cannot see the picture can still
use it. Nothing in this task touches that: every light keeps its `aria-label`
(`Bà ngoại · moved_to · 1972 · Lời kể`), keeps its place in focus order, keeps ArrowLeft/ArrowRight.

What goes is the sentence aimed at someone who *can* see the picture and should not need telling.
A sighted reader learns by moving the pointer; a screen-reader reader was never being served by
that sentence anyway, and is served by the labels.

## How it teaches itself, with no sentence

The instruction was carrying three facts. Each needs a home:

| The sentence said | What carries it instead |
|---|---|
| *this responds to your pointer* | the parallax answers on the first pixel of movement — it already does, and full-bleed makes it unmissable |
| *these dots are clickable* | `cursor` change plus a light that grows and names itself on hover — the hover name already exists, it just needs to feel like a target |
| *there is more below* | the forest's bottom edge fades into the page instead of ending on a hard line |

If, when this is built, the affordances do **not** carry it, say so in `IMPL-TASK-037` rather than
quietly putting the sentence back.

## One reading that needs confirming

*"Chữ hướng dẫn"* is read here as **instruction copy only**. Two other pieces of text stay, and the
reasoning is written down so it can be overruled cheaply:

- **The legend** (`Chưa rõ · Lời kể · Có tài liệu · Mâu thuẫn · Đã xác nhận · Chưa ai kể`) is a
  key, not an instruction. It is also load-bearing: `NFR-A11Y-02` forbids carrying meaning by
  colour alone, and `tests/certainty.spec.ts` asserts it. Deleting it would make the forest fail an
  accessibility requirement that currently passes.
- **The summary** (`4 mẩu ký ức · 0 chỗ còn trống · 1972–1995`) is a status line — the state of the
  archive in words, which is the same requirement again.

If the product owner meant *all* text, the legend has to be replaced by something non-textual
before it can go, not simply removed.

## Where this ends and TASK-031 begins

They both edit `Archive.tsx` and they must not fight.

- **This task** owns the **first viewport**: the forest fills it, nothing sits above it.
- **`TASK-031`** owns **everything else**: where the boot diagnostics, the tool panel and the audit
  trail live, and whether a family member ever sees them.

This task pushes them below the fold. It does not decide their fate. If `TASK-031` lands first,
this task's job shrinks to the stage geometry.

## Acceptance criteria

- [x] The forest fills the first viewport edge to edge — no `max-width` column, nothing above it
- [~] It is exactly the visible viewport tall on a phone — the rule applies, but `dvh` and `vh`
      resolve identically in headless Chrome, so the toolbar case is `TASK-027`'s to confirm
- [x] No instruction sentence anywhere in the view, and the key is gone from both locale files
- [x] Pointer movement is answered immediately; a light reacts visibly to hover
- [~] The rest of the page is reachable by scrolling; the lower edge signal is weaker than asked — see IMPL Deviations
- [x] Every light keeps its accessible name, its focus order and its arrow-key travel
- [x] A vertical swipe on a phone scrolls the page; a horizontal drag walks the forest
- [x] `prefers-reduced-motion` is still honoured
- [x] Entry chunk does not regress; no runtime network request

## Files touched

- `src/Archive.tsx`
- `src/view/Forest.tsx`
- `src/app.css`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/forest.spec.ts` — two tests pinning the rule (i18n.spec.ts needed no change)

## Notes

**`100dvh`, and why it is not a detail.** `NFR-PORT-01` names WKWebView as a browser this must work
in. `100vh` there is the height with the toolbar *hidden*, so a full-screen element is taller than
the screen and the bottom of the forest sits under the browser chrome. Use `100dvh` with a `100vh`
fallback for anything older.

**The scroll trap.** `.forest-stage` already sets `touch-action: pan-y`, which is what lets a
vertical swipe scroll the page while a horizontal drag walks the forest. Full-bleed makes that rule
load-bearing rather than incidental — if it is lost, a phone reader cannot scroll past the forest
at all, and the tools and the audit trail become unreachable.

**Do not fix it by shrinking the light count.** A taller stage means more pixels of glow, not more
lights: `ambientCount` is a function of width and should stay that way. If a phone struggles, the
lever is `glowLayers`, which is already there.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-037`
3. Write `docs/implement/IMPL-TASK-037.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
