# Tasky Design Prompt System

Context-managed prompt generation system for producing Stitch AI design screens from the Tasky design spec.

## Architecture: 3-Tier Context Model

```
┌─────────────────────────────────────────┐
│  Tier 1: GLOBAL CONTEXT                 │  Shared across ALL prompts
│  global-context.yaml (~140 lines)       │  Brand, tokens, components, rules
├─────────────────────────────────────────┤
│  Tier 2: JOURNEY CONTEXT                │  Shared across screens in a flow
│  journeys/JRN-*.yaml (~30 files)        │  Navigation, sequence, role
├─────────────────────────────────────────┤
│  Tier 3: SCREEN PROMPTS                 │  Per-screen generation prompt
│  screens/SCR-*.yaml (91 files)          │  Layout, components, states, copy
└─────────────────────────────────────────┘
```

## Current Scope Boundary

The current prompt pack covers the **91-screen mobile marketplace pack through Phase 3**:

- 66 Phase `0-1` screens
- 18 Phase `2` screens
- 7 Phase `3+` screens

This pack now includes AI Profile Polish, promoted/urgent boost checkout, business-account management, account-scoped posting/views, and B2B billing through Phase 3. It is still not the full PRD mobile roadmap.

Not yet represented as screen prompt artifacts:

- Phase 4 Tasky Plus customer subscription surfaces
- Phase 4 Family Plan customer subscription surfaces, including favorites and household service history

State authority is intentionally split:

- `screen-inventory.yaml` is the summary screen list and generation-order input
- `state-matrix.yaml` is the coverage matrix
- `screen-specs/SCR-*.yaml` is the exhaustive source for per-screen states and acceptance criteria

Build-readiness is also phase-gated: `docs/API.yaml` currently marks `credits`, `referrals`, `subscription`, `instant-match`, and `/verification/dan/verify` as forward-reference endpoints, and the newly documented boost / AI polish / expanded B2B surfaces are still ahead of the canonical API contract. Wallet/payment flows are implemented but feature-gated.

## How to Use with Stitch

### Single Screen Generation

Each screen YAML has a `stitch_prompt` field — a self-contained text prompt ready for `generate_screen_from_text`:

```yaml
# Read the prompt from the YAML
stitch_prompt: |
  Design a mobile app screen for "My Tasks — Task List"...
```

For richer context, prepend the global context summary before the screen prompt.

### Per-State Generation

Each screen also has `state_prompts` — one prompt per visual state:

```yaml
state_prompts:
  - state_id: loading_initial
    prompt: |
      Generate the "loading_initial" state of "My Tasks — Task List"...
  - state_id: empty_activation
    prompt: |
      Generate the "empty_activation" state...
```

### Batch Generation (Recommended Order)

Generate screens by group for visual consistency within each flow:

1. **shared** — Auth, onboarding, profile, inbox (21 screens)
2. **infrastructure** — Error, offline, update, legal (5 screens)
3. **customer** — Task posting → applicants → bookings → disputes → boost checkout (29 screens)
4. **tasker** — Browse → verify → apply → manage jobs → AI polish (19 screens)
5. **b2b** — Business accounts, account-scoped posting, tasks, and billing (7 screens)
6. **phase_2** — Credits, payments, referrals (5 screens)
7. **phase_3** — Wallet, escrow, subscription, instant match (5 screens)

Within each group, generate in the order listed in `prompt-manifest.yaml`.

### Journey Context for Flow Consistency

When generating screens that belong to a journey, include the journey context file for navigation continuity:

```
Global Context + Journey Context + Screen Prompt = Full Stitch Prompt
```

The `context_refs` field in each screen YAML lists which files to compose.

## File Reference

| Path | Count | Description |
|------|-------|-------------|
| `global-context.yaml` | 1 | Brand, tokens, component vocabulary |
| `journeys/JRN-*.yaml` | 30 | Per-journey flow context |
| `screens/SCR-*.yaml` | 91 | Per-screen Stitch prompts |
| `prompt-manifest.yaml` | 1 | Master index with generation order |

## Regenerating Prompts

If screen specs change, re-run the generation script:

```bash
node scripts/generate-prompts.js
```

This reads `docs/design/screen-specs/SCR-*.yaml` + `journey-catalog.yaml` + `screen-inventory.yaml` and regenerates all prompt files.
