---
id: NFR-REL
title: Reliability
type: non-functional
status: draft
---

# NFR-REL — Reliability

## Intent

There is one shot at recording the demo before the deadline. The app must not crash.

## Requirements

| ID | Requirement |
|---|---|
| `NFR-REL-01` | A failing tool call returns a structured error to the agent; it does not crash the app. |
| `NFR-REL-02` | A failing write rolls back cleanly. No half-written state. |
| `NFR-REL-03` | If IndexedDB is unavailable (private browsing) the app runs in memory and says so. |
| `NFR-REL-04` | If PGlite fails to load, show a clear error, never a white screen. |
| `NFR-REL-05` | Reloading the page preserves everything already written. |

## Acceptance

Run the demo core ten times in a row, reloading between runs, with no failures.

## Related

- `NFR-PORT-webview-portability`
