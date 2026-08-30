# 08. Persistence and deployment

> **Status:** outline. Write it out when the corresponding task reaches it — do not write it
> ahead of time; six days leaves no room for speculative documentation.

## What this document answers

PGlite in the browser, IndexedDB, and a static build with nothing to fall over.

## Outline

- PGlite = PostgreSQL 18.3 → wasm32; it runs `schema.sql` unchanged
- Why not SQLite-WASM: it costs `DEFERRABLE` and enum types
- IndexedDB rather than OPFS: avoiding the cross-origin isolation requirement
- The write queue (main thread — see the amended `NFR-PERF-03`)
- Lazy-loading ~5.3 MB gz after the first frame, and why no chunk may statically import it
- Cloudflare Pages, `_headers`, and why COOP/COEP is not needed
- Dump export/import if sharing between machines is ever needed

## Related requirements

- `NFR-PRIV`
- `NFR-PERF`
- `NFR-REL`
- `NFR-SEC`
