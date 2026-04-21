# Tasky Agent Tooling Contract

Use this file only when editing `tooling/agent/**`.

## Scope

This subtree contains contributor-agent assets: skills, workflows, profiles, and local validation scripts. It is not product runtime code and it is not part of the main repo discovery path unless you are editing this subtree.

## Read Next

- `tooling/agent/README.md`

## Rules

- Keep this subtree reusable and versioned.
- Do not store session-local artifacts or ephemeral task trackers here.
- Do not assume a plans directory exists in the target repo.
- When a skill needs a task source, refer to the active issue, ticket, or execution brief instead of a hard-coded plan path.
- Keep tooling references local to this subtree when possible.
- Validation for this subtree belongs in `tooling/agent/tests/`.

## Validation

```bash
bash tooling/agent/tests/run-tests.sh
bash tooling/agent/tests/check-antigravity-profile.sh
```
