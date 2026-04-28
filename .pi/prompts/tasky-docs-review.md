---
description: Run the final docs review stage for the current Tasky task
---

Use the `tasky-entry` skill and execute stage `docs_review` only.

Review docs and agent-instruction drift for the current task.

Check the smallest matching docs lane, including `pnpm repo:docs:check` and `pnpm repo:docs:claims:audit` when
architecture docs, maintenance docs, or backend module `AGENTS.md` files naming live repo surfaces changed.

Return:

- stale doc findings, if any
- commands run
- whether the task is clear to commit
