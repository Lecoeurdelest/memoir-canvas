---
task: TASK-034
status: done
date: 2026-08-31
author: Lecoeurdelest
---

# IMPL-TASK-034 — The firefly forest

## What was built

The archive now opens as a forest at night with one firefly per memory, coloured from a dark
certainty palette that was measured against the forest ground before a line of it was written.
Three CSS planes of trunks and ambient fireflies slide against the pointer at 340 / 820 / 1500 px
per sweep; the memory lights ride three further layers at a twentieth of that, for a reason the
first build made obvious. Clicking a light opens that memory; clicking one the wedge has put out
of reach does nothing, because the forest calls the same `jumpTarget` the turn control and the
spine already call. All of the placement is a pure module (`forestLayout.ts`) so the repo's
DOM-less test environment can assert on it, and every position is a hash of the spread key rather
than `Math.random`, so the forest is a map of the archive instead of a new picture each render.

The one change nobody asked for is the most important: `useSpreadNavigation` gained `open`, and
while the forest is showing the UI state says `archive`. See Deviations.

## Acceptance criteria

- [x] Every spread in the read model is one light; the count matches
- [x] Certainty is legible from colour alone at a glance, and the conflicting one is findable without reading
- [x] Pointer travel moves the layers at visibly different rates
- [x] Clicking a light sets `uiState` and opens that spread — the `R4` contract is unchanged
- [x] Keyboard: the lights are reachable and named; arrow keys move between them
- [x] `prefers-reduced-motion` stops all blinking and drifting, and the lights stay legible
- [x] The light count is reduced on narrow viewports
- [x] No runtime network request; entry chunk does not regress

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-034-junit.xml` — 92 passing, up from 68 |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — N/A, no schema or command change |

Measured in Chrome at 1440×900 and 390×844, against a real archive with the disagreement flagged
through the tool panel:

| What | Reading |
|---|---|
| Scenery planes on a full sweep | −130 px / −314 px / −575 px |
| Light layers on the same sweep | −17 px / −34 px / −58 px |
| Ambient fireflies, 1440 → 390 | 108 → 24 |
| Trunks, 1440 → 390 | 60 → 33 |
| Glow layers at 390 | 1 (`rgba(255,154,118,.55) 0 0 6px 2px`, single shadow) |
| Entry chunk | 145.37 kB / **46.97 kB gz** — identical to the figure `IMPL-TASK-030` recorded |
| Off-origin requests | none |

Dark palette against `NIGHT` (`#071319`), asserted in `tests/certainty.spec.ts`:
uncertain 8.61, oral 12.59, document_supported 11.52, conflicting 9.08, confirmed 13.31, unlit
ring 13.32. All clear WCAG AA; all five stay distinct in greyscale.

The wedge, read back out of the live DOM after `flag_conflict`:

```
0  memory flickering   Bà ngoại · moved_to · 1972 · Conflicting
1  memory out-of-reach Bà ngoại · opened_business · 1976 · … · out of reach, something ahead does not add up
2  memory out-of-reach Mẹ · born_in · 1981 · …
3  memory out-of-reach Cậu Ba · moved_to · 1995 · …
```

Clicking light 3 in that state left the reader in the forest and opened nothing.

## Deviations

**The task's file list did not include `useSpreadNavigation.ts` or `projection.ts`. Both were
changed, and the first one had to be.**

Until now every renderer showed a spread at all times, so "where the reader is" and "what is on
screen" were the same thing. The forest breaks that: a reader standing in the forest has nothing
open. Left alone, the `setUi` effect would have kept reporting `{ view: 'person', personId: … }`
for whichever spread the index happened to sit on — and `registry.ts` hands `flag_conflict` to any
`person` view whose subject has a disagreement. The agent would have been holding a tool for a
page nobody had opened. That is not a cosmetic mismatch; it is the project's one sentence coming
apart, so `open` went into the navigation truth rather than into `BookStage`, where it would have
split the truth in two.

Confirmed in the browser: **5 tools in the forest, 6 once a light is opened**, `flag_conflict`
appearing exactly on the transition, and `resolve_claim` still nowhere until a human opens the
conflict.

