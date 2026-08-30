# Commits and pull requests

## Commit messages

```
<type>(<scope>): <short imperative summary>

<body if needed — explain WHY, not what>

Refs: TASK-012
```

`type`: `feat` `fix` `refactor` `test` `docs` `chore`
`scope`: `domain` `mcp` `store` `view` `panels` `seed` `docs` `build`

```
feat(mcp): register resolve_claim only while a conflict is open

The registry is a pure function of uiState (R4). Previously the tool was always
exposed, so an agent could settle a conflict the user could not even see.

Refs: TASK-013
```

## Pull requests

**One task, one PR.** Title: `TASK-012: <task name>`.

The description needs exactly four things:
1. A link to `docs/task/<TASK-ID>-*.md`
2. A link to `docs/implement/IMPL-<TASK-ID>.md`
3. Which of R1–R5 it touches, and how they were kept
4. Whether it touches a frozen file (`schema.sql`, `descriptors.ts`) — if so, **@ the team**

## Do not merge when

- `npm run typecheck` or `npm test` is red
- The IMPL doc is missing
- It touches a frozen file and nobody has acknowledged it
- The PR contains more than one task
