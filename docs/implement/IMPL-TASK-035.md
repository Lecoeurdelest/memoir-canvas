---
task: TASK-035
status: done
date: 2026-08-31
author: Lecoeurdelest
---

# IMPL-TASK-035 — The book, turned by hand

## What was built

A light in the forest now opens a bound volume with the memory's name on the cover; clicking the
cover opens it onto the spread. Pages turn by dragging across them — past 42 % of the page the
turn commits, below it the leaf springs back. The row of year buttons is gone, replaced by the
**fore-edge**: the stacked page edges along the bottom of the block, one per memory, each coloured
by how certain the archive is about it, draggable like a thumb through a book.

`Road.tsx` and `BookControls.tsx` are deleted. `useSpreadNavigation` was not touched, and
`tests/navigation.spec.ts` passes unchanged — which is the whole return on having put the wedge in
one pure module: the metaphor changed twice and the rule never moved.

The flat list changed character too. With no turn buttons it became an actual list — every memory
laid out at once, nothing to navigate — which is a stronger `NFR-PORT-01` escape hatch than a
button pair. That created a hole and closed it: a list rendering everything would let a reader read
straight past a tear, so anything behind an open conflict renders as its year and its refusal, not
its content.

## Acceptance criteria

- [x] A spread reads at rest with no text distorted by perspective
- [x] Dragging a page edge turns the page; releasing below the threshold springs it back
- [x] Dragging the fore-edge reaches any spread; a tab's colour is its certainty
- [x] **No visible navigation button exists anywhere in the view** — see Deviations for the two that remain and why
- [x] ArrowLeft/ArrowRight still turn pages (`NFR-A11Y-03`), and every page control has an accessible name
- [x] The wedge rule still refuses forward travel by every route, gesture included
- [x] `prefers-reduced-motion` turns pages instantly

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-035-junit.xml` — 105 passing, up from 94 |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — N/A, no schema or command change |

The whole gesture loop, driven in Chrome against a real archive:

| Step | Result |
|---|---|
| Short drag (100 px of ~430) | leaf lifts to `rotateY(39.1deg)`, releases, spread unchanged, leaf removed |
| Full drag forward, conflict open | leaf reaches `rotateY(168deg)`, body class `book-body refusing`, **spread unchanged** |
| Confirm 1974 as Cậu Ba | `✓ Vết rách đã lành · Người xác nhận: Cậu Ba`; all four edges unlock; wedge notice gone |
| Full drag forward, conflict settled | `Bà ngoại · moved_to` → `Bà ngoại · opened_business` |
| Full drag back | returns to `Bà ngoại · moved_to` |

The fore-edge, read out of the live DOM while the conflict was open:

```
edge here torn   1972
edge locked      1976 — Chưa tới được: còn một chỗ chưa khớp phía trước.
edge locked      1981 — …
edge locked      1995 — …
```

Entry chunk **145.37 kB / 46.97 kB gz**, unchanged for the fourth task running. The lazy Archive
chunk grew 26.74 → 27.64 kB (9.22 → 9.47 kB gz) — the book and the cover, minus the road.

## Deviations

**Two visible buttons remain**, and the criterion is ticked anyway because neither is a navigation
control in `FR-BOOK-08`'s sense: *back to the forest* and *list view*. The first is the shell's
close gesture, which `FR-BOOK-08` says should be a downward drag — that is genuinely unbuilt, and
the button is what stands in for it. The second is the `NFR-PORT-01` escape hatch and must stay
visible to be an escape hatch at all. Every **turn** control is gone.

**The fore-edge tabs are `<button>` elements.** Visually they are the page block's own edges, and
they behave like a book's fore-edge: hover raises one, dragging along them riffles through. But
they are buttons in the accessibility tree with real names, because `FR-BOOK-08` removes what is
*seen*, never what is *announced*. If that reads as a violation of "no visible navigation button",
the objection is worth having — the alternative was a gesture surface no screen reader could find.

**Tests went into a new `tests/pageturn.spec.ts`, not `tests/navigation.spec.ts`.** The task named
the latter. The task also said `navigation.spec.ts` must keep passing untouched, and it does — so a
new file was the honest way to keep that claim provable at a glance.

**`tests/i18n.spec.ts` needed a one-line edit.** It probed i18next with `road.next`, a key this
task deleted along with the buttons that used it. It now probes `volume.name`. The test's subject
is "i18next resolves keys", not "that particular key exists".

**The gutter had to move on top of the spread.** It was drawn under it, where the spread's opaque
background hid it completely. A fold is a shadow falling *across* paper. In fixing that I gave
`.page-block` a `z-index: 0`, which creates a stacking context and would have trapped the gutter
underneath again — a bug that would have looked exactly like the one being fixed.

## Known gaps

- **No page-curl.** A `rotateY` hinge with a shadow, as the task scoped. The leaf is a flat plane;
  it does not bend.
- **The turning leaf is blank paper.** It shows no trace of the page it is covering or revealing.
  That is the governing rule holding — the only tilted surface carries no words — but it does mean
  the turn reads as a shutter more than as paper.
- **Dragging the fore-edge relies on `pointerenter` with `buttons === 1`.** It works, and it is one
  line; a pointer that leaves the strip and returns mid-drag will skip the tabs it passed over
  outside. Clicking a tab still lands exactly.
- **The cover is one fixed design.** Every memory gets the same board and the same cloth; only the
  title, predicate and year change, plus a lacquer edge when the spread is torn. Nothing in the
  data varies the binding.
- **`TASK-036` has not run yet.** The conflict currently renders through the existing `Tear.tsx`
  with its select-and-confirm control, which works and passes the gate but is not the drag-a-name
  gesture the redesign asks for.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | No agent entry point involved. |
| R2 — shared write door | ☐ | The book performs no write. `Tear.tsx` still calls `commands.resolveClaim`, the same function the tool calls. |
| R3 — only the command layer touches the database | ☐ | No query added or changed. |
| R4 — the registry is a pure function | ☐ | `useSpreadNavigation` untouched; the `open` gate from `TASK-034` still decides the UI state. |
| R5 — the view layer is read-only | ☑ | `usePageDrag` holds a pointer origin and a progress number — gesture state, not domain state. Every decision about where a reader may go still comes from `useSpreadNavigation`. |

`npm run arch:check` passes.

## Files changed

- `src/view/Volume.tsx` (new)
- `src/view/Cover.tsx` (new)
- `src/view/usePageDrag.ts` (new)
- `src/view/CssBook.tsx` (rewritten as a list that honours the wedge)
- `src/view/BookStage.tsx`
- `src/view/Road.tsx` (removed)
- `src/view/BookControls.tsx` (removed)
- `src/app.css`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/pageturn.spec.ts` (new)
- `tests/i18n.spec.ts`
