---
id: TASK-001
title: Repository scaffold
branch: B
day: 1
depends_on: []
status: todo
---

# TASK-001 — Repository scaffold

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 1 |
| **Depends on** | — |
| **Requirements** | [`NFR-MAINT`](../requirements/non-functional/NFR-MAINT-maintainability.md) |

## Goal

Vite + React + TypeScript strict, a directory tree that matches R1–R5, and the full npm script set.

## In scope

- `package.json` with every script listed in `.agent/context/stack.md`
- `tsconfig.json` in strict mode
- the five-layer `src/` structure
- `.gitignore` and `LICENSE` (MIT)

## Out of scope

- PGlite not needed yet (`TASK-003`)
- R3F not needed yet (`TASK-015`)

## Acceptance criteria

- [ ] `npm install` runs clean
- [ ] `npm run typecheck` green on an empty repo
- [ ] `npm run build` emits a static `dist/`
- [ ] `LICENSE` exists — a submission requirement

## Files touched

- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `index.html`
- `LICENSE`

## Notes

First task, blocks everything else. Move fast, do not gold-plate it.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-001`
3. Write `docs/implement/IMPL-TASK-001.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
