---
task: TASK-033
status: done
date: 2026-08-31
author: Lecoeurdelest
---

# IMPL-TASK-033 — Real i18n

## What was built

The app now uses `i18next` + `react-i18next`, with translations in `src/i18n/locales/{vi,en}.json`
and browser detection cached to `localStorage`. Seventy interface strings moved out of ten private
`COPY` / `LABELS` / `STANCE` blocks into the resource files; components call `useTranslation()`.

Two places now use the library rather than imitate it: the circa year is interpolated
(`evidence.circa`) instead of concatenated by hand in three separate files, and the claim count in
`StoryCard` uses real plural rules instead of a hand-written `[one, many]` tuple — which also means
Vietnamese stops carrying a plural form it does not have.

`vi` is the fallback, not `en`: this is a Vietnamese family's archive and English is the
translation, so a missing key should surface in the language the judges read.

## Acceptance criteria

- [x] No `vi:` / `en:` literal remains under `src/view/` or `src/panels/`
- [x] Every `*_vi` / `*_en` **data** field is untouched, and `descriptors.ts` is byte-identical
- [x] A missing or half-translated key fails the suite, not review
- [x] `lang` follows the browser on a first visit and is remembered on the next, with nothing asked
- [x] `vi.json` and `en.json` have identical key sets, asserted by a test
- [x] No runtime network request is added
- [x] The entry chunk does not regress

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-033-junit.xml` — 68 passing, 10 files |
| Typecheck | `npm run typecheck` — green |
| Invariants | `npm run arch:check` — 5/5 |
| Constraints | `npm run db:verify` — 12/12 |
| Browser | `docs/implement/evidence/road/7-i18n-vi.png`, `8-i18n-en.png` |

### Measured in Chrome, production build, shipped CSP

| Check | Result |
|---|---|
| Vietnamese browser, fresh profile | `Đi tiếp →` · `Các mốc thời gian` |
| Toggle to English | `Onward →` · `Milestones` |
| `localStorage['memoir:lang']` | `en` |
| After a reload | still English — the choice is remembered |
| English browser, fresh profile | `Onward →` — detected, not defaulted |
| `document.documentElement.lang` | follows the active language |
| Page errors / CSP violations / **external requests** | **0 / 0 / 0** |

### Bundle

| Chunk | Before | After |
|---|---|---|
| Entry `index-*.js` | 145.37 kB / **46.97 kB gz** | 145.37 kB / **46.97 kB gz** |
| Lazy `commands-*.js` | 565.26 kB / 140.40 kB gz | 631.96 kB / 160.25 kB gz |

`grep -c i18next` against the entry chunk returns **0**. The whole stack lands in the lazy chunk
that already carries PGlite, so `NFR-PERF-02` is untouched and the cost sits beside a 5 MB wasm
database rather than in front of the first frame.

## Deviations

**The library was chosen against this task's own first draft.** That draft argued for a hand-rolled
typed catalogue and against a dependency. The product owner overruled it — *"Phải dùng i18n vào"* —
and the task doc was rewritten before any code was written. The privacy objection behind the first
draft was checked rather than assumed: none of `i18next`, `react-i18next` or
`i18next-browser-languagedetector` contains `fetch`, `XMLHttpRequest` or `WebSocket` in its shipped
build. `i18next-http-backend` does, and is deliberately not installed.

**`tests/panels.spec.ts` was rewritten, not just repaired.** Four of its tests asserted on component
*source text* via `?raw`, looking for `read_memory_graph: {`. Those strings are in JSON now. Rather
than delete the tests, they now assert against `resources` — which is stricter, because it checks
the value that actually renders instead of the shape of the file it used to live in. The intent
("every tool has a readable sentence, in both languages, never its own name") is unchanged and now
also asserts that both languages phrase the *same* set of operations.

**Three strings in `main.tsx` were deliberately left in English:** the boot heading and the two
failure screens. Translating them means importing i18next into the entry chunk — roughly +16 kB gz
on a 47 kB gz budget — to translate text that only appears when the app is broken. Recorded as a
gap rather than done quietly.

**A probe bug, not a code bug, cost one debugging round.** The first browser probe reported that a
Vietnamese browser saw English. It had overridden only `navigator.language`; the detector reads
`navigator.languages` first. The app was correct throughout. Noted because the instinct on seeing a
red probe is to change the code.

## Known gaps

- **`main.tsx` boot and failure strings are English-only.** See above.
- **`Archive.tsx` still holds untranslated English** — the tagline, the four boot labels, the "Story cards" heading, the "Loading tools…" fallback. Those belong to `TASK-031`, which now has a catalogue to put them in.
- **`ManualToolPanel` is entirely English.** Deliberate: it renders raw tool names and `inputSchema` field names, which are identifiers, not copy. `TASK-031` moves it into Backstage where an English developer surface is defensible.
- **`AuditTrail` still renders `registered_because` as a raw English log string.** It comes from `describeUiState` and is a machine trace, not copy. Flagged in `TASK-033`'s notes and left for a deliberate decision rather than translated by reflex during a mechanical move.
- **No pluralisation beyond `card.claim`**, and no date/number formatting through i18next — `AuditTrail` still calls `toLocaleTimeString` with a locale derived from `lang`, which is correct and cheaper.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | Not touched. |
| R2 — shared write door | ☐ | Not touched; no command or handler changed. |
| R3 — only the command layer touches the database | ☐ | `src/i18n/` imports nothing from `domain/`; `arch:check` green. |
| R4 — the registry is a pure function | ☐ | Language is not part of `UiState` and does not reach `toolNamesFor`. |
| R5 — the view layer is read-only | ☑ | Components read `t()` and the store; `setLang` delegates to `i18n.changeLanguage`, and the store follows via a `languageChanged` subscription rather than holding a second truth. |

## Files changed

- `src/i18n/index.ts` (new)
- `src/i18n/locales/vi.json` (new)
- `src/i18n/locales/en.json` (new)
- `src/store/store.ts`
- `src/Archive.tsx`
- `src/view/{Road,CssBook,BookStage,BookControls,Spread,Tear}.tsx`
- `src/panels/{AuditTrail,EvidencePanel,CertaintyBadge,StoryCard}.tsx`
- `tests/i18n.spec.ts` (new)
- `tests/panels.spec.ts`
- `package.json`
