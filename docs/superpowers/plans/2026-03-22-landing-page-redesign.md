# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the landing page hero to a dark teal section with animated rotating sample task cards, and clean up the below-the-fold sections.

**Architecture:** Single-file change to `LandingPage.tsx`. Extract the animated task card rotation into a local component within the same file. Sample task data as a const array at the top. All existing sections kept, decorative clutter removed.

**Tech Stack:** React, Tailwind CSS, framer-motion (AnimatePresence), react-i18next, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-22-landing-page-redesign-design.md`

---

### Task 1: Add sample task data and category color map

**Files:**
- Modify: `apps/web/src/app/pages/LandingPage.tsx:1-8` (add data before component)

- [ ] **Step 1: Add the SampleTask type and data array after imports**

```tsx
// Add after the existing imports, before the LandingPage component

interface SampleTask {
  title: string;
  price: string;
  district: string;
  category: "cleaning" | "repair" | "moving" | "electric" | "childcare";
}

const CATEGORY_COLORS: Record<SampleTask["category"], string> = {
  cleaning: "bg-accent",       // terracotta
  repair: "bg-secondary",      // golden olive
  moving: "bg-trust",          // indigo
  electric: "bg-primary",      // teal
  childcare: "bg-verified",    // sage emerald
};

const SAMPLE_TASKS: SampleTask[] = [
  { title: "Deep clean 2-bedroom apartment", price: "₮65,000", district: "Bayangol", category: "cleaning" },
  { title: "Fix bathroom pipe leak", price: "₮40,000", district: "Sukhbaatar", category: "repair" },
  { title: "Move studio to 1-bedroom", price: "₮85,000", district: "Chingeltei", category: "moving" },
  { title: "Install ceiling light fixtures", price: "₮30,000", district: "Khan-Uul", category: "electric" },
  { title: "Weekly apartment cleaning", price: "₮45,000", district: "Bayanzurkh", category: "cleaning" },
  { title: "Assemble IKEA furniture", price: "₮25,000", district: "Sukhbaatar", category: "repair" },
  { title: "Move office — 3 rooms", price: "₮120,000", district: "Songinokhairkhan", category: "moving" },
  { title: "Babysitter for 2 children (4hrs)", price: "₮35,000", district: "Khan-Uul", category: "childcare" },
];
```

- [ ] **Step 2: Add `useState` and `useEffect` to imports**

Add `useState, useEffect, useCallback` to the React import (if not already present), and add `AnimatePresence` to the framer-motion import:

```tsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
```

- [ ] **Step 3: Verify file saves without syntax errors**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/pages/LandingPage.tsx
git commit -m "feat(landing): add sample task data for animated hero cards"
```

---

### Task 2: Build the AnimatedTaskFeed component

**Files:**
- Modify: `apps/web/src/app/pages/LandingPage.tsx` (add component before LandingPage function)

- [ ] **Step 1: Add the AnimatedTaskFeed component**

Insert this component between the `SAMPLE_TASKS` array and the `LandingPage` function:

```tsx
function AnimatedTaskFeed() {
  const [visibleStart, setVisibleStart] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleStart((prev) => (prev + 1) % SAMPLE_TASKS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Get 3 visible tasks, wrapping around the array
  const visibleTasks = Array.from({ length: 3 }, (_, i) => {
    const index = (visibleStart + i) % SAMPLE_TASKS.length;
    return { ...SAMPLE_TASKS[index], index };
  });

  return (
    <div className="space-y-3 w-full">
      <AnimatePresence mode="popLayout">
        {visibleTasks.map((task) => (
          <motion.div
            key={`${task.title}-${task.index}`}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-4"
          >
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${CATEGORY_COLORS[task.category]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{task.title}</p>
              <p className="text-xs text-white/50">{task.price} · {task.district}</p>
            </div>
            <span className="text-[10px] font-bold bg-verified text-white px-2 py-1 rounded flex-shrink-0">
              Verified
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/pages/LandingPage.tsx
git commit -m "feat(landing): add AnimatedTaskFeed component with rotating cards"
```

---

### Task 3: Replace the hero section with dark teal + task feed

