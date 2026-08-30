---
id: TASK-033
title: One string catalogue
branch: C
day: 5
depends_on: [TASK-030]
status: todo
---

# TASK-033 — One string catalogue

| | |
|---|---|
| **Branch** | C |
| **Planned day** | Day 5 |
| **Depends on** | `TASK-030` |
| **Blocks** | `TASK-031`, `TASK-032` |
| **Requirements** | [`FR-I18N`](../requirements/functional/FR-I18N-bilingual.md), [`NFR-A11Y`](../requirements/non-functional/NFR-A11Y-accessibility.md), [`NFR-MAINT`](../requirements/non-functional/NFR-MAINT-maintainability.md) |

## Goal

Every interface string lives in one catalogue with one lookup, instead of seventy pairs scattered
through ten components.

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

- `src/i18n/copy.ts` — the catalogue, grouped by area, typed so a missing key is a compile error
- `src/i18n/index.ts` — a `useCopy()` hook reading `lang` from the store, and a plain `t()` for non-React callers
- migrate the ten existing `COPY` / `LABELS` / `STANCE` blocks, with **no wording changes** — a pure move, so any visual diff is a bug
- `lang` initialises from `navigator.language` and persists to `localStorage` (`store.ts:32` currently hard-codes `'vi'`)
- a test asserting every key resolves in both languages, so a half-translated key cannot ship

## Out of scope

- **no** third-party i18n library — this is two languages and one JSON-shaped object; a runtime dependency would cost more than it saves and `NFR-PRIV-01` forbids anything that fetches
- no pluralisation or date/number formatting engine — nothing in this app needs one
- no change to `descriptors.ts` or `schema.sql` (frozen), and no change to any `*_vi` / `*_en` **data** field
- no new wording — `TASK-031` owns what the interface should say

## Acceptance criteria

- [ ] No `vi:` / `en:` literal remains under `src/view/` or `src/panels/`
- [ ] Every `*_vi` / `*_en` **data** field is untouched, and `descriptors.ts` is byte-identical
- [ ] A missing or half-translated key fails `npm run typecheck` or `npm test`, not review
- [ ] `lang` follows the browser on a first visit and is remembered on the next, with nothing asked
- [ ] The rendered interface is unchanged in both languages — verified against the production build

## Files touched

- `src/i18n/copy.ts` (new)
- `src/i18n/index.ts` (new)
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
