# Test harness review

> Whether the tests are green matters less than whether they check the right things. This
> document reviews the quality of the test suite itself.

## Questions to answer

1. **Do the tests check behaviour, or only that the code runs?**
   A test that calls `commands.resolveClaim()` and asserts it did not throw is worthless. The
   right test asserts that calling it **without** a `confirmed_by` is **refused**.

2. **Do the three core constraints have negative tests?**
   Positive tests (doing it right works) are easy to write and worth little. Negative tests
   (doing it wrong is blocked) are what prove the argument. `npm run db:verify` must have all
   ten.

3. **Does `toolsFor()` cover all five UI states?**
   It is a pure function; there is no excuse for leaving a branch untested.

4. **Is any test green because a constraint was loosened?**
   The most dangerous signal: a PR that edits both a test and a constraint.

5. **Does the evidence XML match the real tests?**
   Files under `docs/implement/evidence/` must come from `npm run test:evidence`, never from a
   text editor.

## Findings

_Not yet run. First pass at the end of day 3._
