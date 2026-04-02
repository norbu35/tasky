# Agent Tooling

This directory contains curated contributor-agent infrastructure for Tasky maintenance mode.

## Contents

- `AGENTS.md`: local agent doctrine and repository conventions
- `agents/`: role-specific agent profiles
- `skills/`: reusable workflow skills for planning, implementation, verification, and review
- `workflows/`: execution playbooks
- `tests/`: validation scripts for agent-tooling integrity

## Rules

- Treat this directory as versioned contributor tooling, not product runtime code.
- Do not store ephemeral local session output here.
- Keep repository-wide automation in `tooling/scripts/` and runtime-service scripts in `services/*/scripts/`.
