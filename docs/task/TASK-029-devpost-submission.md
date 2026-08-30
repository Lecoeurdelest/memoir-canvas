---
id: TASK-029
title: Devpost submission and video
branch: C
day: 6
depends_on: [TASK-027, TASK-028]
status: todo
---

# TASK-029 — Devpost submission and video

| | |
|---|---|
| **Branch** | C · panels/ + seed/ + content |
| **Planned day** | Day 6 |
| **Depends on** | `TASK-027`, `TASK-028` |
| **Requirements** | — |

## Goal

A description aimed at the four judging criteria, a three-minute video, a README, and a licence.

## In scope

- description structured around `WebMCP Leverage` / `Execution` / `Impact` / `Creativity`
- video under 3 minutes, public on YouTube, with audio
- README with run instructions
- public repo link

## Out of scope

- —

## Acceptance criteria

- [ ] The video shows **stateful registration** before the 2:00 mark
- [ ] The video shows the agent **calling tools live**, not a person clicking and narrating
- [ ] The description attributes correctly: challenge by OpenAI, WebMCP spec by W3C / Google / Microsoft
- [ ] Submitted before 2026-09-03 1PM PDT

## Files touched

- `README.md`
- `docs/USER_GUIDE.md`

## Notes

Submit half a day early. Do not submit at 12:55.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-029`
3. Write `docs/implement/IMPL-TASK-029.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
