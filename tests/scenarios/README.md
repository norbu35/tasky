# Test Scenarios

Human-authored behavioral specifications. Agents implement these — never modify them.

## Format

Each scenario:

- Has a unique ID: SCN-<DOMAIN>-NNN
- Cites a PRD requirement
- Has a risk tier: critical | high | medium | low
- Uses Given/When/Then/And in plain English
- Specifies one observable outcome per Then/And line

## Rules for agents

- @DisplayName must be exactly: "SCN-XXX-NNN: <title>"
- Do not modify this directory
- Run services/api/scripts/sync-registry.sh after implementing tests
- See `tests/registry.yaml` for the canonical test scenario index
