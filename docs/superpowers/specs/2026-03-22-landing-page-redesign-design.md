# Landing Page Redesign — "Dark Hero, Live Feed"

**Date:** 2026-03-22
**Status:** Approved
**Palette:** Steppe Diffusion (primary=#163838, secondary=#89752A, accent=#A93700, trust=#3F53A2, verified=#3B9B7A, bg=#FAFAF5)

---

## Overview

Redesign the landing page hero from a stock-image-dependent light layout to a dark teal hero with animated sample task cards. Below the fold remains cream. All 4 existing sections are kept but restyled to match the new editorial direction.

## File Changed

`apps/web/src/app/pages/LandingPage.tsx` (single file — all sections are inline)

---

## Hero Section

**Background:** Full-width, full-viewport-height. Gradient `from-primary-deep via-primary to-primary-deep`. No background image — the product IS the visual.

**Header:** Overlays the hero. Transparent background with `backdrop-blur-md`. White logo text, terracotta "Get Started" button. Language switcher stays.

**Layout:** Two-column on desktop (stacked on mobile).

**Left column:**
- Uppercase label: "Trusted by 10,000+ in Ulaanbaatar" in `text-accent` (terracotta)
- Headline: Large bold text, `text-primary-foreground` (cream). Short, punchy: "Trusted help, fixed price." or equivalent. No gradient text effect — solid cream on teal is enough.
- Subtitle: 1-2 lines, `text-primary-foreground/70`
- Two buttons: Terracotta fill CTA ("Post a Task →"), ghost outline secondary ("Become a Tasker")

**Right column — animated task card stack:**
- Pool of 8 sample tasks (hardcoded data array in the component)
- 3 cards visible at once, stacked vertically
- Every ~4 seconds, the top card exits (framer-motion `AnimatePresence`, slide-up + fade-out) and a new card enters at the bottom (slide-up + fade-in)
- Card design: glass-morphism border (`border border-white/10 bg-white/5 backdrop-blur-sm`), rounded-xl
  - Left: colored category dot (cleaning=accent, repair=secondary, moving=trust, etc.)
  - Center: task title (bold, white), price + district (small, white/60)
  - Right: "Verified" badge in sage emerald (`bg-verified text-white`)
- On mobile: cards stack below the headline, narrower, 2 visible

**Sample task data shape:**
```ts
interface SampleTask {
  title: string;
  price: string;
  district: string;
  category: 'cleaning' | 'repair' | 'moving' | 'electric' | 'childcare';
}
```

8 tasks covering all categories, with realistic Mongolian district names (Bayangol, Sukhbaatar, Chingeltei, Khan-Uul, Songinokhairkhan, Bayanzurkh) and realistic tugrik prices.

---

## Transition

Hard cut from dark hero to cream background. No gradient blend. `bg-background` starts immediately.

---

## Section 1: Featured Services (kept, restyled)

- Bento grid layout preserved
- Cards without images: use solid `bg-primary` or `bg-accent` fills with icon + text (no placeholder images)
- Cards with images: keep existing gradient overlay treatment
- Remove any blurred background blobs from this section

---

## Section 2: How It Works (kept, cleaned)

- Two-column customer/tasker cards preserved
- Remove all floating decorative dots and blur blobs (the bouncing accent dot, the rotated primary square, etc.)
- Keep the numbered step layout, ComparisonVisuals, and framer-motion scroll animations
- Clean borders, no flair elements

---

## Section 3: Trust & Safety (kept, cleaned)

- 3-icon grid preserved (BadgeCheck, Banknote, Star)
- Remove the two large `blur-3xl` decorative blobs behind the section
- Add a subtle `border-t border-accent/20` at the top for visual separation
- Keep the "Join the Trusted Network" CTA button

---

## Section 4: App Download (kept, simplified)

- Dark `bg-primary-deep` banner preserved
- Remove the fake phone mockup div (the gray placeholder blocks)
- Left side: headline + description + store buttons (same as current)
- The section becomes a clean text + buttons layout without the mockup column
- Keep the blurred primary glow in the background for depth

---

## Footer

No changes.

---

## What Gets Removed

- Hero background image (`/images/hero-illustration.png` reference)
- Hero gradient text effect (`bg-clip-text bg-gradient-to-r`)
- Hero image frame (rotated border, shadow)
- Floating decorative dots/blobs in How It Works and Trust sections
- Phone mockup placeholder in App Download section
- `bg-accent/5` and `bg-secondary/5` hero background blobs (replaced by the dark hero)

## What Gets Added

- `SampleTask` data array (8 items)
- Animated card rotation component using `AnimatePresence` + `useEffect` timer
- Dark hero section with two-column layout
- Glass-morphism task card styling

## Dependencies

- `framer-motion` (already installed)
- No new packages needed
