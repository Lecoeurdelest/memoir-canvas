---
task: TASK-022
status: done
date: 2026-08-30
author: Lecoeurdelest
---

# IMPL-TASK-022 — The evidence panel

## What was built

`EvidencePanel` lists the sources bearing on a claim, ordered by stance with `contradicts`
first, each carrying its source kind, title, verbatim text and contributor. It renders under each
cited claim inside a story card. The panel is read-only: it takes a claim, reads the projection,
and writes nothing.

## Acceptance criteria

- [x] A `contradicts` source appears clearly and is never hidden
- [x] `verbatim` is shown exactly, never summarised

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-022-junit.xml` — 3 cases in `tests/panels.spec.ts` |
| Browser | 12/12 in Chrome 151: the contradicting source renders first in a panel that has one, and the seeded verbatim matches character for character |
| Typecheck | `npm run typecheck` — green |

## Deviations

**The ordering rule is enforced in data, not in CSS.** `STANCE_ORDER` sorts `contradicts` above
`supports` above `mentions`, and a test asserts that array rather than a stylesheet — a CSS
`order` property would have been invisible to a screen reader and to the DOM order a test can see.

**No image viewing.** The task lists it in scope, but `source.uri` is never populated: the seed
describes a photograph without shipping one, and nothing writes a URI. Building a viewer for data
that does not exist would be scaffolding. Recorded as a gap rather than half-built.

**The panel mounts inside `StoryCard` rather than as the right-hand page of a spread.** The
spread (`TASK-016`) does not exist yet. This is where it will move; nothing about the panel
depends on the surrounding layout.

## Known gaps

- **No image rendering.** `source.uri` is unused. When `TASK-016` supplies a real photograph, this
  needs an `<img>` with an accessible name, and `NFR-PRIV-01`'s CSP already restricts `img-src` to
  `'self'` and `data:`.
- The excerpt is hidden when it is identical to the verbatim, which is the common case in the
  seed. A source whose excerpt is a genuine sub-quote has never been rendered.
- No source appears more than once per claim, but a source bearing on several claims is repeated
  in each panel with no indication it is the same artefact.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | untouched |
| R2 — shared write door | ☐ | untouched |
| R3 — only the command layer touches the database | ☑ | reads `evidence` and `sources` from the projection |
| R4 — the registry is a pure function | ☐ | untouched |
| R5 — the view layer is read-only | ☑ | takes a claim as a prop, holds no state at all, never writes |

## Files changed

- `src/panels/EvidencePanel.tsx`
- `src/panels/StoryCard.tsx` — mounts it under each cited claim
- `src/store/projection.ts` — `evidence`
- `src/app.css`
- `tests/panels.spec.ts`
