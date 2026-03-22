# Web Personal Flair Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inject personal flair into the web app (LandingPage and AuthPage), eliminating the generic "AI-generated" look. Add high-quality professional imagery and ensure all wirings (buttons/links) to `/auth` are intact.

**Spec:** `docs/superpowers/specs/2026-03-21-web-personal-flair-redesign-design.md`

---

## File Map

**Images (create/generate):**
- `apps/web/public/images/hero-illustration.webp`
- `apps/web/public/images/auth-bg.webp`

**Pages (modify):**
- `apps/web/src/app/pages/LandingPage.tsx`
- `apps/web/src/app/pages/AuthPage.tsx`

---

### Task 1: Generate & Place Images

**Files:**
- Create: `apps/web/public/images/hero-illustration.webp`
- Create: `apps/web/public/images/auth-bg.webp`

- [ ] **Step 1: Generate Hero Illustration**
Use image generation tools to create a professional vector or rich illustration of diverse people interacting in a domestic service context. Place it in `/images/`.

- [ ] **Step 2: Generate Auth Background**
Generate a warm, high-quality, abstract or photographic backdrop that exudes trust and professionalism. Place it in `/images/`.

- [ ] **Step 3: Commit**
```bash
git add apps/web/public/images
git commit -m "feat(web): add professional illustration and background assets"
```

---

### Task 2: Redesign LandingPage

**Files:**
- Modify: `apps/web/src/app/pages/LandingPage.tsx`

- [ ] **Step 1: Replace Hero Area**
Instead of the `bg-primary/5 rounded-full blur-3xl`, integrate an asymmetric `<img src="/images/hero-illustration.webp" />` element prominently on the right side of the hero section on desktop, while text sits on the left.

- [ ] **Step 2: Redesign How it Works**
Update the 2-column list to overlapping cards or a zig-zag alternating layout to give it a more bespoke, designed feel.

- [ ] **Step 3: Verify Wirings**
Confirm `onClick={() => navigate("/auth")}` is explicitly present on all primary CTAs ("Get Started", "Post a Task Now", "Join Tasky Today").

- [ ] **Step 4: Commit**
```bash
git add apps/web/src/app/pages/LandingPage.tsx
git commit -m "feat(web): redesign LandingPage with personal flair and custom hero image"
```

---

### Task 3: Redesign AuthPage

**Files:**
- Modify: `apps/web/src/app/pages/AuthPage.tsx`

- [ ] **Step 1: Update Left Pane Background**
Replace the solid `bg-primary` left pane with the `auth-bg.webp` image, utilizing `object-cover` and an overlay to preserve readability of the text over it.

- [ ] **Step 2: Enhance Typography and Card**
Polish the right-side Card layout to feel more editorial, ensuring it looks extremely premium and not like a generic template.

- [ ] **Step 3: Verify Login Wiring**
Confirm that `handleFacebookLogin` and `handleDevLogin` correctly initialize and navigate to `returnPath`.

- [ ] **Step 4: Verify build**
Run: `cd apps/web && npx vite build`

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/app/pages/AuthPage.tsx
git commit -m "feat(web): redesign AuthPage with premium imagery backdrop"
```
