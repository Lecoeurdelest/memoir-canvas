---
task: TASK-044
status: done
date: 2026-09-02
author: Codex
---

# IMPL-TASK-044 — A family interview with a keepsake

## What was built

A prominent forest entry opens Grandma's seeded story directly, skipping the cover. The guide
derives four stages from the live projection: compare accounts, ask a relative, read the family's
answer, and review a bilingual keepsake. It provides a copyable prompt only when an assistant
action is needed and takes the family directly to the existing answer form. The current story
card displays its sources and weakest certainty, with printing enabled after a person reviews
that specific draft. Unresolved evidence can remain unresolved through the end of the story.

## Acceptance criteria

- [x] One click opens the relevant story; entry is hidden when absent or blocked by an earlier conflict.
- [x] Native assistant reads, flags, asks and drafts through the existing eight tools.
- [x] Human answer form and named confirmation controls remain available beside the guidance.
- [x] Each step updates from the projection without reloading; revisiting resumes saved progress.
- [x] English and Vietnamese guide, prompts and story rendering verified.
- [x] Standard buttons and checkbox work by keyboard; phone-width layout keeps evidence uncovered.
- [x] Cited draft can be printed after review, without automatically confirming its claims.
- [x] No schema changes or new tools.

## Evidence

| Kind | Result |
|---|---|
| Regression tests | `evidence/TASK-044-junit.xml`: unchanged copy of the shared final 184-test JUnit run; 0 failures |
| Typecheck / build | `npm run typecheck` and `npm run build` passed |
| Architecture | `scripts/check-invariants.sh` passed using Git Bash |
| Constraints | N/A — schema and commands unchanged |
| Browser | Codex in-app browser, localhost, desktop and 390 × 844 viewport |

Browser walkthrough: opened the forest CTA, invoked native read/flag/question tools, answered
the fictional Uncle Ba question in the normal human form, and invoked native draft generation.
The steps advanced immediately. Both conflicting claims remained in the final draft with source
citations, and the page explicitly allowed the family to leave the year unknown. The print button
was disabled until its review checkbox was selected. Language switching rendered the complete
guide and draft in both languages. A narrow viewport stacked guidance and evidence rather than
covering either; the temporary viewport override was reset afterward. Leaving the guide preserved
the conflict and withdrew conditional WebMCP tools.

## Deviations

The guide intentionally follows one fictional sample family rather than introducing another
general-purpose editor. Existing human answer and confirmation components are reused. The two
tasks share the same full regression run; the second XML is copied, never edited. The system
print dialog and physical/PDF output were not exercised; the review gate and print stylesheet
were checked in code and UI.

## Known gaps

A supporting browser assistant still needs the copied prompt; this app does not host an AI model
or send prompts automatically. The review checkbox is local UI acknowledgment, not a durable
signature or a claim confirmation. Source quotations stay in their original language. This work
does not deploy, submit to Devpost, or guarantee support in every browser.

## Invariant check

| Rule | Touched? | How it was kept |
|---|---|---|
| R1 | Yes | Prompts use registered tools; no extra route into domain state. |
| R2 | Yes | Existing answer/confirmation components call the shared domain commands. |
| R3 | No | No database access added. |
| R4 | Yes | Opening/leaving goes through existing navigation and the pure registry. |
| R5 | Yes | Guide reads the projection; local state contains only copied/reviewed UI markers. |

The self-review checklist was walked. No new network calls, fabricated model responses or
automatic human confirmation were introduced.

## Files changed

- `src/view/GuidedStory.tsx`, `src/view/BookStage.tsx`, `src/view/Forest.tsx`
- `src/app.css`, `src/i18n/locales/en.json`, `src/i18n/locales/vi.json`
- `docs/USER_GUIDE.md`, `docs/_arch_map.md`, `docs/task/README.md`
- `docs/task/TASK-044-guided-family-story.md`, this log and JUnit evidence
