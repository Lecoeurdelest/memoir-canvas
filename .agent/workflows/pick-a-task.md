# Picking a task

1. Open `docs/task/README.md` — the status table for every task.
2. Filter by your branch (A / B / C) and by whether `depends_on` is satisfied.
3. Take the lowest-day task nobody has claimed.
4. Check that `docs/implement/IMPL-<TASK-ID>.md` does **not** exist. If it does, that task is done.

## Do not

- Do not bundle two tasks into one PR. The status table stops meaning anything and review gets
  twice as hard.
- Do not take another branch's task without saying so. Directory boundaries follow people
  boundaries.
- Do not start a day-4 task while your branch's day-1 task is still open.

## If a task is blocked

Add a `## Blocked` section to `docs/task/<TASK-ID>...md` with: what is blocking it, who can
unblock it, and what you already tried. Then move to another task. Do not sit and wait.
