# Architecture review

> Run [`.agent/commands/arch-review.md`](../.agent/commands/arch-review.md) and record the
> results here. Add new sections at the **top**, keeping the old ones so they can be compared.

Schedule: end of day 2, end of day 4, end of day 5.

---

## <YYYY-MM-DD> — not yet run

No data. The first review happens at the end of day 2, once the write path is open
(`TASK-012`).

### 1. Mechanical invariant checks

| Command | Rule | Result |
|---|---|---|
| `grep -rn "from.*domain/db" src/ \| grep -v "src/domain/\|src/store/projection"` | R3 | — |
| `grep -rn "provideContext(" src/ \| grep -v "registry\|modelContext"` | R4 | — |
| `grep -rn "window\." src/` | R1 | — |
| `grep -rniE "insert \|update \|select " src/mcp/handlers.ts` | R2 | — |
| `grep -rn "useState\|useRef" src/view/ src/panels/` | R5 | — |

### 2. Does the argument still hold

- All three core constraints intact: —
- `npm run db:verify`: —
- Write paths bypassing `commands.ts`: —
- Writes missing an `audit_event`: —

### 3. Contract drift

- `descriptors.ts` ↔ `docs/API_SCHEMA.md`: —
- Registration table ↔ `registry.ts`: —
- `_arch_map.md` ↔ the real `src/` tree: —

### 4. Progress against the deadline

- Tasks behind schedule: —
- Risk to `TASK-025`: —
- Fallbacks past their decision deadline: —
