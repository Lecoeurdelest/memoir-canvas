# /arch-review

> A reusable prompt. Run before each milestone (end of day 2, day 4, day 5).

---

Review the architecture of the Hồi Ký repo. Write the results into `docs/_arch_review.md`
(append a new dated section at the top, keep the old ones).

## 1. Check the invariants mechanically

Run `npm run arch:check`, then run these by hand and paste the raw output:

```bash
grep -rn "from.*domain/db"  src/ | grep -v "src/domain/\|src/store/projection"   # R3
grep -rn "provideContext("  src/ | grep -v "src/mcp/registry\|src/mcp/modelContext" # R4
grep -rn "window\."        src/                                                  # R1
grep -rniE "insert |update |delete |select " src/mcp/handlers.ts                  # R2
grep -rn "useState\|useRef" src/view/ src/panels/                                # R5 (read by eye)
```

Any line that returns output is a violation to explain or fix.

## 2. Check the argument still holds

- Does `src/domain/schema.sql` still carry all three core constraints?
  (`claim_confirmed_needs_a_human`, `claim_evidence_backed`,
  `conflict_resolution_needs_a_human`)
- Is `npm run db:verify` still green at 10/10?
- Is there any write path into `claim` / `conflict` that bypasses `commands.ts`?
- Is there any write that does not record an `audit_event` in the same transaction?

## 3. Check for contract drift

- Do `src/mcp/descriptors.ts` and `docs/API_SCHEMA.md` still agree?
- Does the registration table in `docs/technical/04-stateful-registration.md` still match
  `src/mcp/registry.ts`?
- Does `docs/_arch_map.md` list files that no longer exist, or miss files that were added?

## 4. Check progress against the deadline

Compare `docs/task/README.md` against the six-day schedule. Answer plainly:
- Which tasks are behind their planned day?
- Is the demo core (`TASK-025`) at risk?
- Has any fallback passed its decision deadline without a decision being made?

Write it short and direct. Do not soften it — six days leaves no room for a polite report.
