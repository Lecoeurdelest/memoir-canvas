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

## Verified 2026-08-31 — everything that does not need an account

The deploy itself needs the product owner's Cloudflare login, so it is not done. Everything that
could fail *before* that point was checked against the real `dist/`, served by `vite preview`:

| Check | Result |
|---|---|
| `npm run build` | clean; `dist/` holds `index.html`, `_headers`, and the assets |
| `_headers` reaches `dist/` | yes — Cloudflare Pages applies the CSP from there |
| The built app boots | PGlite starts, the forest paints at full viewport height, four lights |
| Off-origin requests | **none** |
| Console errors | one, a missing `favicon.ico`; fixed with an inline data-URI icon |
| Entry chunk | 145 kB / **47 kB gz** |
| Secrets in the repo or its history | none — nothing is read from `import.meta.env` |

`npm run deploy` now runs the build and `wrangler pages deploy dist`. Wrangler opens a browser
login on first use; **no token is stored in this repo**, and none should ever be.

**Still to do, and only the product owner can:** run `npm run deploy`, then open the resulting URL
on a real phone (`TASK-027`) and confirm the CSP header arrives — `curl -I <url>` should show the
`Content-Security-Policy` line, because `_headers` is silently ignored if the file is misplaced.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-028`
3. Write `docs/implement/IMPL-TASK-028.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
