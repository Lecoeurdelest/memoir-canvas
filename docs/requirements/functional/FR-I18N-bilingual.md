---
id: FR-I18N
title: Bilingual content
type: functional
status: draft
---

# FR-I18N — Bilingual content

## Intent

Product content appears in both Vietnamese and English — judges read English, the family reads Vietnamese.

## Requirements

| ID | Requirement |
|---|---|
| `FR-I18N-01` | Story cards and follow-up questions carry paired `*_vi` and `*_en` values. |
| `FR-I18N-02` | Certainty labels have fixed translations — see `.agent/context/glossary.md`. |
| `FR-I18N-03` | Switching the UI language does not require a page reload. |
| `FR-I18N-04` | Vietnamese diacritics render correctly in every font used, including the monospace face and text inside the 3D scene. |

## Acceptance

This requirement is met when every row above has at least one corresponding test, and that
test appears in some `docs/implement/evidence/TASK-*-junit.xml`.

## Related

- `docs/technical/06-book-rendering.md`
