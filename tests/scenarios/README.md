# Test Scenarios

Curator-owned behavioral specifications. Default rule: agents implement these, not rewrite them. Only the designated
scenario curator for the current execution brief may modify this directory.

## Format

Each scenario:

- Has a unique ID: SCN-<DOMAIN>-NNN
- Cites a live canonical PRD requirement ID from `docs/PRD.md`
- Has a risk tier: critical | high | medium | low
- Uses Given/When/Then/And in plain English
- Specifies one observable outcome per Then/And line

## Rules for agents

- @DisplayName must be exactly: "SCN-XXX-NNN: <title>"
- @DisplayName SCN IDs must exist in `tests/scenarios/*.md`; `sync-registry.sh` fails on stale IDs
- Implementation agents must not modify this directory; if no scenario fits, stop and report the gap
- The designated scenario curator may update this directory only during an approved scenario-baseline pass that reconciles `docs/PRD.md`, `docs/STRATEGY.md`, `docs/ROLLOUT_PHASES.md`, active `docs/openapi/**`, and active `docs/design/**`
- Run services/api/scripts/sync-registry.sh after scenario curation or implementing tests
- See `tests/registry.yaml` for the canonical test scenario index
