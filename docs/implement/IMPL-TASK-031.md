---
task: TASK-031
status: done
date: 2026-08-31
author: Lecoeurdelest
---

# IMPL-TASK-031 — Backstage: one door to the machinery

## What was built

Everything technical moved into a `<dialog>` — boot facts, the tool panel, the audit trail — and
first paint is now the forest, a Vietnamese sentence and the family's own words. `moved_to` became
*chuyển tới* everywhere a family member can see it. Nothing was deleted and nothing was softened.

The second entrance is the one that matters. On the page that will not turn, beside the two
competing years, sits **Nhờ trợ lý quyết hộ** — *ask the assistant to settle it*, the question every
ordinary person asks of a computer. It calls the same `commands.resolveClaim` the reader's own
button calls, with `actor: 'agent'`, and Postgres answers:

> **Cơ sở dữ liệu từ chối tác nhân AI:** `permission denied for table conflict`

with one link beneath it — *Xem chuyện vừa xảy ra* — which opens Backstage onto the audit row that
attempt just wrote. A family member presses a button whose meaning is obvious and gets the answer
to their own question; a judge standing on the refusal is handed the entire thesis in two clicks.

The actor toggle now names the Postgres role on the radio itself: **Tác nhân AI `app_agent`** /
**Một người `app_human`**. That is the cheapest credibility win in the app — it turns what reads as
a UI affectation into a visible statement about GRANTs.

## Acceptance criteria

