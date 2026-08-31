---
task: TASK-032
status: done
date: 2026-08-31
author: Lecoeurdelest
---

# IMPL-TASK-032 — Photographs, with nothing to configure

## What was built

A photograph dropped on a memory dates itself. `src/lib/photoDate.ts` walks the JPEG marker chain
to APP1, reads the TIFF header in either byte order, follows the Exif sub-IFD pointer and pulls
`DateTimeOriginal`; a Google Takeout `*.supplemental-metadata.json` sidecar is read for
`photoTakenTime` instead. Files are identified by their first bytes, never their extension.

The important part is what the date is then allowed to *say*. A photograph is a date, not a story,
so it never raises a claim's certainty. If its year matches, the evidence is recorded as
`supports`; **if it differs, as `contradicts`** — and a photograph dropped into the archive can
start a family argument, which is the engine working rather than a feature misfiring.

No Google API, no OAuth, no sign-in, no client ID, and no byte leaves the machine.

## Acceptance criteria

Taken from the task's *In scope*, since it listed no separate criteria block:

- [x] A drop target, and the same target as a tap on a phone
- [x] Files sniffed by their **first bytes**, never their extension
- [x] EXIF `DateTimeOriginal` and Takeout sidecar `photoTakenTime`
- [x] Recorded as a `source` of kind `photo`, through `commands.ts` (`R3`)
- [~] Placing each photo at its year as its own station — **not built; see Deviations**
- [x] No Google API, no OAuth, no sign-in, no client ID
- [x] No network call of any kind; `public/_headers` untouched

## Evidence

| Kind | Location |
|---|---|
| Tests | `docs/implement/evidence/TASK-032-junit.xml` — 133 passing, up from 118 |
| Typecheck | `npm run typecheck` — green |
| Constraints | `npm run db:verify` — 12/12 |

`tests/photoDate.spec.ts` builds real JPEG heads — SOI, APP1, TIFF header, IFD0 with a sub-IFD
pointer, `DateTimeOriginal` as an offset ASCII value — **in both byte orders**, because the two
classic EXIF bugs (reading the wrong endianness, and treating the value offset as file-relative
rather than TIFF-relative) both produce a plausible wrong answer rather than a crash. It also
truncates a valid file at four lengths and asserts the parser does not throw.

That paid for itself immediately: the first run failed both endianness cases, and **the bug was in
the fixture, not the parser** — an IFD entry's value field is at byte 10 of the array, not byte 8.
Had the fixture been written to match a mistaken parser, the test would have passed and the feature
would have been broken on every real photograph.

Driven in Chrome against a real archive: a JPEG carrying `1974:03:02 09:15:00` was dropped on the
`khoảng 1972` claim.

```
landed   stance-contradicts   anh-tiem-may.jpg · Ảnh ghi năm 1974 · lệch với năm trong lời kể
evidence MÂU THUẪN VỚI | Ảnh | anh-tiem-may.jpg | Ảnh ghi năm 1974 | “1974”
```

Entry chunk **46.98 kB gz**, unchanged. The lazy Archive chunk grew 29.55 → 33.80 kB (9.98 → 11.58
kB gz) for the parser and the panel — no dependency was added.

## Deviations

**Photographs attach to a memory; they do not become memories of their own.** The task described
photos placing themselves along the road at their year. Building that means inventing a `claim`,
and a claim needs a subject and a predicate that a JPEG simply does not contain. Manufacturing one
would be the archive turning a file into an assertion about someone's life — the exact failure this
project exists to prevent, committed by the feature meant to enrich it. So a photograph is
evidence, which is what `FR-EVID` already says a photograph is, and the date it carries is weighed
against the claim it is dropped on.

**The pixels are never stored.** Only the date, the filename and the stance are written; the image
is shown from a blob URL that lives as long as the tab. That is the stronger privacy story — the
photograph never enters the archive at all — but it does mean a preview disappears on reload while
the evidence row stays. A family archive arguably should keep the picture; storing images as
`bytea` in an IndexedDB-backed Postgres is a real decision with a real size cost, and it was not
one to make the day before a deadline.

**No `.ics` parsing.** The task listed it. It is the least valuable third of the feature and each
parser is a new way to be wrong; cut, and recorded rather than quietly dropped.

**`upgrade_to_document_supported` is hard-coded false.** A matching year is tempting to treat as
corroboration, but a photograph taken in 1974 does not corroborate *what happened* in 1974. Raising
certainty on a date match would be exactly the guess-into-fact this project refuses, so the flag is
never set — the claim's certainty is left to a human.

**A new `src/lib/` folder.** The parser is pure and imports nothing; it belongs in neither
`domain/` (database-facing) nor `panels/` (DOM). One clearly-named folder for dependency-free
helpers, recorded in the arch map.

## Known gaps

- **HEIC is unhandled on desktop.** iOS transcodes to JPEG through the file input, so a phone is
  fine; a HEIC dragged from a Mac's Finder is sniffed as `unknown` and lands with no date. It is
  recorded as `mentions`, not rejected — but its date is lost.
- **The sidecar is not paired with its photograph.** Dropping a Takeout folder records the JSON and
  the JPEG as two separate sources rather than one photograph with an attested date. Matching
  `IMG_1234.jpg` to `IMG_1234.jpg.supplemental-metadata.json` is a filename convention this does
  not yet follow.
- **Only the first 256 kB is read.** That covers EXIF in every normal file, but a photograph with a
  very large APP1 (an embedded colour profile or a big thumbnail ahead of it) could push
  `DateTimeOriginal` past the window and silently lose its date.
- **A dropped photograph does not trigger conflict detection.** It is recorded as `contradicts`,
  and `v_open_disagreement` groups on claims rather than on evidence stance — so the new
  disagreement is visible in the evidence panel but does not by itself tear the page. Whether it
  should is a real question for `FR-CONF`, not an oversight to patch quietly.
- **No progress for a large selection.** Fifty photographs process serially behind one *reading…*
  label.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 — one door in for agents | ☐ | No agent entry point; this is a human-only affordance. |
| R2 — shared write door | ☑ | Writes through `commands.linkClaimToSource`, the same function `link_claim_to_source` calls. No private path. |
| R3 — only the command layer touches the database | ☑ | The parser touches no database at all; the panel calls `commands.*`. |
| R4 — the registry is a pure function | ☐ | Untouched. |
| R5 — the view layer is read-only | ☑ | `PhotoDrop` holds file-reading state; the archive is changed only through `commands.*`. |

`npm run arch:check` passes.

## Files changed

- `src/lib/photoDate.ts` (new)
- `src/panels/PhotoDrop.tsx` (new)
- `src/panels/EvidencePanel.tsx`
- `src/app.css`
- `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`
- `tests/photoDate.spec.ts` (new)
