# Tasky Design System

This document is derived from `docs/PRD.md`, `docs/STRATEGY.md`, and `docs/BRAND.md`.

## 1. Scope

This design system supports the Phase 1 Ulaanbaatar launch. Product behavior is defined in the PRD.

### Active vs future specs

- Active Phase 1 specs are only screen specs whose `phase` field is `"0-1"`.
- `SCR-P2-*`, `SCR-P3-*`, and `SCR-B2B-*` are always draft / future references.
- `SCR-SHARED-*`, `SCR-CUST-*`, and `SCR-TASK-*` ids are not automatically launch-active; their `phase` field controls authority.

Future-phase specs are reference material only and must not be read as launch commitments.

## 2. Content Fundamentals

- Voice: direct and warm
- Copy model: concept-first bilingual
- English is the technical key / fallback source
- Mongolian copy must be authored to read naturally in Mongolian
- Sentence case by default
- No emoji in UI

### Phase 1 copy constraints

- Operational screens must communicate the service is live in Ulaanbaatar.
- Pricing copy must support both `I have a budget` and `I want quotes`, including quote, counter-offer, and locked booking price states where applicable.
- Do not promise payment hold, payment protection, or escrow.
- Do not imply open-ended pre-booking chat.
- Before confirmation, show only approximate location. Exact address appears only after confirmed booking.

## 3. Product Experience Rules

### 3.1 Posting

- Phase 1 posting uses fixed category templates, not a generic free-form task form.
- Required content: location, preferred date, time window, short title, structured scope fields, optional-but-encouraged photos, pricing mode.

### 3.2 Contact

- No open-ended pre-booking chat.
- Before selection, taskers communicate through the structured application and pricing response only.
- After confirmation, any contact surface must remain platform-mediated and reviewable.

### 3.3 Trust

- Trust banners and explanatory copy may promise verification, booking records, evidence trails, and moderation.
- Trust banners must not promise escrow, held funds, or payment protection in Phase 1.

## 4. Visual Foundations

The existing color, typography, spacing, iconography, and motion foundations remain valid where they do not conflict
with the launch baseline. Derived preview assets and UI kits must keep the same constraint: no Phase 1 payment-protection
promise and no claims that go beyond the launch scope.
