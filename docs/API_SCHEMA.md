# API — the eight WebMCP tools

This document must match `src/mcp/descriptors.ts` **word for word**. Both are frozen: changing
either requires a new task, a heads-up to the team, and both edited in the same PR.

Tool descriptions are written **for the agent to read**, not for humans. They say what a tool
does **and what it refuses to do** — because the description is what the model uses to decide
which tool to reach for.

---

## How the agent gets in

```ts
const mc = navigator.modelContext ?? document.modelContext;
mc.provideContext({ tools: toolsFor(uiState) });
```

The API name is not settled: the W3C proposal uses `navigator.modelContext`, while the
challenge page shows `document.modelContext` in places. `src/mcp/modelContext.ts` detects both
at runtime rather than guessing.

Tools are handed over with `provideContext()` — **whole-set replacement** — not with per-tool
`registerTool()` calls. That is exactly what a pure `tools = f(uiState)` wants to return.

---

## Which tools are live when

Three tools are conditional. This is the strongest WebMCP-native part of the project.

| Tool | Archive | Person open | Person has disagreement | Conflict open | Resolved |
|---|:--:|:--:|:--:|:--:|:--:|
| `read_memory_graph` | ● | ● | ● | ● | ● |
| `add_person` | ● | ● | ● | ● | ● |
| `add_memory_claim` | ● | ● | ● | ● | ● |
| `link_claim_to_source` | ● | ● | ● | ● | ● |
| `generate_story_card` | ● | ● | ● | ● | ● |
| `flag_conflict` | ○ | ○ | **●** | **●** | ○ |
| `propose_followup_question` | ○ | ○ | ○ | **●** | ○ |
| `resolve_claim` | ○ | ○ | ○ | **●** | ○ |

The last three rows are the whole difference. `flag_conflict` exists only while
`v_open_disagreement` has a row for the open subject — once the disagreement is gone, the tool
disappears. `resolve_claim` exists only while the user is looking at that specific conflict.

An agent cannot "remember" a removed tool and call it later: the registry is the only source of
truth, and every call records `audit_event.registered_because` stating why the tool was
available at that moment.

Source: [`src/mcp/registry.ts`](../src/mcp/registry.ts) ·
Tests: [`tests/registry.spec.ts`](../tests/registry.spec.ts)

---

## Return shape

Every tool returns the same shape:

```ts
{ ok: true,  data: { … } }
{ ok: false, error: { kind: 'refused' | 'invalid_input' | 'internal', message: string } }
```

`invalid_input` means the arguments do not match the tool contract. `refused` means **the data
does not permit** the operation — not a system failure. For example, calling `flag_conflict`
when no disagreement exists. An agent should read `message` and change course rather than retry.

**Return values carry facts and certainty. They never carry a verdict.**

---

## The eight tools

### `read_memory_graph`

Read the whole graph: people, places, claims, evidence, open conflicts and pending questions.

Every claim carries a certainty label. **Never present a claim to the user as settled fact
unless its certainty is `confirmed`.**

```jsonc
{ "subject_id": "string?"   // optional; restrict the read to one person or place
}
```

---

### `add_person`

Add a person. Only a display name is required.

**This tool does not accept a birth year.** A birth year is a *claim about* a person, not a
property *of* one — record it with `add_memory_claim`.

```jsonc
{ "display_name": "string",   // required — how the family refers to them
  "aka":          ["string"], // other names used
  "note":         "string"    // free-text context the family gave you
}
```

Returns `{ person_id }`.

---

### `add_memory_claim`

Record one assertion about the past: a move, an occupation, a family relationship, a year.

**Claims created by an agent are capped at certainty `oral`** — the agent marks nothing as
confirmed. If the speaker was vague ("around 1972"), set `year_precision: "circa"` rather than
**rounding to an exact year**.

```jsonc
{ "subject_kind":     "person" | "place" | "claim",  // required
  "subject_id":       "string",                      // required
  "predicate":        "string",                      // required — moved_to, relation, …
  "object_person_id": "string?",
  "object_place_id":  "string?",
  "object_text":      "string?",
  "year_value":       0,
  "year_min":         0,
  "year_max":         0,
  "year_precision":   "exact" | "circa" | "decade" | "range"
}
```

