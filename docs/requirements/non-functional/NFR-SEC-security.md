---
id: NFR-SEC
title: Security
type: non-functional
status: draft
---

# NFR-SEC — Security

## Intent

No backend means a small attack surface, not an empty one.

## Requirements

| ID | Requirement |
|---|---|
| `NFR-SEC-01` | Arguments from an agent are validated **against the tool's advertised `inputSchema`** before reaching the command layer: every advertised field is either enforced or absent from the descriptor, and a violation returns `kind:'invalid_input'` with an `audit_event` row, never a raw database error. |
| `NFR-SEC-02` | All SQL in `src/` is parameterised — no concatenation or interpolation, not even with data you believe is yours. Dev-only scripts under `scripts/` may interpolate compile-time constants; they may never interpolate a value that came from a file, an argument, an environment variable, or an agent. |
| `NFR-SEC-03` | User- and agent-supplied content renders as text, never as HTML, and never as a URL scheme other than `http`/`https`. Source text returned to the model (`source.verbatim`, `evidence.excerpt`) is labelled as **quoted evidence, not instruction** — it is attacker-influenced text on its way into a model's context. |
| `NFR-SEC-04` | Public repo: no secrets, no `.env`, no `node_modules/`. |
| `NFR-SEC-05` | An OSS licence sits at the repo root — a submission requirement. |

## Acceptance

`npm audit` reports no critical vulnerabilities; no secret appears anywhere in git history.

As of 2026-08-30 this **fails**: one critical (`vitest` <= 3.2.5, GHSA-5xrq-8626-4rwp, CVSS 9.8).
`npm i -D vitest@3.2.7` clears it in about ten minutes with build and tests still green. Do **not**
run `npm audit fix --force` — it pulls vite 8, whose rolldown build rejects the object-form
`manualChunks` in `vite.config.ts`.

## Related

- `.agent/context/constraints.md`

## Amended 2026-08-30

- **-01** "runtime schemas are preferred" was aspirational; measured, `handlers.ts` enforces about
  a third of what `descriptors.ts` advertises, and casts the rest through `as never`. The
  requirement now names the descriptor as the source of truth, which is checkable.
- **-02** `src/domain/` was already clean; `scripts/verify-constraints.mjs` was not. Scoped so the
  rule is true rather than aspirational.
- **-03** widened to cover URL schemes and the prompt-injection path: a photograph's `verbatim`
  text is quoted back to the model by design.
