---
id: TASK-033
title: Real i18n
branch: C
day: 5
depends_on: [TASK-030]
status: done
---

# TASK-033 — Real i18n

| | |
|---|---|
| **Branch** | C |
| **Planned day** | Day 5 |
| **Depends on** | `TASK-030` |
| **Blocks** | `TASK-031`, `TASK-032` |
| **Requirements** | [`FR-I18N`](../requirements/functional/FR-I18N-bilingual.md), [`NFR-A11Y`](../requirements/non-functional/NFR-A11Y-accessibility.md), [`NFR-MAINT`](../requirements/non-functional/NFR-MAINT-maintainability.md) |

## Goal

The app uses a real i18n stack — `i18next` + `react-i18next` — with translations in resource files
and one lookup, instead of seventy `{vi, en}` pairs scattered through ten components.

**Decision changed on direction.** An earlier draft of this task argued for a hand-rolled typed
catalogue and against a library. The product owner overruled it: *"Phải dùng i18n vào."* Use the
standard stack.

The objection that drove the earlier draft was `NFR-PRIV-01`, and it was checked rather than
assumed: `i18next`, `react-i18next` and `i18next-browser-languagedetector` contain **no** `fetch`,
`XMLHttpRequest` or `WebSocket` in their shipped builds. Only `i18next-http-backend` fetches, and it
is deliberately not installed. Resources are bundled, not loaded.

## Why this comes before `TASK-031`

`TASK-031` introduces a drawer, a relabelled role selector, a new control on the blocked road, and
a translation pass over every remaining hard-coded English string. That is a large batch of new
copy, and with no catalogue it would land as four or five more private `COPY` blocks — making the
existing problem measurably worse in the same commit that claims to fix the interface.

It is also, concretely, why product copy ended up written into a task document: there was nowhere
else for a string to live. A task doc is not a string catalogue.

## The distinction this task must respect

There are two different things in this repo spelled `_vi` / `_en`, and merging them would be a
real design error.

| Kind | Where it lives now | What happens |
|---|---|---|
| **Content** — `question_vi`, `title_vi`, `body_vi` | `claim`, `question`, `story_card` columns in Postgres; typed in `domain/types.ts`; validated in `mcp/handlers.ts`; declared in the frozen `mcp/descriptors.ts` | **Untouched.** This is what a person or an agent wrote about a family. It is data, it is per-row, and `code-style.md` sanctions it explicitly. It has nothing to do with interface language. |
| **Chrome** — button labels, headings, hints, stance and certainty words | ten private `COPY` / `LABELS` / `STANCE` objects under `src/view/` and `src/panels/` | **Moves into the catalogue.** |

Roughly 70 chrome pairs across ten files; 12 content fields stay where they are.

## In scope

- `src/i18n/locales/{vi,en}.json` — the translations, namespaced by area
- `src/i18n/index.ts` — `i18next` init with `initReactI18next`, resources bundled inline, `vi` as fallback
- `LanguageDetector` for `navigator.language` with `localStorage` caching (`store.ts:32` currently hard-codes `'vi'`, reads neither and remembers nothing)
- migrate the ten existing `COPY` / `LABELS` / `STANCE` blocks to `useTranslation()`, with **no wording changes** — a pure move, so any visual diff is a bug
- interpolation where a string is currently assembled by hand, e.g. the circa year in `Tear.tsx`
- the store's `lang` delegates to `i18n.changeLanguage` so there is one source of truth, not two
- a test asserting the two resource files have **identical key sets**, so a half-translated key cannot ship

## Out of scope

- **no** `i18next-http-backend` — it fetches, and `NFR-PRIV-01` forbids that. Resources are bundled
- no language files loaded at runtime, no locale split-chunks — two languages of ~70 strings is smaller than the code that would lazy-load them
- no pluralisation rules or date/number formatting beyond what the existing copy already does
- no change to `descriptors.ts` or `schema.sql` (frozen), and no change to any `*_vi` / `*_en` **data** field
- no new wording — `TASK-031` owns what the interface should say

## Acceptance criteria

- [ ] No `vi:` / `en:` literal remains under `src/view/` or `src/panels/`
- [ ] `vi.json` and `en.json` have identical key sets, asserted by a test
- [ ] No runtime network request is added — verified against the production build with the shipped CSP
- [ ] The entry chunk does not regress (`NFR-PERF-02`)
- [ ] Every `*_vi` / `*_en` **data** field is untouched, and `descriptors.ts` is byte-identical
- [ ] A missing or half-translated key fails `npm run typecheck` or `npm test`, not review
- [ ] `lang` follows the browser on a first visit and is remembered on the next, with nothing asked
- [ ] The rendered interface is unchanged in both languages — verified against the production build

## Files touched

- `src/i18n/index.ts` (new)
- `src/i18n/locales/vi.json` (new)
- `src/i18n/locales/en.json` (new)
- `src/main.tsx`
- `src/store/store.ts`
- `src/view/{Road,Spread,Tear,BookControls,BookStage,CssBook}.tsx`
- `src/panels/{AuditTrail,EvidencePanel,CertaintyBadge,StoryCard}.tsx`
- `tests/i18n.spec.ts` (new)

## Notes

`AuditTrail.tsx` needs care beyond a move: it renders `registered_because` as a raw English log
string even when `lang` is `'vi'`. That value comes from `describeUiState` in `store/uiState.ts`
and is a machine trace, not copy. Decide deliberately whether it is translated or presented as a
trace — do not translate it by accident during the migration.

`CertaintyBadge` exports `LABELS` and `PALETTE`, and `tests/certainty.spec.ts` imports both to
check glossary wording and WCAG AA contrast. Keep those exports working or update that test in the
same commit.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-033`
3. Write `docs/implement/IMPL-TASK-033.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
