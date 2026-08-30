# Implementation log

Every finished task leaves exactly one `IMPL-TASK-NNN.md` here, plus a JUnit XML file in
`evidence/`.

**A task without an IMPL doc is not done**, even if the code is merged.

## Why this is required

Three branches work in parallel over six days. This file is the only thing telling someone on
another branch "this is finished, this is what was tested, this is what is still missing". It
is also what a judge opens when they want to know how seriously the project was built.

## How to write one

1. `npm run test:evidence -- TASK-NNN` → produces `evidence/TASK-NNN-junit.xml`
2. Copy `TEMPLATE.md` to `IMPL-TASK-NNN.md` and fill in every section
3. The three sections that tend to be written carelessly are the three worth the most:
   **Deviations**, **Known gaps**, **Invariant check**

Details: [`.agent/workflows/write-evidence.md`](../../.agent/workflows/write-evidence.md)

## Conventions

| | |
|---|---|
| One task | one `IMPL-TASK-NNN.md` |
| Task produces runnable code | JUnit XML required |
| Task produces no code (docs, video, deploy) | write `Evidence: N/A — <reason>` |
| Never hand-edit the XML | it is machine-generated; editing it is faking evidence |
