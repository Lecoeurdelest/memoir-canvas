---
id: TASK-031
title: Backstage — one door to the machinery
branch: C
day: 5
depends_on: [TASK-024, TASK-030, TASK-033]
status: todo
---

# TASK-031 — Backstage: one door to the machinery

| | |
|---|---|
| **Branch** | C · panels/ |
| **Planned day** | Day 5 |
| **Depends on** | `TASK-024`, `TASK-030`, `TASK-033` |
| **Requirements** | [`FR-MCP`](../requirements/functional/FR-MCP-tool-surface.md), [`FR-I18N`](../requirements/functional/FR-I18N-bilingual.md), [`NFR-A11Y`](../requirements/non-functional/NFR-A11Y-accessibility.md), [`NFR-PRIV`](../requirements/non-functional/NFR-PRIV-privacy-local-first.md) |

## Goal

A family member opening this archive should see their family, and nothing else. A judge should
reach every piece of evidence for the project's thesis in one gesture.

Today they see the same screen, and it is built for the judge.

## The problem, stated precisely

Everything below is visible on first paint, above the fold, before any story:

| Where | What a family member currently reads |
|---|---|
| `Archive.tsx:43-46` | an English-only tagline, in a UI that defaults to `lang: 'vi'` |
| `Archive.tsx:47-64` | `WEBMCP — not offered by this browser`, `ARCHIVE READY IN 1894 ms`, `CLAIMS 5`, `OPEN CONFLICTS 0` |
| `Archive.tsx:84` | `Story cards`, hard-coded English |
| `Archive.tsx:91` | `Loading tools…`, hard-coded English |
| `ManualToolPanel.tsx:134` | `Tools (6)`, then six `<details>` named `add_memory_claim`, `flag_conflict`… |
| `ManualToolPanel.tsx:70-97` | form fields labelled `subject_kind`, `subject_id`, `object_place_id`, `year_precision`, each wanting a UUID typed in by hand |
| `ManualToolPanel.tsx:140-158` | a radio group headed **Acting as: the agent / a person**, defaulted to `the agent` |
| `Spread.tsx:38` | `Bà ngoại · moved_to` — a raw database column in the largest text on the page |
| `AuditTrail.tsx:99-101` | `registered_because` printed as raw English log strings even when `lang` is `'vi'` |

`WEBMCP — not offered by this browser` is the worst of these: a family member does not know what
WebMCP is, and reads "not offered" as *this is broken*.

## The tension this task must not resolve by deleting

The naive fix is to hide the machinery. **That fix loses the hackathon.** A WebMCP Challenge judge
has three minutes and must be able to see, with their own eyes:

1. the database's own refusal, verbatim: `permission denied for table conflict`
2. `resolve_claim` appearing and disappearing with what is open (`R4`)
3. the audit row for the refusal, stamped agent, marked refused
4. that the human path and the agent path are the same function (`R2`), and only the Postgres role differs
5. that there is no server — PGlite, wasm, IndexedDB
6. that the agent **can** do the useful half: find the contradiction, propose the question

If a judge cannot see those, the project's entire argument is unevidenced.

## The approach

**One drawer, two entrances**, and the second entrance is the point.

**Entrance one — passive.** A single quiet line at the foot of the page, naming the backstage.
Discoverable, never imposed.

**Entrance two — the story produces the refusal itself.** On a blocked road, between the two
competing claims, a control phrased as the question every ordinary person asks of a computer:
*ask the assistant to settle it*.

It calls the real agent handler as `app_agent`, is genuinely refused by Postgres, and renders the
refusal verbatim in place, with the constraint name beneath it and one link — *see what just
happened* — which opens Backstage at the audit row that attempt just wrote.

A family member presses a button whose meaning is obvious and gets the answer to their own
question. A judge, standing on the blocked road, is handed the whole thesis without hunting.

## In scope

- `src/panels/Backstage.tsx` — one `<dialog>`, Esc to close, focus trapped, holding the boot facts, `ManualToolPanel` and `AuditTrail` unchanged
- the two entrances above
- the actor toggle **relabelled**, not removed: the legend says which Postgres role the next call assumes, and each option names its role (`app_agent`, `app_human`) beside the plain-language name. Naming the roles on the radio buttons is the cheapest credibility win in the app — it turns a UI affectation into a visible statement about GRANTs
- `Spread.tsx` renders a readable sentence, not `subject · predicate`
- every string this task introduces or touches goes into the `TASK-033` catalogue, not into a new private `COPY` block

## Out of scope

- no change to `ManualToolPanel`'s behaviour or to any handler — it **moves**, it is not rewritten
- no change to `descriptors.ts` (frozen) or to the tool surface
- no photo import — `TASK-032`

## Acceptance criteria

- [ ] First paint shows the wordmark, one Vietnamese sentence, the road, and the station — nothing else
- [ ] No English string is shown while `lang` is `'vi'`
- [ ] No raw database identifier (`moved_to`, `subject_id`, a UUID) appears outside Backstage
- [ ] Every one of the six judge needs above is reachable within one gesture of first paint
- [ ] The ask-the-assistant control is refused by Postgres, and the refusal is shown verbatim, not paraphrased
- [ ] That refusal writes an audit row, and the link reaches it
- [ ] Backstage traps focus, closes on Esc, and returns focus to its opener (`NFR-A11Y-03`)
- [ ] The actor toggle still exists and still demonstrates the refusal (`FR-MCP`)

## Files touched

- `src/panels/Backstage.tsx` (new)
- `src/Archive.tsx`
- `src/view/Tear.tsx`
- `src/view/Spread.tsx`
- `src/panels/ManualToolPanel.tsx`
- `src/panels/AuditTrail.tsx`
- `src/app.css`
- `tests/backstage.spec.ts` (new)

## Notes

**Wording is authored in the catalogue, not here.** An earlier draft of this document specified the
Vietnamese button copy inline, which broke `code-style.md` ("English everywhere ... and
documentation") and, worse, made a task doc the de-facto string catalogue. `TASK-033` gives those
strings a home; this document describes what each control must *mean* and leaves the phrasing to
the catalogue.

`NFR-PRIV-03` bears on the wording: `confirmed_by` is **provenance, not authentication**. Backstage
must not present a named confirmer as proof of identity.

The refusal string must never be softened into "the assistant cannot do that". The verbatim
Postgres message is the evidence, and paraphrasing it is the same act the project exists to refuse.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-031`
3. Write `docs/implement/IMPL-TASK-031.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
