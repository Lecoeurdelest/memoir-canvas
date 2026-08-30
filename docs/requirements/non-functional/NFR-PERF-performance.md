---
id: NFR-PERF
title: Performance
type: non-functional
status: draft
---

# NFR-PERF — Performance

## Intent

Six days is not enough for deep optimisation. Set thresholds sufficient for a smooth demo and no further.

## Requirements

| ID | Requirement |
|---|---|
| `NFR-PERF-01` | First contentful frame under 2 seconds on a mid-range device. |
| `NFR-PERF-02` | PGlite (**~5.3 MB gzip, ~3.9 MB brotli, 16.8 MB raw**) lazy-loads **after** the first frame and never blocks it. No chunk containing PGlite or three.js may be a static import of the entry chunk — check after every build with `head -c 300 dist/assets/index-*.js`. The archive is expected to be unavailable for roughly 20 s (Fast 4G) to 80 s (Slow 4G) after the first frame, so the book shows a loading state, never an empty one. |
| `NFR-PERF-03` | PGlite runs **on the main thread**. A single command blocks the frame for at most one animation beat (~50 ms measured worst case), and the app runs no query while a page turn is in flight. Revisit a worker only if a real device shows visible stutter: `@electric-sql/pglite/worker` is the wrong tool (it does multi-tab leader election and multiplies per-statement latency ~6-7x); a plain dedicated module worker is the route, and it needs `commands.ts` restructured into single-round-trip SQL first. |
| `NFR-PERF-04` | Page turns hold at or above 30 fps on a mid-range device. |
| `NFR-PERF-05` | One tool call — including the projection rebuild and the `provideContext()` that follows it — completes in under 400 ms against the seeded archive on a 4x-CPU-throttled profile. `flagConflict` is the slow one and scales with the number of conflicting claims, so the seeded conflict stays at two. |
| `NFR-PERF-06` | The projection rebuilds wholesale after every write. Acceptable, because a family archive is a few hundred rows. Do not optimise this early. |

## Acceptance

The app reports its own numbers on screen — first contentful paint, PGlite boot, last tool-call
duration, rolling frame time — so they can be read off a phone with no DevTools attached.

Desktop Chrome at 4x CPU throttle on a Slow 4G profile is the **development** gate. One confirmed
reading from the ChatGPT in-app browser on a physical device is the **release** gate.

If no device reading is obtained before the deadline, say so in the submission rather than quoting
a desktop number as though it were a device number.

## Related

- `NFR-PORT-webview-portability`

## Amended 2026-08-30

- **-02** the "~3 MB gz" figure came from the vendor README and is stale for PGlite 0.5.8 /
  PostgreSQL 18.3. Measured against the real `dist/`: 5,390,649 B gzip. `initdb.wasm` is fetched
  on *every* boot, not only the first visit.
- **-03** was never true and is not worth making true this week. Measured: the `PGliteWorker`
  wrapper costs ~7x per statement, which breaks -05 outright.
- **-05** raised 300 → 400 ms and made the budget name what it actually covers.
- Acceptance was unsatisfiable as written: no tool anyone has attaches to the ChatGPT in-app
  browser. Self-reporting replaces it.

## Amended 2026-08-30 (second) — the cost of WebGL, measured

`TASK-015`/`016`/`017` assumed a WebGL scene was affordable. It was measured before being
superseded, with production Vite builds against this repo's own `node_modules`, gzip of emitted JS:

| Bundle | Total | Marginal over baseline |
|---|---|---|
| react + react-dom (baseline) | 45.6 kB gz | — |
| + `three` + `@react-three/fiber` | 263.0 kB gz | **+212.3 kB gz** |
| + drei `{Html, ScrollControls, Image, Billboard, PerspectiveCamera, AdaptiveDpr, Preload}` | 273.0 kB gz | **+222.1 kB gz** |

`three` **does not tree-shake under R3F**: `@react-three/fiber` does `import * as THREE` and
`extend(THREE)` to populate its JSX element catalogue, so 212 kB is the floor rather than the
unshaken figure. Against an entry chunk of 46.97 kB gz, a scene costs 4.7× the app.

One piece of good news, also measured: drei sets `"sideEffects": false`, and a bundle importing
named helpers from the bare barrel contained **zero** occurrences of `troika` and zero of the
jsdelivr string. Only `Text` pulls troika in (+33 kB gz, and the CDN URL with it). Deep imports are
therefore not required to stay CSP-clean — but `Text` must never be imported.

`TASK-030` ships the road in CSS perspective at **0 kB** of added JavaScript. Entry chunk after it:
145.37 kB / **46.97 kB gz** — byte-identical to before.
