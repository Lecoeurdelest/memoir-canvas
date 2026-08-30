---
id: TASK-026
title: Fallback: the CSS 3D book
branch: A
day: 4
depends_on: [TASK-016]
status: todo
---

# TASK-026 — Fallback: the CSS 3D book

| | |
|---|---|
| **Branch** | A · view/ |
| **Planned day** | Day 4 |
| **Depends on** | `TASK-016` |
| **Requirements** | [`NFR-PORT`](../requirements/non-functional/NFR-PORT-webview-portability.md) |

## Goal

If R3F does not survive the in-app browser: a CSS 3D book (`perspective` + `rotateY`) with DOM pages.

## In scope

- book layout in CSS
- keep the tear / heal metaphor intact
- switch behind a feature flag

## Out of scope

- only build this if the primary path fails

## Acceptance criteria

- [ ] The whole metaphor survives
- [ ] The three layers below are untouched — thanks to R5
- [ ] Costs no more than half a day

## Files touched

- `src/view/CssBook.tsx`

## Notes

**Decision deadline: end of day 3.** If R3F is still fighting you by then, fall back. Do not push on.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-026`
3. Write `docs/implement/IMPL-TASK-026.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
