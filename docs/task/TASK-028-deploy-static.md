---
id: TASK-028
title: Static deploy
branch: B
day: 5
depends_on: [TASK-027]
status: todo
---

# TASK-028 — Static deploy

| | |
|---|---|
| **Branch** | B · domain/ + mcp/ + store/ |
| **Planned day** | Day 5 |
| **Depends on** | `TASK-027` |
| **Requirements** | [`NFR-SEC`](../requirements/non-functional/NFR-SEC-security.md), [`NFR-PRIV`](../requirements/non-functional/NFR-PRIV-privacy-local-first.md) |

## Goal

Build statically and deploy to Cloudflare Pages. A public URL that opens in the in-app browser.

## In scope

- `npm run build` emits `dist/`
- deploy to Cloudflare Pages
- check the URL in the in-app browser

## Out of scope

- no environment secrets
- no server

## Acceptance criteria

- [ ] The public URL opens
- [ ] No runtime network requests beyond the app's own assets
- [ ] No secret anywhere in the repo or its git history

## Files touched

- `public/_headers`

## Notes

Cloudflare Pages because the challenge has a dedicated Cloudflare prize and it is genuinely static hosting.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-028`
3. Write `docs/implement/IMPL-TASK-028.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