**Files:**
- Modify: `apps/web/src/app/pages/LandingPage.tsx:14-91` (header + hero section)

- [ ] **Step 1: Replace the header**

Replace lines 14-32 (the `<div>` wrapper opening and `<header>`) with:

```tsx
    <div className="min-h-screen font-sans selection:bg-accent/20">
      {/* Header — transparent over dark hero */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-accent" />
            <span className="text-2xl font-display font-bold tracking-tight text-primary-foreground">Tasky</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="ghost" className="hidden sm:inline-flex font-semibold text-primary-foreground/70 hover:text-primary-foreground" onClick={() => navigate("/auth")}>
              {t("auth.login", "Login")}
            </Button>
            <Button className="font-semibold bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/auth")}>
              {t("landing.getStarted", "Get Started")}
            </Button>
          </div>
        </div>
      </header>
```

- [ ] **Step 2: Replace the hero section**

Replace lines 34-91 (the `<main>` opening and hero `<section>`) with:

```tsx
      <main className="pb-20">
        {/* Hero Section — Dark Teal */}
        <section className="relative min-h-screen flex items-center bg-gradient-to-br from-primary-deep via-primary to-primary-deep overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 py-32 lg:py-0 w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-accent font-semibold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>{t("landing.trustedBy", "Trusted by 10,000+ users in Mongolia")}</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.05] text-primary-foreground">
                {t("landing.heroTitle1", "Trusted help,")}<br />
                {t("landing.heroTitle2", "fixed price.")}
              </h1>

              <p className="text-lg text-primary-foreground/60 max-w-lg mx-auto lg:mx-0">
                {t("landing.heroSubtitle", "ID-verified workers. Upfront budgets. Dispute protection built in.")}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl shadow-accent/20" onClick={() => navigate("/auth")}>
                  {t("landing.postTaskBtn", "Post a Task")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="ghost" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold text-primary-foreground/80 border border-white/20 hover:bg-white/5 hover:text-primary-foreground" onClick={() => navigate("/auth")}>
                  {t("landing.becomeTaskerBtn", "Become a Tasker")}
                </Button>
              </div>
            </motion.div>

            {/* Right — Animated Task Feed */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="hidden lg:block"
            >
              <AnimatedTaskFeed />
            </motion.div>
          </div>
        </section>
```

- [ ] **Step 3: Add mobile task feed below hero headline (visible only on small screens)**

After the buttons `<div>` in the hero left column but before the closing `</motion.div>`, add:

```tsx
              {/* Mobile task feed */}
              <div className="lg:hidden pt-8">
                <AnimatedTaskFeed />
              </div>
```

- [ ] **Step 4: Verify no type errors**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/pages/LandingPage.tsx
git commit -m "feat(landing): dark teal hero with animated task feed"
```

---

### Task 4: Clean up How It Works section — remove decorative clutter

**Files:**
- Modify: `apps/web/src/app/pages/LandingPage.tsx` (How It Works section)

- [ ] **Step 1: Remove floating decorative elements**

Find and delete these three elements from the How It Works section title area:

```tsx
// DELETE this bouncing dot:
<div className="absolute md:-top-8 md:right-[20%] w-8 h-8 rounded-full bg-trust/20 blur-sm animate-bounce" style={{ animationDuration: '3s' }} />

// DELETE this rotated square:
<div className="absolute -bottom-8 md:left-[20%] w-4 h-4 rounded-sm bg-primary/20 rotate-45" />

// DELETE this accent dot on the heading:
<div className="absolute -right-6 -top-2 w-3 h-3 rounded-full bg-accent" />
```

Also remove `relative` from the title container div (line 168) since no absolute children remain, and remove `relative inline-block` from the h2 (line 171) — change to just default.

- [ ] **Step 2: Verify renders cleanly**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/pages/LandingPage.tsx
git commit -m "refactor(landing): remove decorative blobs from How It Works"
```

---

### Task 5: Clean up Trust & Safety section — remove blobs, add border accent

**Files:**
- Modify: `apps/web/src/app/pages/LandingPage.tsx` (Trust & Safety section)

