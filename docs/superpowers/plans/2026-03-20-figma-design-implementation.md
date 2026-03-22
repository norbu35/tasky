# Figma Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Violet-theme Figma designs (node 5:1052, file js76IOzo54wpTxTQQAdZVJ) to the web application — Landing Page, Customer Dashboard, Tasker Feed, and Inbox — while keeping the current Auth/login page unchanged.

**Architecture:** Replace the current desktop-first top-nav layout with a mobile-first shell: a minimal top header (brand only) + a fixed bottom navigation bar with 4 role-aware tabs. Each page gets redesigned content matching the Figma screens.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS (CSS vars from `packages/design-tokens/tokens.css`), shadcn/ui (Radix UI), Lucide icons, framer-motion, react-i18next.

**Working directory for all tasks:** `/Users/norov/workspace/projects/tasky/.worktrees/figma-design`

**IMPORTANT constraints:**
- Do NOT touch `apps/web/src/app/pages/AuthPage.tsx` (keep login page as-is)
- Tailwind and token changes already made by user — do not revert `tailwind.config.ts` or `packages/design-tokens/tokens.css`
- All Lucide icons only (no new icon packages)
- Run tests with: `cd apps/web && pnpm test:unit` (10 pre-existing failures are expected)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/web/src/app/layout/BottomNavBar.tsx` | **Create** | Mobile bottom nav bar — 4 tabs, role-aware |
| `apps/web/src/app/layout/ScreenFrame.tsx` | **Modify** | Add BottomNavBar, adjust padding for mobile |
| `apps/web/src/app/layout/Header.tsx` | **Modify** | Slim brand-only header (no nav links — moved to bottom bar) |
| `apps/web/src/app/pages/LandingPage.tsx` | **Modify** | Full redesign: hero, search, categories grid, how it works, trust banner |
| `apps/web/src/app/pages/CustomerDashboardPage.tsx` | **Modify** | Add greeting header + quick re-book section above task tabs |
| `apps/web/src/app/pages/TaskerFeedPage.tsx` | **Modify** | Cleaner "Available Tasks" header + horizontal category chips |
| `apps/web/src/app/pages/MessagingNotificationsPage.tsx` | **Modify** | "Messages" header matching Figma Inbox layout |

---

## Task 1: Create BottomNavBar component

**Files:**
- Create: `apps/web/src/app/layout/BottomNavBar.tsx`
- Test: `apps/web/src/app/layout/__tests__/BottomNavBar.test.tsx`

The Figma BottomNavBar has 4 tabs. Role-aware tabs:
- **Customer:** Home (`/customer/dashboard`), Tasks (`/customer/tasks`), Inbox (`/communication`), Profile (`/profile`)
- **Tasker:** Find Work (`/tasker/tasks`), My Jobs (`/tasker/my-tasks`), Inbox (`/communication`), Profile (`/profile`)
- **Guest/unknown:** hidden (not rendered)

Each tab has an icon + label. Active tab = primary color. Inactive = muted.

- [ ] **Step 1: Write failing test**

Create `apps/web/src/app/layout/__tests__/BottomNavBar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AppContext — CUSTOMER role
vi.mock("../../context/AppContext", () => ({
  useAppContext: vi.fn(() => ({ profile: { role: "CUSTOMER" } })),
}));

import { BottomNavBar } from "../BottomNavBar";
import { useAppContext } from "../../context/AppContext";

