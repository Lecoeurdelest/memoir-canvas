---
task: TASK-021
status: done
date: 2026-08-30
author: Lecoeurdelest
---

# IMPL-TASK-021 — Certainty badges

## What was built

`CertaintyBadge` renders the five rungs of the ladder bilingually. Each carries a word AND a
distinct glyph on a filling scale (○ ◔ ◑ ◈ ●), so the ranking survives greyscale and a screen
reader; the glyph is `aria-hidden`, and the word is the accessible name. The palette lives in
`PALETTE` beside the labels rather than in `app.css`, so a test can import exactly what renders.

## Acceptance criteria

- [x] Readable with colour blindness
- [x] Contrast meets WCAG AA against the page background
- [x] Translations match the glossary word for word

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-021-junit.xml` — 5 cases in `tests/certainty.spec.ts` |
| Contrast | measured: worst ratio **5.28:1** against both the badge ground and the page (AA needs 4.5:1) |
| Glossary | asserted row by row against `.agent/context/glossary.md`; the test parses the table |
| Browser | badge renders above the prose, glyph `aria-hidden="true"`, label switches with the language |

## Deviations

**Two translations were wrong and were corrected against the glossary, not the other way round.**
`oral` read "Oral account" where the glossary says "Oral recollection"; `document_supported` read
"Có giấy tờ" where the glossary says "Có tài liệu". The test now parses the glossary table, so
this cannot drift silently again.

**`uncertain` initially failed AA at 4.36:1** against its own background. The ink was darkened to
`#404542`, which measures 8.34:1. Found by measuring, not by looking.

**The palette moved out of CSS into TypeScript.** `?raw` imports of a `.css` file return an empty
string under Vitest — Vite intercepts CSS — so a test reading `app.css` silently asserted nothing.
Colours are now inline styles from a shared constant, which is also what the amended
`NFR-A11Y-05` asks for.

## Known gaps

- Only the badge palette is centralised. The rest of `app.css` is unchecked for contrast.
- The glyph scale reads as a ranking to a sighted user, but `conflicting` (◈) breaks the filling
  pattern deliberately, and nothing tells a screen-reader user that it sits between
  `document_supported` and `confirmed`.
- No dark theme.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | untouched |
| R2 — shared write door | ☐ | untouched |
| R3 — only the command layer touches the database | ☐ | untouched |
| R4 — the registry is a pure function | ☐ | untouched |
| R5 — the view layer is read-only | ☑ | pure presentation; takes props, holds no state, never writes |

## Files changed

- `src/panels/CertaintyBadge.tsx`
- `src/app.css`
- `tests/certainty.spec.ts`
