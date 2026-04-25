# coverage Scenarios

<!-- Scenarios authored here. See tests/scenarios/README.md for format. -->

## SCN-COVER-001

**Risk:** High
**PRD:** REQ-P1-COVER-01, REQ-P1-COVER-06
**Title:** Launch surfaces present Tasky as live across Ulaanbaatar

Given public launch, onboarding, and task-post entry surfaces are rendered for Phase 1
When user-visible availability copy is inspected
Then the copy identifies Ulaanbaatar as the launch geography
And task posting is presented as available citywide within Ulaanbaatar
And no narrower pilot district or unsupported geography is presented as live scope