Returns `{ claim_id, certainty: "oral" }` — the cap is repeated in the return value so the agent
knows the label it actually received.

---

### `link_claim_to_source`

Attach evidence to a claim.

**A source may CONTRADICT a claim, not only support it.** Use `stance: "contradicts"` when a
photo or a document disagrees with what was said. Contradictions are **recorded**, never
silently discarded. Quote the source exactly; do not paraphrase.

```jsonc
{ "claim_id": "string",                                  // required
  "stance":   "supports" | "contradicts" | "mentions",   // required
  "excerpt":  "string",                                  // e.g. "1974 written on the back"
  "source": {
    "kind":           "oral_account" | "photo" | "document" | "external_record",
    "title":          "string",
    "uri":            "string?",
    "verbatim":       "string?",   // oral accounts: the words exactly as spoken
    "contributor_id": "string?"    // REQUIRED for oral_account
  }
}
```

Raising a claim to `document_supported` is only possible once evidence with `stance='supports'`
exists — enforced by a constraint trigger, not by convention.

---

### `flag_conflict`  · *conditionally registered*

Record that two or more active claims about the same subject and predicate cannot both be true.

This tool **only succeeds when the disagreement already exists in the data** — an agent cannot
invent one. It records the conflict and marks the claims as conflicting. It **does not decide**
which claim is right, and **no tool available to the agent can**.

```jsonc
{ "subject_kind": "person" | "place" | "claim",
  "subject_id":   "string",
  "predicate":    "string" }
```

Returns:

```jsonc
{ "conflict_id": "…",
  "conflicting_claim_ids": ["…", "…"],
  "resolution": "requires a person — no tool available to you can settle this" }
```

The `resolution` line is deliberate: the return value refuses to guess as well.

---

### `propose_followup_question`  · *conditionally registered*

Turn an uncertainty into something the family can act on: a specific question for a specific
relative.

Use it when you have found a conflict and cannot resolve it yourself — which is always. Write
the question in Vietnamese; add an English version.

```jsonc
{ "conflict_id":   "string?",
  "claim_id":      "string?",   // at least one of the two is required
  "question_vi":   "string",    // required
  "question_en":   "string?",
  "ask_person_id": "string?"    // who in the family is most likely to know
}
```

---

### `resolve_claim`  · *conditionally registered — only while the conflict is on screen*

Close an open conflict by recording which claim the **FAMILY** decided is correct.

This is not the agent's judgement to make: it requires a named person, and **the database
rejects the write without one**. Only call it after a person has explicitly stated their
decision in the conversation.

```jsonc
{ "conflict_id":     "string",   // required
  "winning_claim_id":"string",   // required
  "resolved_by":     "string",   // required — id of the person who decided
  "resolution_note": "string?"   // why they decided, in their words
}
```

Three database constraints guard this step:
`conflict_resolution_needs_a_human` and `claim_confirmed_needs_a_human` block the write, and
the registry blocks the tool from appearing at all.

---

### `generate_story_card`

Compose a short bilingual passage from existing claims.

**The card inherits the WEAKEST certainty among the claims it stands on** — the agent does not
choose that label, and good prose does not make shaky evidence stronger. Do not add facts that
are not in the claims you cite.

```jsonc
{ "subject_person_id": "string",
  "claim_ids":         ["string"],  // at least one
  "title_vi": "string", "title_en": "string",
  "body_vi":  "string", "body_en":  "string" }
```

---

## Auditing

Every successful write tool call writes exactly one `audit_event`, **in the same transaction as
the write**. A rollback loses both — no orphaned audit rows, no silent writes.

Recording operations that are **refused** is a requirement, but is not implemented yet. When it
lands, the reason should be preserved because "the agent tried and was blocked" is the most
valuable line in the whole log: it is the evidence that the constraints are real.

`registered_because` records the UI context that made the tool available at call time — for
example `"user has conflict 6666… open"`.
