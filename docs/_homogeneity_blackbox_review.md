# Homogeneity review — black-box view

> Read the repo as someone who has **never seen it**: a fresh agent, a new team member, or a
> judge. Check whether the same concept is called the same thing everywhere.

Naming drift is how one project with three branches quietly becomes three projects.

## Four axes

### 1. Vocabulary

Every concept in [`.agent/context/glossary.md`](../.agent/context/glossary.md) gets **one** name
in code, one in the docs, one in the UI.

Drift looks like: `certainty` here, `confidence` there. `claim` in SQL, `assertion` in
TypeScript. "Oral recollection" in the UI, "oral" in the docs.

### 2. Shape

Do all commands in `commands.ts` share one signature shape? Do all handlers share one
validation shape? Do all tools share one return shape?

The one function shaped differently is the one the next person will copy wrongly.

### 3. Documentation

Do all task docs carry the same sections? Do the IMPL docs actually fill in **Deviations** and
**Known gaps**, or has someone written them for form?

### 4. Error messages

Do errors shown to a user and errors returned to an agent share a voice? Do they say **what
went wrong** and **how to fix it**, or just throw a code?

## How to review

Read along an axis, not through files. Open all eight handlers side by side and compare; open
all five certainty labels side by side and compare. Drift only becomes visible when things sit
next to each other.

## Findings

_Not yet run. First pass at the end of day 4, once the demo core is working._
