---
id: NFR-PRIV
title: Private and local-first
type: non-functional
status: draft
---

# NFR-PRIV — Private and local-first

## Intent

Family memories are private. Nothing is uploaded, stored remotely, or shared between viewers: the
archive lives in the user's own browser and the app has no server to send it to. This is a product
position, not a technical compromise.

One thing does leave the machine, by design, and the pitch must say so: **whatever the user hands
to the agent.** WebMCP tool arguments and tool results travel to the model driving the session,
which is a hosted service. A recollection quoted into `add_memory_claim`, and a `verbatim` read
back out of the archive, both pass through it. The boundary is "the archive stays here", not "not
a byte leaves".

## Requirements

| ID | Requirement |
|---|---|
| `NFR-PRIV-01` | No runtime network calls beyond the app's own static assets. No telemetry, no analytics, no CDN — **including transitive ones**: `@react-three/drei` pulls in `troika-three-text`, whose bundled font resolver hard-codes a jsdelivr URL. Enforced by a Content-Security-Policy in `public/_headers` and a network assertion in CI, not by intention. |
| `NFR-PRIV-02` | All data lives in that browser's own IndexedDB. |
| `NFR-PRIV-03` | No accounts, no credentials, no sign-in, and no principal the app authenticates. `person` rows name family members for **attribution** only; `confirmed_by` records who is *said* to have confirmed a claim, and the app never verifies that assertion. It is provenance, not authentication, and the UI must not present it as proof of identity. |
| `NFR-PRIV-04` | Export is a deliberate user action producing a downloaded file, never an upload. |
| `NFR-PRIV-05` | The repo carries no real family data. `src/seed/family.sql` is fiction. |

## Acceptance

Open the Network tab and run the whole demo core **against a production build**: no requests
beyond the app's own static assets. Dev-server checks do not count — the leak below only appears
once a font is actually rendered.

## Related

- `FR-SEED-seed-archive`

## Amended 2026-08-30

- **Intent** claimed "not a byte leaves the user's machine". That is false by design, because the
  WebMCP tool surface exists precisely to hand the family's testimony to a hosted model. For a
  project whose whole argument is that a system must not overstate what it can prove, this was the
  most damaging sentence in the requirements.
- **-01** measured: rendering the seed's own Vietnamese sentence through `troika-three-text`
  produced seven requests to `cdn.jsdelivr.net`, one of them named
  `font-files/vietnamese/sans-serif.normal.400.woff` — the URL itself discloses that the user is
  reading Vietnamese. There is no CSP and no CI assertion stopping branch A from landing that.
- **-03** was true as written but invited a misreading: `person.id` plus `confirmed_by` looks like
  an identity system and must not be presented as one.
