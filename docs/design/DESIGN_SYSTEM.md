# Tasky Design System

This document is derived from `docs/PRD.md`, `docs/STRATEGY.md`, and `docs/BRAND.md`.

## 1. Scope

This design system supports the active Phase 1 Ulaanbaatar launch.
Product behavior is defined in the PRD.

### Active design boundary

- `docs/design/**` is the active design surface for the current phase.
- This directory is the canonical design-system documentation surface. Keep design references, component contracts,
  screen specs, journeys, and lifecycle maps here.
- `packages/design-tokens` is the runtime implementation package derived from this surface. It should contain code and
  package metadata only, not duplicate design documentation or preview artifacts.
- Static UI-kit prototypes and YAML-only token additions are not active design-system sources. Promote their intent into
  this prose contract and `@tasky/design-tokens`, then remove the static handoff files from the active docs path.
- Only screen specs with `phase: "0-1"` remain in the live design path.
- Deferred-phase design drafts have been removed from the active path so launch UX can be checked directly against the current product baseline.
- Historical future drafts, if needed, belong under `archive/design-future/**` and are not authoritative.
- A screen spec may return from `archive/design-future/screen-specs/**` to `docs/design/screen-specs/**` only when
  the governing product and rollout documents activate that phase. Reactivation must update the affected design
  contracts, copy, verification, monitoring, and rollback guidance in the same workflow.

## 2. Content fundamentals

- Voice: direct and warm
- Copy model: concept-first bilingual
- English is the technical key / fallback source
- Mongolian copy must be authored to read naturally in Mongolian
- Sentence case by default
- No emoji in UI

### Phase 1 copy constraints

- Operational screens must communicate that the service is live across Ulaanbaatar.
- Pricing copy must support both `I have a budget` and `I want quotes`, including posted-budget acceptance, quote, and locked booking price states where applicable.
- Do not promise payment hold, payment protection, wallet protection, or escrow.
- Do not imply open-ended pre-booking chat.
- Before confirmation, show only approximate location. Exact address appears only after confirmed booking.

## 3. Product experience rules

### 3.1 Posting

- Phase 1 posting uses fixed category templates, not a generic free-form task form.
- Required content: location, preferred date, time window, short title, structured scope fields, optional-but-encouraged photos, pricing mode.

### 3.2 Contact

- No open-ended pre-booking chat.
- Before selection, taskers communicate through the structured application and pricing response only.
- After confirmation, any contact surface must remain platform-mediated and reviewable.

### 3.3 Trust

- Trust banners and explanatory copy may promise verification, booking records, evidence trails, and moderation.
- Trust banners must not promise escrow, held funds, payout protection, or payment protection in Phase 1.

## 4. Visual foundations

The existing color, typography, spacing, iconography, and motion foundations remain valid where they do not conflict with the launch baseline. Derived preview assets and UI kits must keep the same constraint: no claims beyond the active launch scope.

Runtime consumers must import code through `@tasky/design-tokens`; app code must not import from `docs/design/**`.

The active runtime token graph includes:

- primitive and semantic color, spacing, radius, typography, shadow, and motion tokens
- interaction states for pressed, focus, disabled, and hover behavior
- branded overlays/scrims derived from the primary-deep color
- icon size and touch-target tokens
- elevation/z-index layers for sticky, dropdown, sheet, modal, toast, and system overlays
- composed typography variants with zero letter spacing for Cyrillic readability
- density presets that change spacing without shrinking text
- animation presets derived from the canonical motion duration/easing tokens
- opacity color steps for tint, border, and state variations
- content rules for Mongolian Cyrillic sizing, truncation, currency, and dates

Web consumes those tokens through Tailwind/theme variables and `@tasky/design-tokens/tokens.css`. Mobile consumes the
same graph through `nativeTokens`, NativeWind configuration, and native shell/primitive adapters.
