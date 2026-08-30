# Critical path

Eight pipeline stages for Memoir Canvas, four days out from the Devpost deadline
(**2026-09-03, 1PM PDT**). Each stage lists what runs in parallel across the three branches, and
what has to finish before the next stage can start.

This document amends [`docs/task/README.md`](task/README.md): several tasks marked `todo` there
are already substantially built in `src/`, and the two-round audit run on 2026-08-30 found work
that belongs in the sequence but isn't one of the original 29 tasks — marked **NEW** below.

Legend: ✅ done · 🟡 partial (see note) · ⬜ not started · 🆕 new, found by the audit.

---

## Stage 0 — Do these now, no dependencies (~90 minutes)

- [x] Delete `manualChunks` from `vite.config.ts` — done. The entry chunk no longer statically
      imports a vendor chunk; the build is now a single 142 kB / 45.7 kB-gz chunk.
- [x] `npm i -D vitest@3.2.7` — critical count is now 0, which is what NFR-SEC's acceptance asks
      for. Two dev-server-only advisories remain (vite/esbuild); both need vite 8, a semver-major
      that swaps rollup for rolldown. Deliberately not taken four days out.
- [x] Add a CSP to `public/_headers` blocking the `troika-three-text` → jsdelivr font leak.
- [x] `crypto.randomUUID` fallback, so writes work over plain http when probing a phone.
- [x] `resetArchive()` + `reseed()` — the demo can now run more than once per browser profile.
- [x] 18 requirement docs corrected to match measured reality.
- [x] Repo pushed public — `github.com/Lecoeurdelest/memoir-canvas`.

---

## Stage 1 — Open three fronts at once · Day 1

Nothing here depends on anything else finishing first.

**Branch A — `view/`**
- 🆕 Build the CSS book first (~3h). Not the day-4 contingency `TASK-026` names it as — the
  92-line prototype has no real dependency on the R3F scene, and it's the more accessible, more
  testable path. Build it as the opening move.
- ⬜ [`TASK-015`](task/TASK-015-book-scene.md) The 3D book scene — R3F scene, mesh, camera,
  lighting, on fixture data.

**Branch B — `domain/` + `mcp/` + `store/`** — ✅ complete, verified 19/19 in a real browser
- [x] Fix `resolveClaim` — membership check, rowcount check, and a check that `resolved_by` names
  someone a *human* entered. Three independent layers now stand between an agent and a fact:
  privilege, constraint trigger, and a readable refusal.
- [x] Fix `v_open_disagreement` — groups on the claim's object too, so "moved to Đà Nẵng 1972"
  and "moved to Sài Gòn 1980" are no longer reported as a contradiction.
- [x] Role-based hardening — `app_agent`/`app_human`, column-level `GRANT`s, actor-stamping
  triggers, `SET LOCAL ROLE` per transaction. The agent holds no UPDATE on `claim.confirmed_by`,
  so the exploit fails with `permission denied` before any application logic runs.
- [x] Fix the `modelContext` unregister-loop bug — plus 5 regression tests that fail against the
  old code and pass against the new.
- [x] Audit refusals (OBS-02) — written in their own transaction after the rollback, carrying
  `{outcome, reason, constraint}`. Previously every blocked attempt vanished with the rollback.
- [x] `db:verify` extended to 12/12, including two cases the old suite never checked: closing a
  conflict with a non-member claim, and a fact signed for by a person the agent invented.
- [x] Schema versioning in `db.ts` — a changed `schema.sql` used to be a silent no-op for any
  browser that had already booted once.
- [x] REL-02 — `query()` routed through `serialize()`, `BEGIN` moved inside the `try`.

**Branch C — `panels/` + `seed/`**
- ⬜ [`TASK-021`](task/TASK-021-certainty-badges.md) Certainty badges (~2h) — only needs
  `TASK-004` (done). Build the shape-plus-text a11y requirement in from the start.

---

## Stage 2 — Wire `main.tsx` · Day 2, morning

**Sync point.** The single highest-leverage task left. Right now the app renders one line of
text — nothing below the entry point is reachable in a browser. Everything in Stage 1 is
invisible until this lands, so wire it once, to the *hardened* command layer, not twice.

**Branch B**
- 🆕 Connect the chain (~3h): `getDb()` → `seedIfEmpty()` → `buildReadModel()` → `toolsFor()` →
  `provideContext()`, and mount `ManualToolPanel` — the primary interaction surface, since
  `modelContext` is absent by default, not the exception.
- 🆕 REL-04: stop the white screen (~1h) — if the wasm never settles, `getDb()` hangs forever and
  the React root goes empty. Add an error boundary and a loading state in the same file.

---

## Stage 3 — Build against real data · Day 2 afternoon → Day 3

The store is live now, so the view and panel layers have something real to bind to.

**Branch A**
- ⬜ [`TASK-016`](task/TASK-016-page-spread.md) The page spread (~half day) — recollection left,
  evidence right, bound to the store, via `<Html transform>` **without** `occlude`.
