---
id: FR-QUES
title: Follow-up questions
type: functional
status: draft
---

# FR-QUES — Follow-up questions

## Intent

When the agent refuses to guess it must still do something useful: turn the uncertainty into a specific question for a specific person.

## Requirements

| ID | Requirement |
|---|---|
| `FR-QUES-01` | Every question points at least at one `conflict` or one `claim`. |
| `FR-QUES-02` | `ask_person_id` suggests **who in the family** is most likely to know. |
| `FR-QUES-03` | Questions are bilingual: `question_vi` required, `question_en` optional. |
| `FR-QUES-04` | Lifecycle: `open` → `asked` → `answered` | `dropped`. |

## Acceptance

This requirement is met when every row above has at least one corresponding test, and that
test appears in some `docs/implement/evidence/TASK-*-junit.xml`.

## Related

- `docs/technical/07-conflict-lifecycle.md`
