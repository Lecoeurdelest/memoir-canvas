# What Memoir Canvas is

A family memory canvas where people and an AI agent **together** reconstruct family history
from oral accounts, old photographs and documents — under one condition: the agent must cite
its sources, must show where it is unsure, and **may never resolve a contradiction on its own**.

Entry for **The WebMCP Challenge** (Devpost, hosted by OpenAI). Deadline **2026-09-03, 1PM PDT**.

The project is titled in English, **Memoir Canvas**.

## The core scenario — know this by heart

1. Someone says: *"Grandma moved up to Đà Nẵng around 1972 and opened a tailor shop."*
2. The agent calls `add_person`, `add_memory_claim` → the claim is labelled **oral**, year `circa`.
3. Someone produces a photograph with **1974** written on the back.
4. The agent calls `link_claim_to_source` with `stance='contradicts'`.
5. The view `v_open_disagreement` notices two different years for the same claim.
6. The agent calls `flag_conflict` → the page **splits along a red tear, and the book will not close**.
7. **The agent stops.** No tool available to it can decide which year is right.
8. The agent calls `propose_followup_question` → *"Ask Uncle Ba: was the photo taken before or after the move?"*
9. A person opens the conflict page → `resolve_claim` **appears** in the agent's tool list for
   the first time.
10. The person confirms 1974 → the tear heals, the label becomes **Confirmed**, and it carries
    the confirming person's name.
11. `generate_story_card` → a bilingual card carrying the **weakest** certainty among the claims
    it stands on.

Steps 6–9 are the demo core. If only one chain works end to end, it must be this one.

## The 3D book

The book **is** the memory graph rendered — not an illustration sitting next to the data.

- The spine is a timeline; each spread is one story card (recollection left, evidence right).
- A conflict is a **physical metaphor**: the page tears, and the book cannot close there.
- Resolution heals the tear.
- Family relationships appear as a constellation floating above the book.

**Rule:** every 3D effect must be the *consequence of a tool call or a state change*.
Spontaneous effects turn the project into decoration and cost points on *WebMCP Leverage*.

## Judging criteria

`WebMCP Leverage` · `Execution` · `Potential Impact` · `Creativity & Ambition`

## Attribute correctly

The challenge is hosted by **OpenAI**. But the **WebMCP specification** belongs to the
**W3C Web Machine Learning Community Group**, associated with Google and Microsoft. Do not
conflate the two in the pitch — for a project whose entire argument is "cite your sources
properly", getting the attribution wrong on slide one shoots you in the foot.
