# Recording evidence

**A task without `docs/implement/IMPL-<TASK-ID>.md` is not done**, however well the code runs
and however cleanly it merged.

The reason is not bureaucracy: three branches work in parallel over six days, and that file is
the only thing telling someone on another branch "this is finished, this is what was tested,
this is what is still missing". It is also what a judge opens when they want to know how
seriously the project was built.

## Two parts

### 1. JUnit XML — machine-generated

```bash
npm run test:evidence -- TASK-012
# → docs/implement/evidence/TASK-012-junit.xml
```

Never hand-edit the XML. If it comes out empty the task has no tests — go back and write them.

Tasks that produce no runnable code (documentation, configuration, video) do **not** need XML —
write `Evidence: N/A — <reason>` in the IMPL doc instead.

### 2. The IMPL doc — human-written

Copy `docs/implement/TEMPLATE.md` to `docs/implement/IMPL-<TASK-ID>.md` and fill in every
section.

Three sections tend to get written carelessly and are the three worth the most:

- **Deviations** — where you did something different from the task, and why. Doing it
  differently is fine; doing it differently without telling anyone is not.
- **Known gaps** — what is still missing. Write it down so the next person does not spend half
  a day rediscovering it.
- **Invariant check** — which of R1–R5 this task touches, and how you kept them.

## Do not

- Do not paste the whole diff. Git already has it.
- Do not write "tested thoroughly" without XML.
- Do not leave Deviations empty out of laziness — if there genuinely were none, write "None".
