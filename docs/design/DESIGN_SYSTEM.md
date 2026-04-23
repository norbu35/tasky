# Tasky Design System

This document is derived from `docs/PRD.md`, `docs/STRATEGY.md`, and `docs/BRAND.md`.

## 1. Scope

This design system supports the active Phase 1 Ulaanbaatar launch.
Product behavior is defined in the PRD.

### Active design boundary

- `docs/design/**` is the active design surface for the current phase.
- Only screen specs with `phase: "0-1"` remain in the live design path.
- Deferred-phase design drafts have been removed from the active path so launch UX can be checked directly against the current product baseline.
- Historical future drafts, if needed, belong under `archive/**` and are not authoritative.

## 2. Content fundamentals

- Voice: direct and warm
- Copy model: concept-first bilingual
- English is the technical key / fallback source
- Mongolian copy must be authored to read naturally in Mongolian
- Sentence case by default
- No emoji in UI

### Phase 1 copy constraints

- Operational screens must communicate that the service is live across Ulaanbaatar.
- Pricing copy must support both `I have a budget` and `I want quotes`, including quote, counter-offer, and locked booking price states where applicable.
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
