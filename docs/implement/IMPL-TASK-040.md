---
task: TASK-040
status: done
date: 2026-08-31
author: Lecoeurdelest
---

# IMPL-TASK-040 — The forest you can actually use

## What was built

Four reported defects, fixed. The first was the serious one and it was mine twice over — once in
the code, once in how I proved the code worked.

## T1 — no light could be clicked

**Cause.** Each of the three light layers is `position: absolute; inset: 0` — a transparent sheet
the full size of the forest. `pointer-events: none` was missing, so the last one in DOM order lay
over everything and swallowed every click meant for the two beneath it. `elementFromPoint` at the
exact centre of light 0 returned `forest-lights lights-2`.

**Fixed** by taking pointer events off the layers and giving them back to the lights and rings.

**Two more things were wrong in the same place, and both had to go before a hand could land:**

A light is 11–17 px across. Every light and ring now carries an invisible `::before` of **44 px**,
so the glow stays small and the target does not.

And a light never stopped moving. `breathe` and `flicker` animated `transform: scale(…)`, so the
target grew and shrank under the pointer — the automated click refused outright (*element is not
stable*) and a person has the same problem with less patience. **The pulse now lives entirely in
opacity and the glow**, neither of which touches the hit box. That matters most for the
contradicting light, which flickered hardest and is the one a reader most needs to hit.

**Why the tests missed all of it.** They drove the UI with `element.click()`, which dispatches
straight at the node and skips hit-testing entirely. I verified a view whose entire content is
pointer targets using the one technique blind to pointer targets. The fix is proven with a real
Playwright click through coordinates, and the geometry is now asserted in `tests/forest.spec.ts`.

## T2 — travelling was cramped

Pan was a pure function of pointer position, so the picture reached its limit the moment the
pointer touched the edge of the screen. A lean, not a walk. **Travel now accumulates** across
drags, clamped to a third of the stage so no light can be lost off an edge, and the scenery is
carried further than the lights so depth survives the walk.

## T3 — clicking gave nothing back

The view swapped instantly, so the light was replaced by the book rather than becoming it. A
pressed light now **blooms** — scales out and fades over 260 ms — and the book arrives as it
finishes. `prefers-reduced-motion` skips straight through.

## T4 — the agent was invisible

The project's whole argument was happening where nobody looks. Both the forest and the reading
view now carry one line: **`Trợ lý đang cầm N công cụ — đổi theo thứ bạn đang mở`**. It is the same
string in both places on purpose, so the number is watched **changing** rather than asserted.

## Acceptance criteria

- [x] `elementFromPoint` at a light's centre returns **that light** — all four
- [x] A real pointer click opens the memory
- [x] Every light and ring has a hit target of at least 44 × 44 px
- [x] Dragging travels, and keeps travelling; releasing does not spring back
- [x] Travel is clamped so no light is lost off the edge
- [x] Pressing a light gives visible feedback before the book appears
- [x] The count changes when a memory is opened
- [x] `prefers-reduced-motion` drops the bloom and the glide
- [x] A test asserts the target through geometry, not a synthetic node click

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-040-junit.xml` — 165 passing, up from 159 |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — unchanged, no write path touched |

Hit-testing, all four lights, by coordinates:

```
data-light 0  reaches: true   memory flickering
data-light 1  reaches: true   memory out-of-reach
data-light 2  reaches: true   memory out-of-reach
data-light 3  reaches: true   memory out-of-reach
visible 11–14px · target 44px
```

`page.locator('[data-light="0"]').click()` — a real click, real coordinates — opens
`Bà ngoại · chuyển tới · 1972`. Before the fix the same call timed out.

Travel, reading `.plane-2`'s transform:

```
at rest              matrix(… 0, 0)
during first drag    matrix(… -680, -34)
after release        matrix(… -680, -34)   ← holds, does not spring back
after second drag    matrix(… -824, -68)   ← carries further, then clamps
```

The agent line, across one journey: **5 → 8 → 5**. Five in the forest, eight standing on the
contradiction, five again on returning.

Entry chunk **46.96 kB gz** — 20 bytes smaller, because the removed transforms took more CSS than
the additions.

## Deviations

**T3 is a delay, not a shared-element transition.** The light blooms for 260 ms and the book
arrives; the two are not the same element morphing. A genuine morph means measuring the light and
animating it into the cover's box, which is a real piece of work and not one to start the day
before a deadline. What ships connects the press to the arrival, which was the complaint.

**The bloom is a `setTimeout`.** If the component unmounts inside those 260 ms the timer still
fires and calls `openAt` on a stale closure. It is harmless here — `openAt` is idempotent and the
forest only unmounts by opening something — but it is a loose end, not a design.

## Known gaps

- **Travel has no keyboard equivalent.** Arrow keys move between lights, which is the reachability
  requirement, but a keyboard user cannot pan the scenery. Nothing is hidden by that today, since
  every light stays on screen at full pan.
- **Touch travel competes with page scroll.** `touch-action: pan-y` lets a vertical swipe scroll
  past the forest, so on a phone the walk is horizontal only.
- **The tool count comes from `toolsOnOffer()`**, recomputed on `ui` change. It is the same pure
  function the registry uses, but it is read at render rather than subscribed — if the tool set
  ever changed without `ui` changing, this line would lag.
- **The forest still shows no ring at first run**, so a first-time visitor never sees the target
  size fix apply to rings.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | No agent entry point; `toolsOnOffer()` reads the registry, it does not register. |
| R2 — shared write door | ☐ | No write. |
| R3 — only the command layer touches the database | ☐ | No query. |
| R4 — the registry is a pure function | ☑ | Only read from — and now displayed, which is the point. Nothing here feeds `ui`. |
| R5 — the view layer is read-only | ☑ | `travel`, `walking` and `blooming` are gesture and animation state. |

## Files changed

- `src/view/Forest.tsx`, `src/view/forestLayout.ts`
- `src/view/BookStage.tsx`
- `src/app.css`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/forest.spec.ts`
