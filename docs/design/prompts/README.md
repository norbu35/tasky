# Tasky Design Prompt System

Context-managed prompt generation system for producing Stitch AI design screens from the Tasky design spec.

## Architecture: 3-Tier Context Model

```
┌─────────────────────────────────────────┐
│  Tier 1: GLOBAL CONTEXT                 │  Shared across ALL prompts
│  global-context.yaml (~140 lines)       │  Brand, tokens, components, rules
├─────────────────────────────────────────┤
│  Tier 2: JOURNEY CONTEXT                │  Shared across screens in a flow
│  journeys/JRN-*.yaml (~24 files)        │  Navigation, sequence, role
├─────────────────────────────────────────┤
│  Tier 3: SCREEN PROMPTS                 │  Per-screen generation prompt
│  screens/SCR-*.yaml (81 files)          │  Layout, components, states, copy
└─────────────────────────────────────────┘
```

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
3. **customer** — Task posting → applicants → bookings → disputes (27 screens)
4. **tasker** — Browse → verify → apply → manage jobs (18 screens)
5. **phase_2** — Credits, payments, referrals (5 screens)
6. **phase_3** — Wallet, escrow, subscription, instant match (5 screens)

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
| `journeys/JRN-*.yaml` | 24 | Per-journey flow context |
| `screens/SCR-*.yaml` | 81 | Per-screen Stitch prompts |
| `prompt-manifest.yaml` | 1 | Master index with generation order |

## Regenerating Prompts

If screen specs change, re-run the generation script:

```bash
node scripts/generate-prompts.js
```

This reads `docs/design/screen-specs/SCR-*.yaml` + `journey-catalog.yaml` + `screen-inventory.yaml` and regenerates all prompt files.
