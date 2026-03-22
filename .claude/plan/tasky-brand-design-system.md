# Implementation Plan: Tasky Brand & Design System Definition

**Date:** 2026-03-21
**Requirement:** Define the branding and design system of the Tasky platform based on insights from the Mongolia Service Marketplace Design System research document.

---

## Task Type
- [x] Frontend / Design System
- [ ] Backend
- [ ] Fullstack

---

## Strategic Context

Tasky already has a functional `packages/design-tokens/` package with Figma-aligned colors, spacing, and typography. The goal is **not** to replace this — it is to:
1. Formalize the brand identity (mission-anchored rationale, voice, logo principles)
2. Document the full design system against research-validated standards
3. Identify and fill structural gaps revealed by the research (Cyrillic typography, cultural motifs, DAN verification badge, motion tokens, dark mode completeness, payment UI tokens)

---

## Technical Solution

Two deliverables:

### A. `docs/BRAND.md` — Brand Identity Document
Formal brand specification: mission, voice/personality, visual identity rationale, cultural motif integration, naming system. This is a **documentation-only** file, no code changes.

### B. `packages/design-tokens/` — Token Enhancements
Fill the 6 gaps identified between research recommendations and current token implementation:
1. Cyrillic typography constraints (line-height, letter-spacing, Ү/Ő glyph requirement note)
2. Motion/animation tokens (duration, easing curves)
3. Dark mode semantic tokens (trust, verified, status-open completeness)
4. Cultural motif tokens (for use in CSS patterns / SVG overlays)
5. Payment UI tokens (QPay/SocialPay contextual colors)
6. DAN verification badge color tier

These changes go into `tokens.ts`, `tokens.css`, and a new `src/motion.ts`.

---

## Implementation Steps

### Step 1 — `docs/BRAND.md`: Brand Identity Document

Create a canonical brand document covering:

**1.1 Brand Mission & Positioning**
- Mission: "Mongolia's trust-first domestic service marketplace — where state-backed identity meets community reputation."
- Positioning: Against Facebook/Unegui (no verification, no recourse). Tasky = reliable, verified, fair.
- Personality pillars: **Trustworthy · Local · Modern · Fair**

**1.2 Brand Voice**
- Tone: Direct, warm, reassuring — never corporate or cold
- Language: Bilingual Mongolian/English; Mongolian Cyrillic is first-class, not an afterthought
- Microcopy examples: success confirmations, error states, empty states, verification prompts

