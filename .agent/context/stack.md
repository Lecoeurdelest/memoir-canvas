# Stack and commands

## The stack

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Build | Vite + TypeScript | 5.x / 5.x | static build, no SSR |
| UI | React | 18.x | |
| 3D | React Three Fiber + drei | r3f 8.x | page content renders through `<Html transform>` — **not** `occlude`, see `FR-BOOK-07` |
| State (read) | Zustand | 4.x | holds the projection only |
| Database | **PGlite** | 0.5.x | PostgreSQL 18.3 → wasm32 |
| Persistence | IndexedDB (`idb://memoir-canvas`) | — | **not OPFS** — avoids the COOP/COEP requirement |
| Agent | WebMCP `provideContext()` | draft | through the `src/mcp/modelContext.ts` shim |
| Tests | Vitest | 2.x | JUnit XML into `docs/implement/evidence/` |

## Why PGlite and not SQLite-WASM

PGlite runs `src/domain/schema.sql` **unchanged** — all 8 enum types, the plpgsql function, and
the `CONSTRAINT TRIGGER … DEFERRABLE`. SQLite-WASM would have forced us to give up both
`DEFERRABLE` and enum types, and two of the ten checks in `db:verify` test exactly those — so the
suites are not comparable, and we cite only the PGlite run, which is reproducible with
`npm run db:verify`.

The price: **~5.3 MB gzip (~3.9 MB brotli, 16.8 MB raw)** → **lazy-load after the first frame**,
show the book first and bring up the database behind it. Budget 20 s (Fast 4G) to 80 s (Slow 4G)
before the archive is usable, and show a loading state for the book rather than an empty one.

## Commands

```bash
npm install
npm run dev          # vite dev server
npm run build        # static output in dist/
npm run typecheck    # tsc --noEmit
npm test             # vitest run
npm run test:evidence -- TASK-012   # write JUnit XML into docs/implement/evidence/
npm run db:verify    # run schema.sql on PGlite and prove the constraints still bite
npm run arch:check   # check R1–R5 with grep
```

`npm run db:verify` is the most important command in the repo: it is what proves the three core
constraints still hold. Run it after any change touching `schema.sql`.

## What is deliberately absent

No server. No API routes. No environment variables. No secrets. No runtime network calls. If
you find yourself needing one of those, you are heading the wrong way — re-read
`.agent/context/constraints.md`.
