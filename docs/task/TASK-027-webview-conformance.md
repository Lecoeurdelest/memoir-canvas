---
id: TASK-027
title: Confirm behaviour in the in-app browser
branch: B
day: 5
depends_on: [TASK-025]
status: todo
---

# TASK-027 — Confirm behaviour in the in-app browser

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 5 |
| **Depends on** | `TASK-025` |
| **Requirements** | [`NFR-PORT`](../requirements/non-functional/NFR-PORT-webview-portability.md), [`NFR-PERF`](../requirements/non-functional/NFR-PERF-performance.md), [`NFR-REL`](../requirements/non-functional/NFR-REL-reliability.md) |

## Goal

Run the full demo core inside the ChatGPT in-app browser on iOS and Android.

## In scope

- check the modelContext API name
- check PGlite loads
- check WebGL survives
- measure first-frame time

## Out of scope

- —

## Acceptance criteria

- [ ] The demo core runs end to end in the in-app browser
- [ ] First contentful frame under 2 seconds
- [ ] No network requests beyond the app's static assets
- [ ] Results written into `docs/implement/IMPL-TASK-027.md`

## Files touched

- —

## Notes

Probing for this must start on **day one** (`TASK-006`). This task is the final formal confirmation.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-027`
3. Write `docs/implement/IMPL-TASK-027.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
