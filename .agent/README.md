# `.agent/` — one source of truth for every agent

Every AI tool has its own convention: Claude Code reads `CLAUDE.md`, Codex reads `AGENTS.md`,
Cursor reads `.cursor/rules/*.mdc`, Copilot reads `.github/copilot-instructions.md`.

Maintaining four parallel copies is a reliable way to have them disagree within three days.

This repo inverts that: **the content lives here, and everything out there is a three-line shim
pointing in.**

```
.agent/AGENTS.md   ←── CLAUDE.md
                   ←── AGENTS.md            (repo root)
                   ←── .cursor/rules/memoir-canvas.mdc
                   ←── .github/copilot-instructions.md
```

Changing guidance for agents means changing it in `.agent/`. Leave the shims alone.

---

## What is in here

```
.agent/
├── AGENTS.md              # the working contract — read first
├── index.json             # machine-readable map, for agents that navigate themselves
├── rules/
│   ├── invariants.md      # R1–R5 in full, with violation examples
│   ├── code-style.md      # TypeScript, SQL and React conventions
│   ├── definition-of-done.md
│   └── commit-and-pr.md
├── context/
│   ├── project.md         # what the project is, in 40 lines
│   ├── glossary.md        # claim / evidence / conflict / the certainty ladder
│   ├── stack.md           # tech, versions, commands
│   └── constraints.md     # deadline, in-app browser, no backend
├── workflows/
│   ├── pick-a-task.md
│   ├── implement-a-task.md
│   ├── write-evidence.md
│   └── review-checklist.md
└── commands/              # reusable prompts, tool-agnostic
    ├── task-start.md
    ├── task-finish.md
    └── arch-review.md
```

## How to use `commands/`

These are not any one tool's slash commands — they are written-out prompts:

- **Claude Code**: paste the contents into chat, or `cp .agent/commands/*.md .claude/commands/`
- **Codex / Cursor / anything else**: paste the contents, replacing `<TASK-ID>` with a real id

They live here so the whole team runs the same prompt instead of each inventing their own.

## What `index.json` is for

A machine-readable map of the repo: where things are, who owns them, which files are frozen.
An agent that wants to navigate on its own should read that first rather than `ls -R` the
whole tree.
