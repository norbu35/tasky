# Tasky Pi Setup

Project-local `pi` resources for the Tasky autonomous workflow.

## Commands

- `/tasky-start <request-or-brief>`
- `/tasky-next`
- `/tasky-verify`
- `/tasky-docs-review`
- `/tasky-commit <type(scope): summary>`
- `/skill:tasky-entry <request-or-brief>`

## Canonical stage flow

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

Use `pi` from the repo root so project-local context, prompts, and skills load automatically.

Repo-owned skills still live under `tooling/skills/**`; this `.pi/` tree only adds a project-local entry skill and
prompt-template shortcuts.
