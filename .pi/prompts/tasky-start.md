---
description: Start a Tasky task through the canonical stage-driven repo workflow
argument-hint: '<request-or-brief>'
---

Use the `tasky-entry` skill for this Tasky repo task.

Task source:
$@

Start at stage `request` and proceed only through this order:

1. request
2. prd
3. requirement_clarification
4. downstream_docs_update
5. scenario
6. validation
7. test
8. implementation
9. verification
10. docs_review
11. commit

Rules:

- state the current stage and next gate at each checkpoint
- do not skip stages silently
- stop at `requirement_clarification` if ambiguity would make PRD, contract, or scenario handling risky
- stop at `scenario` if no matching scenario exists and you are not explicitly the designated scenario curator
- only mark a stage `n/a` if you give a one-sentence reason
- follow `AGENTS.md`, nearest local `AGENTS.md`, and the `tasky-entry` skill
