#!/usr/bin/env bash
# R1–R5 checked with grep. Used by .agent/workflows/review-checklist.md and /arch-review.
# Exits 1 if anything is violated.
set -uo pipefail
fail=0

check() {
  local rule="$1" desc="$2"; shift 2
  local out; out="$("$@" 2>/dev/null)"
  if [ -n "$out" ]; then
    echo "FAIL  $rule — $desc"; echo "$out" | sed 's/^/      /'; fail=1
  else
    echo "ok    $rule — $desc"
  fi
}

r3() { grep -rn "from.*domain/db" src/ | grep -v "src/domain/\|src/store/projection"; }
r4() { grep -rn "provideContext(" src/ | grep -v "src/mcp/registry\|src/mcp/modelContext"; }
r1() { grep -rn "window\.[A-Za-z_]* *=" src/; }
r2() { grep -rniE "(insert |update |delete from |select ).*(from|into|set)" src/mcp/handlers.ts; }

check R3 "only domain/ and store/projection.ts import db.ts" r3
check R4 "provideContext appears only in registry.ts and modelContext.ts" r4
check R1 "no system state assigned to window" r1
check R2 "no SQL in mcp/handlers.ts" r2

echo
if [ "$fail" -eq 0 ]; then
  echo "All invariants intact."
else
  echo "Violations found — see .agent/rules/invariants.md"
fi
exit "$fail"
