---
id: TASK-032
title: Photos on the road, with nothing to configure
branch: C
day: 5
depends_on: [TASK-030]
status: todo
---

# TASK-032 — Photos on the road, with nothing to configure

| | |
|---|---|
| **Branch** | C |
| **Planned day** | Day 5 |
| **Depends on** | `TASK-030` |
| **Requirements** | [`FR-EVID`](../requirements/functional/FR-EVID-evidence-sources.md), [`NFR-PRIV`](../requirements/non-functional/NFR-PRIV-privacy-local-first.md), [`NFR-PORT`](../requirements/non-functional/NFR-PORT-webview-portability.md) |

## Goal

The product owner's direction: connecting Google Photos or Google Calendar would make the archive
more vivid — *"nhưng cũng không nên để người dùng tự config"*, and: research what is genuinely
easiest for the user.

So: the user makes **one gesture** and their photographs place themselves along the road at the
year each was taken. No account, no sign-in, no settings screen, and no byte leaving the machine.

## Why not the Google APIs — researched, not assumed

| Finding | Consequence |
|---|---|
| Google **removed** the broad Photos Library scopes (`photoslibrary.readonly` and siblings) after **2025-03-31**; calls relying on them return `403 PERMISSION_DENIED`. | There is no API, at any tier, that enumerates a user's existing photos. The capability was withdrawn from self-serve developers, not merely restricted. |
| The replacement Picker API requires the user to leave the app and **hand-pick every photo**, per session. | It is architecturally the opposite of "don't make the user configure it". |
| Google **blocks its OAuth authorization endpoint inside embedded webviews** (`disallowed_useragent`; `WKWebView` and `android.webkit.WebView` named). | `NFR-PORT` requires this app to run in the ChatGPT in-app browser, which is WKWebView-backed. The consent screen would not load there at all. This is the decisive blocker, and it is specific to this project. |
| Google Calendar v3 is alive, CORS-enabled and sensitive-not-restricted; an app in **Testing** status needs no verification. | Calendar is *technically* reachable — but it still needs sign-in, which `NFR-PRIV-03` forbids outright, and it still dies in the webview. |

Two corrections worth recording, because the first analysis got them wrong and an adversarial pass
caught them: OAuth app **verification is not required** for a Testing-status app (100 test users,
no review), and **no CSP directive governs a top-level navigation or `window.open`** — so the
consent dance was never the CSP problem. The blockers that survive are the withdrawn scopes, the
webview ban, and `NFR-PRIV-03`.

## The approach that gives the same benefit

`<input type="file" accept="image/*" multiple>`, plus drag-and-drop onto the road.

This is not a lesser substitute. On **Android** a plain image file input opens the system photo
picker, whose backing provider **is Google Photos** — the user is literally choosing from their
Google Photos library. On **iOS** it opens the Photos library and transcodes HEIC to JPEG on the
way in, which disposes of the format problem for free. It needs no API, no scope, no consent
screen, no verification, no client ID, and it works in the webview where OAuth does not.

Dates come from the file itself, so nothing is typed:

- JPEG EXIF `DateTimeOriginal`, read from the APP1/TIFF header. No dependency; watch the byte-order mark.
- A Google Takeout export ships `*.supplemental-metadata.json` beside each file carrying `photoTakenTime`. **Better** than EXIF for this project: it survives editors stripping EXIF, it is `JSON.parse` rather than a byte walk, and it is Google's own attested capture time — which makes it a stronger `source` than a recollection.
- A `.ics` file dropped in gives dated events with a few lines of parsing.

## In scope

- a drop target that is the road's unpaved end, and the same target as a tap on a phone
- sniffing each file by its **first bytes**, never its extension — Takeout filenames mislead
- EXIF `DateTimeOriginal` and Takeout sidecar `photoTakenTime`
- placing each photo at its year, as a `source` of kind `photo`, through `commands.ts` (`R3`)
- a station built from a photo nobody has spoken about yet reads as `uncertain` — a photograph is a date, not a claim about what happened

## Out of scope

- **no** Google API, no OAuth, no sign-in, no client ID — see above
- no network call of any kind; `public/_headers` is not touched
- no HEIC decoding in-browser (iOS transcodes on the way in; desktop HEIC is a known gap)
- no video

## Acceptance criteria

- [ ] One gesture, zero configuration: no settings screen, no field to fill, no mapping step
- [ ] A photo with EXIF lands on the correct year without the user typing a date
- [ ] A Takeout folder with sidecars lands correctly even when EXIF has been stripped
- [ ] A file with no discoverable date is accepted and says so, rather than being silently dropped or given a guessed year
- [ ] Zero network requests during the whole flow, against a production build with the shipped CSP
- [ ] Works from a phone's photo picker

## Files touched

- `src/domain/import.ts` (new — byte sniffing, EXIF, sidecars)
- `src/view/Road.tsx`
- `src/domain/commands.ts`
- `src/app.css`
- `tests/import.spec.ts` (new)

## Notes

**A CSP trap, found before writing any code:** `connect-src 'self'` does **not** match the `blob:`
scheme, so `fetch(URL.createObjectURL(file))` — the natural way to write this — is blocked by the
shipped policy. Use `file.arrayBuffer()` and `createImageBitmap(file)` directly and never fetch an
object URL. `img-src 'self' data: blob:` already permits displaying the picked file, so no header
change is needed.

Where the bytes live is an open decision: `bytea` in Postgres means a schema change and a rebuild
of the user's archive, which is expensive for a frozen file this late. A separate IndexedDB store
keyed by `source.id` is the cheaper option and should be costed first.

`NFR-PRIV-01` gains rather than loses here: the family's photographs never leave the machine, and
that is a stronger sentence for the submission than any integration would have been.

## When it is done

1. `npm run typecheck` · `npm test`
2. `npm run test:evidence -- TASK-032`
3. Write `docs/implement/IMPL-TASK-032.md` from `docs/implement/TEMPLATE.md`
4. Walk `.agent/workflows/review-checklist.md`
