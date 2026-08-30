---
id: TASK-006
title: The modelContext shim
branch: B
day: 1
depends_on: [TASK-005]
status: todo
---

# TASK-006 — The modelContext shim

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 1 |
| **Depends on** | `TASK-005` |
| **Requirements** | [`NFR-PORT`](../requirements/non-functional/NFR-PORT-webview-portability.md), [`NFR-REL`](../requirements/non-functional/NFR-REL-reliability.md) |

## Goal

A thin wrapper that feature-detects `navigator.modelContext` and `document.modelContext`, plus a manual tool panel for when neither exists.

## In scope

- feature-detect both names
- one unified `provide(tools)` API
- a manual tool panel as the fallback
- log which name was actually found

## Out of scope

- do not guess the API — detect it at runtime

## Acceptance criteria

- [ ] The app does not crash when `modelContext` is absent
- [ ] The manual panel can invoke all eight tools so the demo stays recordable
- [ ] Confirmed with your own eyes in the ChatGPT in-app browser

## Files touched

- `src/mcp/modelContext.ts`
- `src/panels/ManualToolPanel.tsx`

## Notes

**The biggest day-one risk.** The W3C proposal says `navigator.modelContext`; the challenge page shows `document.modelContext` in places. Nobody knows which ships. The manual panel is insurance for the demo video.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-006`
3. Write `docs/implement/IMPL-TASK-006.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