- ⬜ [`TASK-017`](task/TASK-017-page-turn.md) Turning pages (~half day) — fold in keyboard support
  (ArrowLeft/ArrowRight) and `prefers-reduced-motion` from the first line; both were prototyped
  and measured, not left for a retrofit.

**Branch B**
- ⬜ [`TASK-011`](task/TASK-011-mcp-handlers.md) Wire `link_claim_to_source` (~30m) — the command
  already exists, the handler just never called it.
- 🆕 SEC-01 validator (~2–3h) — a 45-line descriptor-driven validator, so every advertised field
  is either enforced or refused, not silently dropped.
- 🆕 `generate_story_card` (~half day) — command and handler don't exist yet; needed before
  `TASK-023` can render anything.

**Branch C**
- ⬜ [`TASK-022`](task/TASK-022-evidence-panel.md) The evidence panel (~half day) — sources,
  verbatim excerpts, supports/contradicts stance.

---

## Stage 4 — Close the loop · Day 3

The tear is the demo's central metaphor; the audit panel is what a judge opens. Both need what
Stage 1–3 just finished.

**Branch A**
- ⬜ [`TASK-018`](task/TASK-018-tear-conflict.md) The conflict tear (~half day) — needs Stage 1's
  fixed `v_open_disagreement`, or it tears on conflicts that don't really exist.
- ⬜ [`TASK-019`](task/TASK-019-tear-heal.md) Healing the tear (~2h) — the visual consequence of
  `resolve_claim` succeeding.
- ⬜ [`TASK-020`](task/TASK-020-constellation.md) The constellation (if time allows) — family
  relationships floating above the book. The project's own notes name this the first thing to
  cut. See the cut list below.

**Branch B** — standing by, no new task scheduled; support A and C.

**Branch C**
- ⬜ [`TASK-023`](task/TASK-023-story-card.md) The bilingual story card (~half day) — needs
  Stage 3's `generate_story_card`. `floor_certainty` comes from the data, never from the agent.
- ⬜ [`TASK-024`](task/TASK-024-audit-panel.md) The audit panel (~4–6h) — needs Stage 1's
  refusal-logging fix to show anything meaningful, or the one thing a judge opens has an empty
  "blocked" column.

---

## Stage 5 — Run the demo core end to end · Day 3 → Day 4

Everything above converges here. This is
[`TASK-025`](task/TASK-025-core-loop-e2e.md): person → two disagreeing claims → `flag_conflict` →
torn page → `propose_followup_question` → a person opens the conflict → `resolve_claim` → healed
tear — live, in the browser, not in a script.

**Branch B**
- ⬜ Assemble, run ten times with a reload between each (the `NFR-REL` acceptance bar), fix
  whatever the seams reveal. (~half day)

---

## Stage 6 — Confirm the webview · Continuous from Day 1, confirmed by Day 4

Split into what a script can check and what only a phone can.

**Branch B**
- ⬜ `TASK-027a` Automated: WKWebView + Chromium — already run once; PGlite boots on IndexedDB in
  1,396 ms, no cross-origin isolation needed. Keep re-running as Stage 1–5 land.
- ⬜ `TASK-027b` Manual: the ChatGPT in-app browser (~30m, needs a phone) — the one thing nobody
  but the team can do. Record user-agent, whether `modelContext` is present, and PGlite boot time,
  on at least one physical device.

---

## Stage 7 — Ship it · Day 4

Deploy, then submit — in that order, since the submission cites the live URL.

**Branch B**
- ⬜ [`TASK-028`](task/TASK-028-deploy-static.md) Static deploy (~1h) — `public/_headers` is
  already written for Cloudflare Pages. Needs Stage 6 green first.

**Branch C**
- ⬜ [`TASK-029`](task/TASK-029-devpost-submission.md) Devpost submission and video (remaining
  time) — competes for the same person's hours as Stage 4's audit-panel polish; don't schedule
  both on the same afternoon.

**Branch A** — free to help wherever is behind.

---

## If Day 4 arrives and something isn't done

1. **Cut `TASK-020` the constellation first.** The project's own notes call it that: "first task
   to cut if the schedule slips." Nothing else depends on it.
2. **Narrow `TASK-026`'s scope.** Ship the flat DOM fallback that was already built and measured;
   drop the idea of a faithful CSS twin of the 3D book (tear animation and all) — that alone is
   1.5–2 days nobody has.
3. **Keep `TASK-024`'s data, cut its polish.** The Stage 1 refusal-logging fix is load-bearing for
   the project's argument; a plain readable list beats a beautifully styled one that arrived late.
4. **One confirmed device is enough for Stage 6b.** The amended `NFR-PORT-06b` only requires iOS
   *and* Android if both are actually available.

---

Dependency graph derived from every `docs/task/TASK-*.md` frontmatter, cross-checked against what
actually exists in `src/`.
