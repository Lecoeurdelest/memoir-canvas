---
id: NFR-PORT
title: Runs inside the in-app browser
type: non-functional
status: draft
---

# NFR-PORT — Runs inside the in-app browser

## Intent

The submission must open inside the ChatGPT in-app browser. That environment is outside our control and is the single largest risk in the project.

## Requirements

| ID | Requirement |
|---|---|
| `NFR-PORT-01` | The app boots and paints its first frame — and **stays** painted — without WebGL. Verified by a headless run with `HTMLCanvasElement.getContext` returning `null` for webgl contexts. Any three.js/R3F mount sits behind a WebGL preflight and an error boundary. |
| `NFR-PORT-02` | The model-context API is reached through a feature-detecting shim (`navigator.modelContext` ?? `document.modelContext`). Both the whole-set (`provideContext`) and per-tool (`registerTool`/`unregisterTool`) paths must produce **identical** registered sets across successive calls, proven by a unit test asserting that a tool dropped from the set is actually gone. |
| `NFR-PORT-03` | No feature requires cross-origin isolation. Persistence is IndexedDB, not OPFS SyncAccessHandle. |
| `NFR-PORT-04` | The app **always** shows the manual tool panel; when `modelContext` is present the same tools are additionally provided to the agent. The panel renders every tool in `DESCRIPTORS` from its `inputSchema` and displays refusals verbatim. This is the primary interaction surface, not insurance. |
| `NFR-PORT-05` | When WebGL is absent or fails, the app falls back to a non-WebGL book view: the same DOM story cards in a flat spread with prev/next navigation and a textual conflict marker. A faithful CSS 3D twin (perspective/rotateY, animated tear) is explicitly **out of scope** for the submission. Thanks to R5 the three layers below are untouched either way. |
| `NFR-PORT-06a` | Confirmed in a real WKWebView (WebKit) and in Chromium by an automated harness, on every day the app is worked on. |
| `NFR-PORT-06b` | Confirmed by hand in the ChatGPT in-app browser on at least one physical device, recording user-agent, `modelContext` presence, and PGlite boot time. iOS **and** Android only if two devices are available. Before any 3D or panel work lands, and re-checked after each deploy. |

## Acceptance

Opens and runs the full demo core inside the ChatGPT in-app browser on at least one physical
device. Two platforms if two devices exist; if only one is available, the submission says which
one was tested and which was not.

## Related

- `docs/task/TASK-006-model-context-shim.md`
- `docs/task/TASK-027-webview-conformance.md`

## Amended 2026-08-30

Measured this day, which changes what is worth requiring:

- PGlite 18.3 boots on IndexedDB **in a real WKWebView in 1,396 ms** with no cross-origin
  isolation. The storage half of this risk is retired; **-03** now holds on evidence.
- `navigator.modelContext` and `document.modelContext` are absent in **both** Chrome 151 and
  WebKit. Absent is the default, not the exception — hence the reversal in **-04**.
- **-05** a CSS twin of book + page-turn + tear/heal is 1.5-2 days on a branch already carrying
  seven tasks. The narrow DOM fallback is ~92 lines and was built and measured. Scope cut to the
  version that can exist.
- **-06** "day one" has passed with zero commits, and half the requirement never needed a phone.
  Split so the automatable half can be enforced today.

## Amended 2026-08-30 (second) — -01 now holds by construction

`NFR-PORT-01` required the app to paint and stay painted with WebGL unavailable. Until `TASK-030`
that meant maintaining a fallback and trusting it. The road uses no WebGL at all, so there is no
GL context to lose, nothing to preflight before the first frame, and no second code path to keep
in sync — `useSpreadNavigation` is the only navigation truth and both skins consume it.

Verified rather than asserted, Chrome launched with `--disable-3d-apis` against the production
build with the shipped headers:

| Check | Result |
|---|---|
| `canvas.getContext('webgl')` / `('webgl2')` | `null` / `null` |
| Canvas elements in the document | **0** |
| Road painted | yes — `perspective: 720px` |
| Travel | world transform → `translateZ(260px)`, station advances |
| Page errors | 0 |

A second consequence worth recording: `webglcontextlost` — which mobile browsers fire when a tab is
backgrounded, and which was the largest retention risk for an in-app webview — cannot occur.

The physical-device check (`TASK-027`) is still outstanding and is the one thing that cannot be
verified from a development machine.