**1.3 Logo Principles**
- Primary mark: Wordmark "Tasky" in Manrope 700, primary-deep (#5300B7)
- Symbol option: Ulzii-inspired interconnected node (symbolizing network + protection)
- Don't use: literal house icons, hammer clip-art, clichéd Mongolian yurts

**1.4 Cultural Motif Integration**
- *Alkhan Khee* (hammer pattern): Use as low-opacity background texture (3–5% opacity, primary/10) in header sections and loading screens. Communicates "continuous reliable service."
- *Ulzii* (endless knot): Geometric abstraction for the DAN Verified badge shape and for trust badge borders. Communicates "interconnectedness and protection."
- Rule: Motifs must be rendered as minimal geometric SVGs, never as decorative illustrations.

**1.5 Photography & Illustration Direction**
- Photography: Real Mongolian urban homes and professional workers. Warm-lit, candid, not staged stock.
- Illustration: Flat geometric with primary-deep + amber palette. No gradients in illustrations — reserve gradients for UI.
- Asset naming convention: `hero-illustration.webp`, `auth-bg.webp`, `category-{slug}.webp`

**1.6 Brand Color Rationale**
- Primary Deep Violet (#5300B7): Trust and authority. Chosen over blue (already saturated by banks) to differentiate while retaining psychological safety.
- Amber (#F59E0B): Warmth, human connection, community trust. Directly counter-programs the sterile fintech palette.
- Emerald Verified (#10B981): Government-grade verification. Clear green = safe, state-backed.
- The palette echoes traditional Mongolian textiles (deep purples, warm amber/gold) without being literal.

---

### Step 2 — `packages/design-tokens/src/motion.ts`: Motion Token File (new)

```typescript
// src/motion.ts
export const motionTokens = {
  duration: {
    instant: 80,       // micro-feedback (button press)
    fast: 150,         // hover state, skeleton reveal
    normal: 250,       // panel transitions, card expand
    slow: 400,         // page transitions, modal open
    skeleton: 1500,    // skeleton pulse loop
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',     // Material standard
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',      // elements entering screen
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',      // elements leaving screen
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',   // playful bounce (FAB, badge pop)
  }
} as const;
```

Reasoning: Skeleton screens are critical for 20.61 Mbps Mongolian mobile speeds. Formalizing motion tokens prevents ad-hoc Framer Motion values from diverging across components.

---

### Step 3 — `packages/design-tokens/tokens.ts`: New Semantic Tokens

Add the following color groups to the existing `designTokens.colors` object:

**3.1 Cyrillic Typography Constraints** (in `src/layout.ts`, not colors)
```typescript
typography: {
  // ...existing sizes...
  lineHeight: {
    tight: 1.3,
    normal: 1.6,    // Cyrillic-optimized: more generous than Latin default 1.5
    loose: 1.8,
  },
  letterSpacing: {
    tight: '-0.01em',
    normal: '0em',
    wide: '0.02em',  // never use wide on Cyrillic body text
  },
  minBodySize: 16,   // strict floor per research; WCAG + Mongolian readability
}
```

**3.2 Payment UI Tokens**
```typescript
// Payment context colors
paymentSurface: { hsl: "152 60% 97%", hex: "#F0FDF4" },   // QPay success surface
paymentBorder: { hsl: "160 59% 45%", hex: "#10B981" },     // QPay confirmed border
paymentEscrow: { hsl: "38 92% 95%", hex: "#FFFBEB" },      // Escrow held surface (amber-tinted)
paymentEscrowForeground: { hsl: "30 100% 20%", hex: "#653E00" }, // Escrow text
```

**3.3 DAN Verification Badge Tiers**
```typescript
// DAN/KHUR state-backed verification tiers
danVerified: { hsl: "160 59% 45%", hex: "#10B981" },      // Full state verification (= verified)
danPending: { hsl: "38 92% 50%", hex: "#F59E0B" },         // Verification in progress (= accent)
danUnverified: { hsl: "0 0% 89%", hex: "#E2E2E2" },        // Unverified (= chip-inactive)
danVerifiedForeground: { hsl: "0 0% 100%", hex: "#FFFFFF" },
```

**3.4 Dark Mode Semantic Completeness** (in `tokens.css` `.dark` block)
Add missing semantic tokens to `.dark`:
```css
.dark {
  /* ...existing... */
  --tasky-color-trust: 30 60% 20%;           /* warm dark amber */
  --tasky-color-trust-foreground: 33 100% 86%;
  --tasky-color-status-open: 152 30% 20%;
  --tasky-color-status-open-foreground: 152 76% 70%;
  --tasky-color-verified: 160 40% 35%;
  --tasky-color-verified-foreground: 160 59% 75%;
}
```

---

### Step 4 — `packages/design-tokens/tokens.css`: CSS Custom Properties Additions

Bridge new tokens to CSS variables (same pattern as existing):
- `--tasky-motion-duration-*` for all motion tokens
- `--tasky-motion-easing-*` for all easing tokens
- `--tasky-color-payment-*` for payment tokens
- `--tasky-color-dan-*` for DAN verification tokens
- `--tasky-typography-line-height-*` and `--tasky-typography-letter-spacing-*`

---

### Step 5 — `apps/web/tailwind.config.ts`: Expose New Tokens to Tailwind

Extend the existing `colors` and add:
- `payment-surface`, `payment-border`, `payment-escrow`, `payment-escrow-fg`
- `dan-verified`, `dan-pending`, `dan-unverified`

Extend `transitionDuration` and `transitionTimingFunction` with motion tokens.

---

### Step 6 — `apps/mobile/src/design/tokenAdapter.ts`: Mobile Sync

Add the new tokens (payment, DAN, motion) to the mobile token adapter to maintain cross-platform parity. Map motion durations to React Native's Animated API timing.

---

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| `docs/BRAND.md` | Create | Canonical brand identity document |
| `packages/design-tokens/src/motion.ts` | Create | Motion duration + easing tokens |
| `packages/design-tokens/tokens.ts` | Modify | Add payment, DAN, Cyrillic typography tokens |
| `packages/design-tokens/tokens.css` | Modify | CSS variables for new tokens + dark mode completeness |
| `packages/design-tokens/src/layout.ts` | Modify | Add lineHeight, letterSpacing, minBodySize |
| `apps/web/tailwind.config.ts` | Modify | Expose payment + DAN tokens as Tailwind classes |
| `apps/mobile/src/design/tokenAdapter.ts` | Modify | Sync new tokens to React Native |

---

## Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| Manrope/Plus Jakarta Sans missing Ү/Ő glyphs | Document in BRAND.md as known risk; add fallback font stack with Roboto (full Cyrillic) as fallback |
| New dark mode tokens conflict with existing space theme | Keep all new dark additions additive; don't modify existing dark background/foreground vars |
| Motion tokens vs. existing Framer Motion ad-hoc values in LandingPage.tsx | Plan only documents tokens; migration of existing components is a follow-up task, not in scope |
| Token file size creep | Group new tokens into separate src/ files (motion.ts already separate); only tokens.ts aggregates |

---

## Out of Scope (This Plan)

- Implementing the Alkhan Khee SVG texture (requires design asset creation, separate task)
- Implementing the Ulzii-based DAN badge SVG (requires design asset creation)
- Updating existing components to use new tokens (separate refactor task)
- QPay/SocialPay integration logic (backend concern)

---

## SESSION_ID
- CODEX_SESSION: N/A (planning performed by Claude Code directly from codebase context)
- GEMINI_SESSION: N/A
