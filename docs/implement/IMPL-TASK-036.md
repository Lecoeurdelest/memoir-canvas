---
task: TASK-036
status: done
date: 2026-08-31
author: Lecoeurdelest
---

# IMPL-TASK-036 — The page that will not turn

## What was built

An open conflict now renders `RefusedPage`: the two competing claims facing each other across a
jagged lacquer tear drawn down the gutter, headed *"Trang này không lật được"*. Dragging forward
lifts the leaf and springs it back — the book physically refuses — and the fore-edge behind it
stays locked.

Settling it became **putting your name to it**. The `<select>` and the pair of Confirm buttons are
gone. The people who may decide are chips; picking one arms both years, and the name is then
dropped or pressed onto the year that person stands behind. Nothing is a target until a name is in
hand, which is what teaches the gesture without a sentence (`FR-BOOK-08`).

`Tear.tsx` kept only the healing. It is now nine lines, and what remains is the half that is
easiest to forget: a settled conflict shows **who settled it**, because without the name this is a
green tick, and a green tick is precisely what this project argues against.

## Acceptance criteria

- [x] The refusal appears if and only if a conflict is open
- [x] Dragging forward lifts the page and returns it; the reader cannot pass
- [x] Neither competing claim is visually favoured
- [x] Dropping a name on a year calls `commands.resolveClaim` as `'human'`
- [x] An agent reaching the same function is still refused by Postgres, verbatim
- [x] Keyboard reaches the same outcome without a pointer
- [x] `tests/core-loop.spec.ts` — the DAY 4 GATE — passes untouched

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-036-junit.xml` — 112 passing, up from 105 |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — **12/12 behaving as designed** |

`tests/refusal.spec.ts` pins what the page depends on, at the layer the page actually calls:

- the refusal does not exist until a conflict is flagged, appears on that spread and no other, and
  is gone the moment a person settles it
- while it is open, **no claim carries a confirmation and the conflict has no winner** — so the
  layout cannot favour one however even the grid is
- the agent is rejected at `resolveClaim` and the conflict survives, **and the refusal is still
  written to the audit**
- a person succeeds, and the winning claim comes back `confirmed` with `confirmed_by` set
- `refused.putNameOn` carries both `{{name}}` and `{{year}}` in both languages — that string is
  what a screen reader hears in place of watching a name land on a year

Driven in Chrome against a real archive, in Vietnamese:

| Step | Result |
|---|---|
| Conflict open, no name chosen | both year buttons disabled, labelled `Chọn tên một người trước` |
| Press `Cậu Ba` | `aria-pressed="true"`; both years arm, labelled `Đặt tên Cậu Ba vào năm khoảng 1972` / `… vào năm 1974` |
| Press the 1974 year | `✓ Vết rách đã lành · Người xác nhận: Cậu Ba`; refusal removed; all four fore-edge tabs unlock |
| Full forward drag while open | leaf to `rotateY(168deg)`, `book-body refusing`, spread unchanged |

Entry chunk **145.37 kB / 46.97 kB gz** — unchanged for the fifth task running.

## Deviations

**The competing claims are rendered by `EvidencePanel`, not by a bespoke card.** The first build
put a big serif year and a `CertaintyBadge` above it — and `EvidencePanel` already heads itself
with the claim's year and certainty, so the page printed both **twice**. Promoting its heading with
CSS instead means the claim header has exactly one source, and the evidence beneath it is the same
component a normal spread uses.

**Settling is click-then-click first, drag second.** The task asked for dragging a name onto a
year. Drag is implemented and works, but the primary route is press-a-name-then-press-a-year, for
a reason worth stating: a drag-and-drop with no precedent and no instruction copy is undiscoverable,
and `FR-BOOK-08` forbids the caption that would rescue it. Arming is visible — both pages change
colour and the buttons fill — so the gesture teaches itself. It is also the only route a keyboard
has, and building the keyboard route as the *primary* one rather than the fallback is what made the
criterion honest instead of grudging.

**A new `tests/refusal.spec.ts` rather than edits to `core-loop.spec.ts`.** The task said the gate
must not need changing; it did not, and a separate file keeps that provable at a glance.

## Known gaps

- **The lifted leaf does not tear.** The refusal shows as the leaf springing back plus the drawn
  tear in the gutter of the page beneath. The leaf itself is intact paper; a leaf that ripped as it
  lifted would be the stronger image and is not built.
- **`Bà ngoại` is offered as a decider.** The filter is `created_by === 'human'`, which is the rule
  the database enforces — but it means the subject of the memory can sign for herself. That may be
  perfectly right for a family archive; it is not a considered decision, it is a consequence.
- **Drag-and-drop has no touch fallback.** HTML5 drag events do not fire on touch. On a phone the
  press-then-press route is the only one — which works, and is why it is the primary route, but the
  drag is desktop-only and nothing says so.
- **The tear is drawn with repeating gradients**, so its zigzag is regular. A real tear is not.
- **Only two claims fit comfortably.** `.facing` is a two-column grid; a third competing claim
  would wrap and the "facing each other across the tear" image would break. The schema allows more.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | No agent entry point involved. |
| R2 — shared write door | ☑ | `RefusedPage` calls `commands.resolveClaim`, the identical function `resolve_claim` calls. No private path was added for the UI — that shared door is the demonstration. |
| R3 — only the command layer touches the database | ☐ | No SQL and no `db` import in the view. |
| R4 — the registry is a pure function | ☐ | Untouched. |
| R5 — the view layer is read-only | ☑ | Reads the projection; the only write is through `commands.*`. `holding` / `over` / `busy` are gesture state, not domain state. |

`npm run arch:check` passes; `npm run db:verify` reports 12/12.

## Files changed

- `src/view/RefusedPage.tsx` (new)
- `src/view/Tear.tsx` (reduced to the healing)
- `src/view/Volume.tsx`, `src/view/CssBook.tsx` (route a torn spread to the refusal)
- `src/app.css`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/refusal.spec.ts` (new)
