# Web App Personal Flair Redesign Design

**Date:** 2026-03-21
**Status:** Under Review
**Scope:** Inject personal flair, professional imagery, and ensure robust wirings in the web application's Landing and Auth pages.

## Context

The web app currently relies heavily on CSS gradients and generic structural layouts. To establish stronger user trust and avoid looking like a "generic AI-generated page," we need to seamlessly integrate custom imagery, asymmetrical but balanced layouts, and a distinct, premium personality.

## Decisions

- **Visual Direction:** Move away from purely CSS-shape-based backgrounds (like huge blurred circles) toward genuine, rich imagery (illustrations or photography) combined with our "Tasky" branding (primary-deep, amber trust system).
- **Imagery:** Introduce 3 core assets:
  - `hero-illustration.webp`: Used on the Landing Page hero section.
  - `auth-bg.webp`: Used as the backdrop for the AuthPage's left pane.
- **Layout Flourishes:**
  - Shift "How it Works" from a standard 2-column list to a subtle overlapping card or zig-zag pattern.
  - Enhance the Auth Page left pane to feel like an editorial magazine cover rather than a generic SaaS login.
- **Wiring Validation:** Ensure every CTA on the Landing Page properly funnels to `/auth` (or deep links securely).

## Asset Requirements

We will explicitly generate/add the following images to `apps/web/public/images/`:
1. `hero-illustration.webp`
2. `auth-bg.webp`

## Architectural Constraints

- Do not alter `apiClient.ts` or any backend routing.
- Keep `shadcn/ui` components intact; rely on composition and `img` tags to inject the new assets.
- Ensure accessibility: all images must have descriptive `alt` tags.