`projection.ts` gained one `SELECT` over `followup_question`. `FR-BOOK-01` promises "an unlit ring
marks a gap the family has not filled", and an open follow-up question is the only thing in this
schema that literally is one. It also earns the demo its best beat: the agent cannot settle the
year, so it proposes a question — and a new ring appears in the forest, beside the very memory it
doubts. Read path only, no new write, R3 untouched.

**Two things were built the wrong way first and are recorded rather than quietly fixed.**

*The lights were on the scenery planes.* Those planes are 240–290 % wide at `left: -70%`, so a
light at 9 % of a plane renders far off the left edge of the stage. Three of the four seeded
memories were invisible, and the near plane's 750 px half-sweep would have carried the survivors
off screen anyway. Scenery may leave the picture; a target may not. Hence `LIGHT_PLANES`, at
roughly an eighth of the scenery rate, on layers sized exactly to the stage.

*The hash had no finalizer.* Plain FNV-1a over keys differing only in their last characters —
`ambient-11:x` against `ambient-11:y` — leaves the two values correlated, and the fireflies came
out in a visible diagonal streak. A murmur3 avalanche step fixed it.

Two smaller ones, both caught by looking: the floor gradient is a `::after` on the stage and was
painting over the invite text until the chrome got a `z-index`; and the trunks, drawn *lighter*
than the ground, turned the forest into a barcode of pale vertical bars. They are silhouettes now,
and the background carries a wide, weak lift so they have something to be a silhouette against.

## Known gaps

- **The book behind the forest is still the road.** `TASK-035` replaces it. Until then the way out
  is `Escape` or a visible "back to the forest" button, which `FR-BOOK-08` forbids — the button is
  temporary and `TASK-035` removes it along with `BookControls`.
- **A ring is not clickable.** `FR-BOOK-01` and the product owner both want an empty ring to open a
  box for someone to tell the missing story. That is a write, explicitly out of scope here, and it
  has nowhere to live until the shell exists (`TASK-031`).
- **Nothing seeds an open question**, so a first-run forest shows zero rings. That is deliberate —
  the ring appearing mid-demo is worth more than one sitting there at boot — but it does mean the
  ring treatment is unseen unless the demo is run through.
- **`prefers-reduced-motion` is belt-and-braces.** `app.css` already carries a global
  `* { animation: none !important }`, so the forest's own reduced-motion block only fixes the
  resting opacities. Verified from the live stylesheet, not from the source.
- The invite line was rewritten mid-task: it told a phone user to move their mouse.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | No new agent entry point. |
| R2 — shared write door | ☐ | The forest performs no write of any kind. |
| R3 — only the command layer touches the database | ☑ | `projection.ts` gained a `SELECT` and nothing else; the view still reads only the read model. |
| R4 — the registry is a pure function | ☑ | Strengthened. The UI state now matches what is on screen, so the registry's input stopped lying about which page the reader has open. |
| R5 — the view layer is read-only | ☑ | `Forest.tsx` reads the projection and writes nothing but UI state; all placement is pure and lives outside the component. |

`npm run arch:check` passes, and a review against `.agent/rules/invariants.md` confirmed all five
by hand.

**Worth knowing for the next person: the script could not have caught the two rules this task
actually leans on.** `check-invariants.sh` tests R4 by grepping for stray `provideContext(`
call-sites, which says nothing about whether a component reports the *wrong* `UiState` — and that
is precisely the bug `open` exists to prevent. There is no R5 rule in the script at all. So the
guarantee here rests on tracing `useSpreadNavigation.ts:79` against `toolNamesFor` in
`registry.ts:29-42`, and on checking by hand that `at`, `open`, `width` and `pointer` are all
navigation or viewport state rather than domain facts. A green `arch:check` on this diff is not
evidence that R4 and R5 survived it.

## Files changed

- `src/view/Forest.tsx` (new)
- `src/view/forestLayout.ts` (new — named for the case-insensitive filesystem, which will not hold
  `Forest.tsx` and `forest.ts` at once)
- `src/view/BookStage.tsx`
- `src/view/useSpreadNavigation.ts`
- `src/store/projection.ts`
- `src/panels/CertaintyBadge.tsx`
- `src/app.css`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/forest.spec.ts` (new)
- `tests/certainty.spec.ts`
