---
id: TASK-048
title: The forest becomes a moonlit meadow
branch: A
day: 7
depends_on: [TASK-034, TASK-040, TASK-044]
status: done
---

# TASK-048 — The forest becomes a moonlit meadow

| | |
|---|---|
| **Branch** | A · view/ |
| **Depends on** | `TASK-034`, `TASK-040`, `TASK-044` |
| **Requirements** | [`FR-BOOK-01`](../requirements/functional/FR-BOOK-book-canvas.md), [`NFR-A11Y`](../requirements/non-functional/NFR-A11Y-accessibility.md), [`NFR-PERF`](../requirements/non-functional/NFR-PERF-performance.md), [`NFR-PORT-01`](../requirements/non-functional/NFR-PORT-portability.md) |
| **Design** | Approved canvas "Rừng Ký Ức", direction C — <https://claude.ai/code/artifact/ae62fde1-895c-4f7c-acd1-4f977231c1f4> |

## Goal

Re-skin the first screen to the approved anime night-meadow: starfield and milky way, a glowing
moon in rim-lit clouds, a horizon treeline that frames the sides and opens in the middle, rolling
hills with faint moonlit crests, glowing blue flowers, and fireflies that actually fly.

The owner's approved firefly language replaces TASK-034's certainty palette **in the forest
picture only**:

| Firefly | Meaning | Action on click |
|---|---|---|
| **White** | an empty place — an open question or a silent run of years | opens the blank page to tell that memory |
| **Orange-red** `#ff9a76` | a memory whose story is in open conflict (still flickers, still darkens the wood) | opens the torn spread |
| **Green** | a memory with a story; **brighter green = longer story** | opens that spread |

Certainty does not leave the product: the story cards, badges and the book keep NIGHT_PALETTE
unchanged, and every forest light still *announces* its certainty in its accessible name. What
changes is only which question the picture answers first — "where is there a story, how much of
it, and where is it missing" instead of "how sure are we".

## In scope

- `src/view/forestArt.tsx` (new) — the painterly scenery as deterministic inline SVG
  (hash-seeded, never `Math.random`), split across the three existing parallax planes
- `src/view/FirefliesGL.tsx` (new) — a transparent three.js canvas that gives the ambient
  fireflies real motion: drift and blink on the GPU, additive glow
- `src/view/forestLayout.ts` — pure additions: story length, glow scale, the three-tone palette
- `src/view/Forest.tsx` — paint the new scenery, recolour the lights, draw gaps as white
  fireflies instead of hollow rings
- `src/app.css` — the forest section only

## Out of scope

- No change to `schema.sql`, `descriptors.ts`, commands, handlers, registry, store
- No change to NIGHT_PALETTE or any panel/book surface
- No new text anywhere in the forest (TASK-044 still holds: nothing that looks like a control)

## Decisions that need saying out loud

1. **three.js returns.** TASK-034 said "no WebGL" and TASK-035 removed r3f. The owner explicitly
   asked for three.js motion, and `.agent/context/stack.md` still lists a 3D layer as part of the
   declared stack. The compromise that keeps NFR-PORT-01 honest: the GL canvas is *decoration
   only* — `aria-hidden`, `pointer-events: none`, mounted only when `hasWebGL()` and motion is
   allowed; every interactive light stays a DOM button with its 44px target, keyboard order and
   accessible name. On context loss or absence of WebGL the CSS firefly fallback from TASK-034
   still renders, so the view degrades to exactly what shipped before.
2. **The forest keeps flinching at contradictions.** The conflicting light flickers out of time
   with everything else, and while a conflict is open the whole meadow desaturates — same wedge,
   same `jumpTarget` rule, new paint.
3. **`trees()` and the trunk planes retire.** The meadow scenery supersedes the trunk wall; the
   budget test moves to the new art (fewer blades and speckles under 700px).

## Acceptance criteria

- [x] Every spread is one light; gaps (open questions + silences) are white lights; counts match
- [x] Conflict is findable without reading: orange-red, fastest blink, meadow darkens behind it
- [x] Green brightness increases monotonically with story length, same hue family
- [x] Clicking a white light opens the blank page for that question/year (existing handlers, R5)
- [x] Keyboard, focus order, hover-only names and `prefers-reduced-motion` behave exactly as in TASK-040/044
- [x] Without WebGL the forest still renders complete and interactive (CSS fallback path)
- [x] `npm run typecheck`, `npm test`, `npm run arch:check` all green

## Files touched

- `src/view/forestArt.tsx` (new)
- `src/view/FirefliesGL.tsx` (new)
- `src/view/forestLayout.ts`
- `src/view/Forest.tsx`
- `src/app.css`
- `tests/forest.spec.ts`, `tests/forestTones.spec.ts` (new)
- `package.json` (+ `three`, `@types/three`)