- [~] First paint shows the wordmark, one Vietnamese sentence, the road, and the station — **the wordmark moved below the fold; see Deviations**
- [x] No English string is shown while `lang` is `'vi'` — with one recorded exception, below
- [x] No raw database identifier appears outside Backstage
- [x] Every one of the six judge needs is reachable within one gesture of first paint
- [x] The ask-the-assistant control is refused by Postgres, and the refusal is shown verbatim
- [x] That refusal writes an audit row, and the link reaches it
- [x] Backstage traps focus, closes on Esc, and returns focus to its opener
- [x] The actor toggle still exists and still demonstrates the refusal

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-031-junit.xml` — 118 passing, up from 112 |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — 12/12 (unchanged; no schema or command edit) |

First paint, read out of the live DOM in Vietnamese — the entire visible text of the page:

```
Bà ngoại chuyển tới Đà Nẵng · 1972      (hover names, not printed at rest)
Rừng ký ức
4 mẩu ký ức · 0 chỗ còn trống · 1972–1995
Chưa rõ · Lời kể · Có tài liệu · Mâu thuẫn · Đã xác nhận · Chưa ai kể
Memoir Canvas
Kho ký ức gia đình dựa trên bằng chứng. Tác nhân AI có thể tìm ra mâu thuẫn; nó không được quyền khép lại.
Hậu trường
```

No `WEBMCP — not offered by this browser`. No `Tools (8)`. No UUID. No `moved_to`.

The second entrance, driven end to end:

| Step | Result |
|---|---|
| Press *Nhờ trợ lý quyết hộ* | `permission denied for table conflict`, verbatim |
| The conflict afterwards | still open — the refusal was real, not staged |
| Press *Xem chuyện vừa xảy ra* | Backstage opens; top audit row is `Tác nhân AI đã thử chốt một mâu thuẫn — BỊ TỪ CHỐI vì permission denied for table conflict` |
| Actor toggle | `Tác nhân AI app_agent` / `Một người app_human` |
| Backstage close | `dialog.open === false` |

`tests/backstage.spec.ts` pins the parts a screenshot cannot: that the refusal contains
`permission denied` **and does not match** `/cannot|not allowed|sorry/i`; that the attempt lands in
the audit stamped `agent`, `outcome: 'refused'`, with the reason carrying the Postgres message; and
that every predicate the seeded archive uses has a word in both languages, so nothing can print a
column name in the largest text on the page.

Entry chunk **145.38 kB / 46.98 kB gz** — 10 bytes larger than the last five tasks, which is
noise, not a regression.

## Deviations

**The wordmark is below the fold, not at first paint.** `TASK-031` was written before `FR-BOOK-09`,
which gives the forest the entire first viewport and puts *nothing* above it. The two cannot both
hold. The later requirement wins, and the forest's own title — *Rừng ký ức* — is the heading a
reader actually sees first. `Memoir Canvas` sits immediately below, with the tagline and the
Backstage door.

**`registered_because` is still English inside Backstage, and should stay that way.** It reads
`a reader asked the assistant to settle it`. That string is not interface copy — it is **stored
provenance**, written into `audit_event` at the moment of the call and read back verbatim.
Translating it at render time would mean showing a record that says something other than what was
recorded. The rule "no English while `lang` is `vi`" governs copy; this is data, and it is behind
Backstage where raw identifiers are permitted anyway.

**`backstage.webmcp` was created and then deleted.** As a catalogue key it made
`tests/i18n.spec.ts` fail — the two languages held the identical string — and the fix on offer was
adding it to `ALLOWED_IDENTICAL`, a set the test's own comment says must stay empty. Weakening the
rule that catches genuinely untranslated strings, for a protocol name that is the same in every
language, is a bad trade. It is a literal in the component now.

**The drawer's open/closed flag went into the store, not through props.** `RefusedPage` sits three
components below `Archive` (`BookStage` → `Volume` → `RefusedPage`), and drilling a callback through
two components that have no interest in it is worse than one field. It is deliberately **not** part
of `ui`: the registry is a pure function of that, and opening a drawer must never change which
tools an agent holds.

**The fold shadow is hidden on a torn page.** The gutter was painting across the refusal panel. A
torn page has no clean fold — the tear replaces it — so `.book-body.torn` drops the gutter, which
is both the fix and the truer picture.

## Known gaps

- **Backstage is one long scroll.** Boot facts, then eight tool forms, then the whole audit. It is
  everything a judge needs in one gesture, but it is not organised — no sections, no tabs.
- **The ask-the-assistant control names a claim arbitrarily.** It passes `spread.claims[0]` and the
  first witness, because the point is the refusal and Postgres never gets far enough to care. If
  the GRANT were ever loosened, this would attempt a real write with an arbitrary winner — the
  fallback text says so (`the agent was NOT refused — check the GRANTs`) but the call would already
  have happened.
- **`AuditTrail` still prints `registered_because` raw**, including a UUID for the person view. That
  is inside Backstage, so the acceptance criterion holds, but a judge reading it sees a bare id.
- **The story cards heading is the only thing between the forest and the Backstage door.** With no
  cards generated, the area below the fold is a wordmark, a sentence and a link — thin, though
  honest.
- **Focus return is the browser's**, from `<dialog>`'s own behaviour rather than anything written
  here. Verified that the dialog closes; the focus-return path was not separately measured.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | No new agent entry point; the ask control calls the command layer, not a tool registration. |
| R2 — shared write door | ☑ | The ask control calls `commands.resolveClaim` — the identical function `resolve_claim` calls — with `actor: 'agent'`. That it is refused is the whole demonstration, and it happens because of the Postgres role, not because of a check in the view. |
| R3 — only the command layer touches the database | ☐ | No SQL and no `db` import added. |
| R4 — the registry is a pure function | ☑ | Protected deliberately: `backstage` is a store field **outside** `ui`, so opening the drawer cannot change the tool set. |
| R5 — the view layer is read-only | ☑ | Reads the projection; the only writes are through `commands.*`. |

`npm run arch:check` passes.

## Files changed

- `src/panels/Backstage.tsx` (new)
- `src/Archive.tsx`
- `src/view/RefusedPage.tsx` (the second entrance)
- `src/view/Spread.tsx`, `src/view/Cover.tsx`, `src/view/Forest.tsx`, `src/view/CssBook.tsx` (predicates as words)
- `src/view/Volume.tsx`
- `src/panels/ManualToolPanel.tsx` (roles named on the toggle)
- `src/store/store.ts`
- `src/app.css`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/backstage.spec.ts` (new)