- [ ] **Step 1: Remove decorative blobs and glow elements**

Find the Trust & Safety `<section>` and make these changes:

1. Delete the two blur blobs:
```tsx
// DELETE:
<div className="absolute top-20 left-10 w-48 h-48 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
<div className="absolute bottom-20 right-10 w-64 h-64 bg-primary/5 rounded-[3rem] rotate-12 blur-3xl pointer-events-none" />
```

2. Delete the glow elements around the ShieldCheck icon:
```tsx
// DELETE:
<div className="absolute top-2 left-1/2 -translate-x-4 w-12 h-12 bg-trust/20 rounded-full blur-md" />
<div className="absolute -bottom-2 -right-4 w-4 h-4 bg-primary/30 rounded-full" />
```

3. Change the `<div className="relative inline-block">` wrapper to just `<div>` (no positioning needed).

4. Update the section opening tag — remove `relative overflow-hidden` and add the accent top border:
```tsx
<section className="px-6 py-24 bg-card border-t border-accent/20">
```

- [ ] **Step 2: Verify no type errors**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/pages/LandingPage.tsx
git commit -m "refactor(landing): clean Trust section, add accent border"
```

---

### Task 6: Simplify App Download section — remove phone mockup

**Files:**
- Modify: `apps/web/src/app/pages/LandingPage.tsx` (App Download section)

- [ ] **Step 1: Remove the phone mockup column**

Find the App Download section. Delete the entire mockup `<div>` (the block starting with `<div className="relative z-10 w-full max-w-[280px] hidden md:block">` through its closing `</div>`).

- [ ] **Step 2: Update the container layout**

Change the container from flex row to centered:

```tsx
// Change this:
<div className="max-w-5xl mx-auto bg-primary-deep text-primary-foreground rounded-[2.5rem] p-10 sm:p-16 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12">

// To this:
<div className="max-w-5xl mx-auto bg-primary-deep text-primary-foreground rounded-[2.5rem] p-10 sm:p-16 relative overflow-hidden shadow-2xl">
```

- [ ] **Step 3: Center the text content**

Update the text container — remove `flex-1` and center on all sizes:

```tsx
// Change this:
<div className="relative z-10 text-center md:text-left flex-1 space-y-6">

// To this:
<div className="relative z-10 text-center space-y-6 max-w-2xl mx-auto">
```

Also center the store buttons:

```tsx
// Change this:
<div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">

// To this:
<div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
```

- [ ] **Step 4: Verify no type errors**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/pages/LandingPage.tsx
git commit -m "refactor(landing): simplify app download section, remove mockup"
```

---

### Task 7: Clean up unused imports

**Files:**
- Modify: `apps/web/src/app/pages/LandingPage.tsx:1-7` (imports)

- [ ] **Step 1: Remove icons no longer used in the page**

After all changes, the following imports may no longer be referenced. Check each and remove unused ones:

- `CheckCircle` — check if used
- `Sparkles` — check if used
- `MapPin` — check if used
- `Hammer` — check if used

Update the lucide-react import line to only include icons that are actually used in the file.

- [ ] **Step 2: Verify no type errors and no unused import warnings**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/pages/LandingPage.tsx
git commit -m "chore(landing): remove unused imports"
```

---

### Task 8: Visual smoke test

- [ ] **Step 1: Start the dev server**

Run: `cd apps/web && npm run dev`

- [ ] **Step 2: Verify in browser**

Open the landing page and check:
1. Dark teal hero fills the viewport
2. Header text is cream/white, terracotta "Get Started" button visible
3. Task cards animate — one exits top, one enters bottom, every ~4 seconds
4. Scrolling below the fold hits cream background immediately (hard cut)
5. Featured Services bento grid renders (images may 404 — that's fine)
6. How It Works section has no floating dots or blur blobs
7. Trust section has a subtle accent top border, no background blobs
8. App Download section is centered text + buttons, no phone mockup
9. Footer unchanged
10. Mobile: task feed appears below headline, 3 cards visible

- [ ] **Step 3: Final commit if any tweaks needed**

```bash
git add -A
git commit -m "feat(landing): complete dark hero redesign"
```
