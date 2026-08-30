---
id: TASK-021
title: Certainty badges
branch: C
day: 2
depends_on: [TASK-004]
status: todo
---

# TASK-021 — Certainty badges

| | |
|---|---|
| **Branch** | C · panels/ + seed/ + content |
| **Planned day** | Day 2 |
| **Depends on** | `TASK-004` |
| **Requirements** | [`FR-I18N`](../requirements/functional/FR-I18N-bilingual.md), [`NFR-A11Y`](../requirements/non-functional/NFR-A11Y-accessibility.md) |

## Goal

Five certainty labels, bilingual, not relying on colour alone.

## In scope

- 5 labels per `.agent/context/glossary.md`
- bilingual vi / en
- text plus shape, not only colour

## Out of scope

- —

## Acceptance criteria

- [ ] Readable with colour blindness
- [ ] Contrast meets WCAG AA against the page background
- [ ] Translations match the glossary word for word

## Files touched

- `src/panels/CertaintyBadge.tsx`

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-021`
3. Write `docs/implement/IMPL-TASK-021.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
