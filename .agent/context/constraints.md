# Constraints — read before proposing anything

## 1. Deadline: 2026-09-03, 1PM PDT

Six days. Any proposal to "do it properly" that costs more than half a day has to be weighed
against whether it shows up in the three-minute demo video. If it does not, push it to
`docs/task/` labelled `post-mvp`.

## 2. It must run inside the ChatGPT in-app browser

The submission has to open there. This is an environment we **do not control**, and it is the
single largest risk in the project. Three things must be confirmed with your own eyes **on day
one**:

- Is the API called `navigator.modelContext` or `document.modelContext`?
- Can PGlite (**16.8 MB of wasm, ~5.3 MB gzipped**) load at all?
- Does WebGL survive?

See `docs/task/TASK-006-model-context-shim.md` and `TASK-027-webview-conformance.md`.

## 3. No backend — this is a position, not a compromise

Family memories are private. A memory canvas that ships grandma's recollections to a stranger's
Postgres is wrong in kind, not just in degree.

Three practical consequences follow:
- **The demo cannot die from network trouble.** No cold start, no CORS, no quota.
- **Judges do not trample each other.** A shared backend means the second person to open the
  link sees data the first one invented. Local-first: everyone gets a clean seeded archive.
- **Fewer moving parts fit in six days.** No API layer, no auth, no server deploy.

## 4. Public repo, OSS licence

A submission requirement. No secrets, no `node_modules/`, no real family data.
`src/seed/family.sql` is **fiction** — keep it that way.

## 5. Three parallel branches

| Branch | Owns | Main risk |
|---|---|---|
| A | `src/view/` | WebGL may not survive the webview |
| B | `src/domain/`, `src/mcp/`, `src/store/` | the WebMCP API name is unsettled |
| C | `src/panels/`, `src/seed/`, video | bilingual content takes longer than expected |

Directory boundaries follow people boundaries. A and C only **read** `src/store/` and only
**write** through `src/domain/commands.ts`.
