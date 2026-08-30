# Documentation

Start at [`_arch_map.md`](_arch_map.md) — it tells you which file holds what, so you can jump
straight there instead of reading the whole directory.

| Read this | When you want to |
|---|---|
| [`_arch_map.md`](_arch_map.md) | find where something lives |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | understand the five layers and R1–R5 |
| [`API_SCHEMA.md`](API_SCHEMA.md) | call or change a WebMCP tool |
| [`USER_GUIDE.md`](USER_GUIDE.md) | use the app as an end user |
| [`requirements/`](requirements/README.md) | know **why** it was designed this way |
| [`task/`](task/README.md) | pick up work, check progress |
| [`implement/`](implement/README.md) | close a task and record evidence |
| [`technical/`](technical/) | go deep on one layer |

Agents read [`.agent/AGENTS.md`](../.agent/AGENTS.md) first, not this directory.

## Three periodic reviews

| File | When to run it |
|---|---|
| [`_arch_review.md`](_arch_review.md) | end of day 2, 4, 5 |
| [`_harness_review.md`](_harness_review.md) | end of day 3 |
| [`_homogeneity_blackbox_review.md`](_homogeneity_blackbox_review.md) | end of day 4 |

## Conventions

- English throughout. Product content is bilingual (`*_vi` / `*_en`) by design.
- One task = one `task/TASK-NNN-*.md` = one `implement/IMPL-TASK-NNN.md`.
- Adding or removing a file under `src/` means updating `_arch_map.md` **in the same PR**.