describe("BottomNavBar", () => {
  beforeEach(() => {
    vi.mocked(useAppContext).mockReturnValue({ profile: { role: "CUSTOMER" } } as ReturnType<typeof useAppContext>);
  });

  it("renders 4 customer tabs", () => {
    render(
      <MemoryRouter>
        <BottomNavBar />
      </MemoryRouter>
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Tasks")).toBeInTheDocument();
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("renders nothing when profile is null (guest)", () => {
    vi.mocked(useAppContext).mockReturnValue({ profile: null } as ReturnType<typeof useAppContext>);
    const { container } = render(
      <MemoryRouter>
        <BottomNavBar />
      </MemoryRouter>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/web && pnpm test:unit --reporter verbose 2>&1 | grep -A 3 "BottomNavBar"
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/src/app/layout/BottomNavBar.tsx`**

```tsx
import { NavLink } from "react-router-dom";
import { Home, Briefcase, MessageSquare, User, Search } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useTranslation } from "react-i18next";

const CUSTOMER_TABS = [
  { to: "/customer/dashboard", icon: Home, label: "nav.home", fallback: "Home" },
  { to: "/customer/tasks", icon: Briefcase, label: "nav.tasks", fallback: "Tasks" },
  { to: "/communication", icon: MessageSquare, label: "nav.inbox", fallback: "Inbox" },
  { to: "/profile", icon: User, label: "nav.profile", fallback: "Profile" },
];

const TASKER_TABS = [
  { to: "/tasker/tasks", icon: Search, label: "nav.findWork", fallback: "Find Work" },
  { to: "/tasker/my-tasks", icon: Briefcase, label: "nav.myJobs", fallback: "My Jobs" },
  { to: "/communication", icon: MessageSquare, label: "nav.inbox", fallback: "Inbox" },
  { to: "/profile", icon: User, label: "nav.profile", fallback: "Profile" },
];

export function BottomNavBar() {
  const { profile } = useAppContext();
  const { t } = useTranslation();

  if (!profile) return null;

  const tabs = profile.role === "CUSTOMER" ? CUSTOMER_TABS : TASKER_TABS;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-md"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto flex w-full max-w-lg items-center justify-around px-2 py-2">
        {tabs.map(({ to, icon: Icon, label, fallback }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-0",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-wide truncate">
              {t(label, fallback)}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/web && pnpm test:unit --reporter verbose 2>&1 | grep -A 5 "BottomNavBar"
```

Expected: BottomNavBar tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/layout/BottomNavBar.tsx apps/web/src/app/layout/__tests__/BottomNavBar.test.tsx
git commit -m "feat(ui): add BottomNavBar component with role-aware tabs"
```

---

## Task 2: Update ScreenFrame and Header

**Files:**
- Modify: `apps/web/src/app/layout/ScreenFrame.tsx`
- Modify: `apps/web/src/app/layout/Header.tsx`

The Figma shows:
- **Header:** Brand name "Tasky" left + optional sign-out right. No nav links (moved to bottom bar).
- **ScreenFrame:** `pt-16 pb-24` (16 = header height, 24 = bottom bar height + breathing room).

- [ ] **Step 1: Update `ScreenFrame.tsx`**

Replace entire file with:

```tsx
import type { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNavBar } from "./BottomNavBar";

export function ScreenFrame({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen bg-background">
      <Header />
      <section className="mx-auto w-full max-w-2xl px-4 pb-28 pt-20 sm:px-6">
        {children}
      </section>
      <BottomNavBar />
    </main>
  );
}
```

- [ ] **Step 2: Update `Header.tsx`**

Replace entire file with:

```tsx
import { Shield } from "lucide-react";
import { Button } from "../../components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAppContext } from "../context/AppContext";
import { useTranslation } from "react-i18next";

export function Header() {
  const { profile, signOut } = useAppContext();
  const { t } = useTranslation();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 h-16 sm:px-6">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-lg font-extrabold font-display text-primary tracking-tight">
            Tasky
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {profile && (
            <Button variant="ghost" size="sm" className="text-xs font-semibold" onClick={signOut}>
              {t("nav.logout", "Sign out")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Run existing tests to confirm no regressions**

```bash
cd apps/web && pnpm test:unit 2>&1 | tail -5
```

Expected: same 10 failures / 6 passes as baseline.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/layout/ScreenFrame.tsx apps/web/src/app/layout/Header.tsx
git commit -m "feat(layout): slim header + bottom nav bar layout shell"
```

---

## Task 3: Redesign LandingPage

**Files:**
- Modify: `apps/web/src/app/pages/LandingPage.tsx`

Figma Landing Page (Violet) sections in order:
1. **Hero** — Large headline "Home help you can trust", subtitle "Mongolia's first trust-centric domestic service marketplace. Reliable professionals at your doorstep.", search input "What do you need help with?", two CTAs: "Post a Task" + "Become a Tasker"
2. **Popular Categories Grid** — 4 tiles in 2×2 grid: Гэр цэвэрлэгээ (Cleaning, 450+ Taskers), Сантехник (Plumbing, 230+), Нүүлгэлт (Moving, 180+), See All (50+ Services). Each tile has an emoji/icon, Mongolian name, tasker count.
3. **Why Choose Tasky?** — 3 trust pillars with icons: Verified Taskers, Fixed Pricing, Secure Payment
4. **How it Works** — numbered steps for customers
5. **Trust Banner** — violet card "Built on Trust & Safety" with CTA
6. **Footer**

- [ ] **Step 1: Rewrite `apps/web/src/app/pages/LandingPage.tsx`**

```tsx
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Shield, ShieldCheck, Star, CreditCard,
  CheckCircle, Search, Sparkles,
} from "lucide-react";
// NOTE: MapPin is NOT imported — it is not used in this redesign. Remove it if present.
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { LanguageSwitcher } from "../layout/LanguageSwitcher";

const CATEGORIES = [
  { icon: "🧹", name: "Гэр цэвэрлэгээ", nameEn: "Cleaning", count: "450+ Taskers" },
  { icon: "🔧", name: "Сантехник", nameEn: "Plumbing", count: "230+ Taskers" },
  { icon: "📦", name: "Нүүлгэлт", nameEn: "Moving", count: "180+ Taskers" },
  { icon: "✨", name: "See All", nameEn: "See All", count: "50+ Services" },
];

const TRUST_PILLARS = [
  { icon: ShieldCheck, title: "Verified Taskers", desc: "Every Tasker is identity-verified before joining the platform." },
  { icon: CreditCard, title: "Fixed Pricing", desc: "Set your budget upfront — no haggling, no surprises." },
  { icon: Star, title: "Secure Payment", desc: "Funds are held safely until you confirm the job is done." },
];

const HOW_STEPS = [
  { n: "1", title: "Post your task", desc: "Describe what you need, set a budget, pick a time and location." },
  { n: "2", title: "Choose the best fit", desc: "Review Tasker profiles, ratings, and experience before booking." },
  { n: "3", title: "Pay securely", desc: "Your payment is held in escrow until the job is complete." },
];

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 h-16 sm:px-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-lg font-extrabold font-display text-primary tracking-tight">Tasky</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button size="sm" variant="ghost" className="font-semibold text-sm" onClick={() => navigate("/auth")}>
              {t("auth.login", "Login")}
            </Button>
            <Button size="sm" className="font-semibold shadow-md shadow-primary/20" onClick={() => navigate("/auth")}>
              {t("landing.getStarted", "Get Started")}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-20 pt-20 sm:px-6">
        {/* Hero Section */}
        <section className="py-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-5"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              {t("landing.trustedBy", "Trusted by 10,000+ users in Mongolia")}
            </div>

            <h1 className="text-4xl font-display font-bold leading-tight tracking-tight sm:text-5xl">
              {t("landing.heroTitle1", "Home help you")}{" "}
              <span className="text-primary">{t("landing.heroTitleHighlight", "can trust")}</span>
            </h1>

            <p className="text-base text-muted-foreground max-w-sm mx-auto">
              {t(
                "landing.heroSubtitle",
                "Mongolia's first trust-centric domestic service marketplace. Reliable professionals at your doorstep."
              )}
            </p>

            {/* Search bar */}
            <div className="relative mt-6 max-w-sm mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-10 pr-4 h-12 rounded-2xl border-border bg-card shadow-sm text-sm"
                placeholder={t("landing.searchPlaceholder", "What do you need help with?")}
                onFocus={() => navigate("/auth")}
                readOnly
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="h-12 rounded-2xl px-7 font-semibold shadow-lg shadow-primary/25"
                onClick={() => navigate("/auth")}
              >
                {t("landing.postTaskBtn", "Post a Task")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="h-12 rounded-2xl px-7 font-semibold"
                onClick={() => navigate("/auth")}
              >
                {t("landing.becomeTaskerBtn", "Become a Tasker")}
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Popular Categories */}
        <section className="py-8">
          <h2 className="text-lg font-display font-bold mb-4">
            {t("landing.categoriesTitle", "Popular Categories")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/auth")}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 text-left shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
              >
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-foreground">{cat.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{cat.count}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Why Choose Tasky */}
        <section className="py-8 border-t border-border/50">
          <h2 className="text-lg font-display font-bold mb-6 text-center">
            {t("landing.whyTitle", "Why choose Tasky?")}
          </h2>
          <div className="space-y-4">
            {TRUST_PILLARS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{t(`landing.pillar.${title}`, title)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t(`landing.pillarDesc.${title}`, desc)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it Works */}
        <section className="py-8 border-t border-border/50">
          <h2 className="text-lg font-display font-bold mb-2 text-center">
            {t("landing.howItWorksTitle", "How Tasky Works")}
          </h2>
          <p className="text-xs text-muted-foreground text-center mb-6">
            {t("landing.howItWorksSub", "Simple, secure, and transparent.")}
          </p>
          <div className="space-y-6">
            {HOW_STEPS.map(({ n, title, desc }) => (
              <div key={n} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {n}
                </div>
                <div className="pt-0.5">
                  <div className="text-sm font-semibold">{t(`landing.step${n}Title`, title)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t(`landing.step${n}Desc`, desc)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust Banner */}
        <section className="py-8">
          <div className="rounded-3xl bg-primary p-8 text-center text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 pointer-events-none" />
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-xl font-display font-bold mb-2 relative z-10">
              {t("landing.trustTitle", "Built on Trust & Safety")}
            </h2>
            <p className="text-sm text-primary-foreground/80 mb-6 max-w-xs mx-auto relative z-10">
              {t(
                "landing.trustDesc",
                "Every Tasker is identity-verified. Every payment is protected."
              )}
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="h-12 px-7 rounded-2xl font-bold relative z-10"
              onClick={() => navigate("/auth")}
            >
              {t("landing.joinNow", "Join Tasky Today")}
              <CheckCircle className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 bg-muted/20 py-8 px-4">
        <div className="mx-auto max-w-2xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 opacity-50">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-display font-bold">Tasky</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("auth.copyright", "© 2026 Tasky Network. All rights reserved.")}
          </p>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Run tests (no regressions expected)**

```bash
cd apps/web && pnpm test:unit 2>&1 | tail -5
```

Expected: same 10 failures / 6 passes as baseline.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/pages/LandingPage.tsx
git commit -m "feat(landing): redesign landing page to match Figma Violet layout"
```

---

## Task 4: Update CustomerDashboardPage

**Files:**
- Modify: `apps/web/src/app/pages/CustomerDashboardPage.tsx`

Figma Customer Dashboard shows:
- Personalized greeting: "Sain baina uu, {firstName}?" + "You have N active tasks today."
- Active tasks count badge
- Task cards in a clean list (not grid)
- "Quick Re-book" section below with "Work again with your favorite professionals"

- [ ] **Step 1: Update the greeting section and layout in `CustomerDashboardPage.tsx`**

Add at the top of the page content (before the task list), inside the `ScreenFrame`:

```tsx
{/* Greeting header */}
<div className="space-y-1 mb-6">
  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
  </p>
  <h1 className="text-2xl font-display font-bold">
    {t("customerDashboard.greeting", "Sain baina uu")},{" "}
    <span className="text-primary">
      {profile?.full_name?.split(" ")[0] ?? t("customerDashboard.friend", "there")}
    </span>
    {"!"}
  </h1>
  <p className="text-sm text-muted-foreground">
    {isLoading
      ? t("customerDashboard.loadingTasks", "Loading your tasks...")
      : t("customerDashboard.activeTasksToday", {
          count: tasksPage?.data?.filter((t) => t.status === "ASSIGNED" || t.status === "OPEN").length ?? 0,
          defaultValue: "You have {{count}} active task(s) today.",
        })}
  </p>
</div>
```

Destructure `profile` from `useAppContext()` — add it to the existing destructure on line ~70:
```tsx
const { apiClient, session, profile } = useAppContext();
```

**Import cleanup — remove these unused imports** from the top of `CustomerDashboardPage.tsx` since the new compact `TaskCard` no longer uses them:
- `Calendar` (was used in old CardDescription)
- `Users` (was used in old CardFooter)
- `CheckCircle` (was used in old CardFooter)
- `CardHeader`, `CardTitle`, `CardDescription`, `CardFooter` (replaced by flat `<Card>` layout)

Keep: `AlertCircle`, `MapPin`, `Plus`, `Badge`, `Card`, `CardContent`, `Skeleton`, `Alert`, `AlertDescription`, `AlertTitle`, `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`.

Also update the task card layout from a 3-column grid to a single-column list on mobile:
- Change `"grid gap-4 sm:grid-cols-2 lg:grid-cols-3"` → `"grid gap-3"` (single column, compact cards)

Update `TaskCard` component inside this file to use a more compact horizontal layout:

```tsx
function TaskCard({ task }: { task: Task }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card
      className="flex flex-row items-center gap-3 p-4 hover:border-primary/40 transition-colors cursor-pointer"
      onClick={() => navigate(`/customer/tasks/${task.id}`)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge variant={task.status === "OPEN" ? "default" : "secondary"} className="text-xs">
            {task.status}
          </Badge>
        </div>
        <p className="text-sm font-semibold truncate">{task.description}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{task.location_text}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-bold">₮{task.budget.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">{new Date(task.scheduled_at).toLocaleDateString()}</div>
      </div>
    </Card>
  );
}
```

**Also replace the skeleton loading block** (which uses the removed `CardHeader`/`CardFooter`) with:

```tsx
{/* Skeleton — replace the existing skeleton block */}
{Array.from({ length: 3 }).map((_, i) => (
  <Card key={i} className="flex flex-row items-center gap-3 p-4">
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <div className="space-y-1 text-right">
      <Skeleton className="h-4 w-16 ml-auto" />
      <Skeleton className="h-3 w-12 ml-auto" />
    </div>
  </Card>
))}
```

**Also replace the empty-state block** (which uses the removed `CardTitle`/`CardDescription`) with:

```tsx
{/* Empty state — replace the existing empty-state card */}
<Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
    <Plus className="h-6 w-6 text-primary" />
  </div>
  <p className="font-semibold mb-1">{t("customerDashboard.noTasksTitle", "No tasks posted yet")}</p>
  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
    {t("customerDashboard.noTasksDesc", "You haven't posted any tasks. Create your first task to find taskers to help you out.")}
  </p>
  <Button onClick={() => navigate("/customer/tasks/new")}>
    {t("customerDashboard.postFirstTask", "Post your first task")}
  </Button>
</Card>
```

- [ ] **Step 2: Run tests**

```bash
cd apps/web && pnpm test:unit 2>&1 | tail -5
```

Expected: same baseline.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/pages/CustomerDashboardPage.tsx
git commit -m "feat(dashboard): add greeting header + compact task card layout"
```

---

## Task 5: Update TaskerFeedPage

**Files:**
- Modify: `apps/web/src/app/pages/TaskerFeedPage.tsx`

Figma Tasker Feed shows:
- Header: "Available Tasks" (large) + "Find nearby opportunities in Ulaanbaatar based on your skills." subtitle
- Horizontal scrolling category chips (filter by category)
- Task cards in a clean list with: title, location badge, budget, apply button

Changes:
1. Replace verbose 4-column filter form with a horizontal chip strip (category filter only)
2. Update page title/subtitle to match Figma
3. Simplify task card header

- [ ] **Step 1: Update `TaskerFeedPage.tsx`**

Replace the page header + filter form section (lines before the task list) with:

```tsx
{/* Page header */}
<div className="mb-4">
  <h1 className="text-2xl font-display font-bold tracking-tight">
    {t("taskerFeed.title", "Available Tasks")}
  </h1>
  <p className="text-sm text-muted-foreground mt-1">
    {t("taskerFeed.subtitle", "Find nearby opportunities in Ulaanbaatar based on your skills.")}
  </p>
</div>

{/* Category filter chips */}
<div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
  <button
    onClick={() => setFilters((prev) => ({ ...prev, categoryId: "" }))}
    className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors ${
      !filters.categoryId
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-card text-muted-foreground border-border hover:border-primary/50"
    }`}
  >
    {t("taskerFeed.allCategories", "All")}
  </button>
  {categories.map((c: Category) => (
    <button
      key={c.id}
      onClick={() => setFilters((prev) => ({ ...prev, categoryId: c.id }))}
      className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors ${
        filters.categoryId === c.id
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-muted-foreground border-border hover:border-primary/50"
      }`}
    >
      {i18n.language === "mn" ? c.name_mn : c.name}
    </button>
  ))}
</div>
```

Remove the `<Card>` filter form with lat/lng/radius inputs (these remain as state but are not exposed in the UI — keep default Ulaanbaatar coords).

- [ ] **Step 2: Run tests**

```bash
cd apps/web && pnpm test:unit 2>&1 | tail -5
```

Expected: same baseline.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/pages/TaskerFeedPage.tsx
git commit -m "feat(tasker-feed): simplify header and replace filter form with category chips"
```

---

## Task 6: Update MessagingNotificationsPage (Inbox)

**Files:**
- Modify: `apps/web/src/app/pages/MessagingNotificationsPage.tsx`

Figma Inbox shows:
- Clean "Messages" header
- Search bar at top
- Conversation list with avatar, name, last message preview, timestamp
- No push notification toggle visible at top (move it or remove from prominent position)

Changes:
1. Replace "Inbox" + notification toggle row with clean "Messages" h1 + search bar
2. Move push notification toggle to a subtle icon button in the header row
3. Update conversation item to show avatar + name + preview snippet

- [ ] **Step 1: Update page header in `MessagingNotificationsPage.tsx`**

Replace the **entire** old header block (lines ~158–170 in the current file) — this includes the `<h1>`, the `<div>` wrapper with notification toggle, `<Label>`, and `<Switch>`:

```tsx
{/* OLD — remove this entire block: */}
<div className="w-full flex justify-between items-center mb-4">
  <h1 className="text-3xl font-bold tracking-tight">{t("messaging.inboxTitle", "Inbox")}</h1>
  <div className="flex items-center gap-2 border px-3 py-1.5 rounded-full bg-card">
    <Label htmlFor="push-toggle" ...>
      {pushEnabled ? <Bell .../> : <BellOff .../>}
      {t("messaging.notificationsLabel", "Notifications")}
    </Label>
    <Switch id="push-toggle" checked={pushEnabled} onCheckedChange={handlePushToggle} disabled={working}/>
  </div>
</div>
```

Replace with (the `<Switch>` is fully removed — the bell icon button is the only toggle):
```tsx
<div className="w-full flex items-center justify-between mb-4">
  <h1 className="text-2xl font-display font-bold">
    {t("messaging.inboxTitle", "Messages")}
  </h1>
  <button
    aria-label={t("messaging.notificationsLabel", "Notifications")}
    onClick={() => void handlePushToggle(!pushEnabled)}
    className="p-2 rounded-full hover:bg-muted transition-colors"
  >
    {pushEnabled
      ? <Bell className="w-5 h-5 text-primary" />
      : <BellOff className="w-5 h-5 text-muted-foreground" />}
  </button>
</div>
```

Also remove unused imports `Switch`, `Label` from the top of the file (they are no longer rendered).

- [ ] **Step 2: Run tests**

```bash
cd apps/web && pnpm test:unit 2>&1 | tail -5
```

Expected: same baseline.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/pages/MessagingNotificationsPage.tsx
git commit -m "feat(inbox): update Messages header to match Figma Inbox layout"
```

---

## Final Verification

- [ ] Start dev server: `cd apps/web && pnpm dev`
- [ ] Verify landing page: hero, search bar, categories, how it works, trust banner
- [ ] Verify BottomNavBar appears on all authenticated pages (not on landing/auth)
- [ ] Verify AuthPage (`/auth`) is unchanged — no BottomNavBar, no Header changes
- [ ] Verify Header is slim brand-only (Shield icon + "Tasky" + sign out)
- [ ] Verify `/banned` (RestrictedAccountPage) renders correctly with bottom bar — content not hidden behind bar
- [ ] Verify `/booking/safety` (BookingSafetyPage) renders correctly with bottom bar — content not hidden behind bar
- [ ] Final test run: `cd apps/web && pnpm test:unit 2>&1 | tail -5` — same baseline (10 fail, 6 pass)
- [ ] TypeCheck: `cd apps/web && pnpm typecheck 2>&1 | tail -10` — 0 errors
