# Web Foundation Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the web app's design foundation (tokens, fonts, Tailwind config, header, layout shell) and create shared feature components to match the Figma design language.

**Architecture:** Update CSS custom properties in `tokens.css` to match `tokens.ts` (Figma source of truth), add new semantic tokens, update Tailwind config with new colors/fonts/radius, redesign the Header with role-aware nav, and create 12 shared feature components. All existing shadcn/ui primitives are rethemed via CSS variable changes alone — no source modifications.

**Tech Stack:** React, Vite, TailwindCSS, shadcn/ui, cva (class-variance-authority), lucide-react, react-router-dom, react-i18next

**Spec:** `docs/superpowers/specs/2026-03-20-web-figma-restyle-design.md`

**This is Plan A of 3.** Plan B covers core page restyling. Plan C covers remaining pages.

---

## File Map

**Token/Config (modify):**
- `packages/design-tokens/tokens.css` — reconcile `:root` values + add new semantic tokens
- `apps/web/src/styles.css` — bridge new tokens + add font import
- `apps/web/tailwind.config.ts` — add colors, fonts, border-radius

**Layout (modify):**
- `apps/web/src/app/layout/Header.tsx` — role-aware nav + frosted glass + dev toggle
- `apps/web/src/app/layout/ScreenFrame.tsx` — flat background, remove gradient

**Feature Components (create):**
- `apps/web/src/components/feature/StatusBadge.tsx`
- `apps/web/src/components/feature/CategoryChip.tsx`
- `apps/web/src/components/feature/TrustBanner.tsx`
- `apps/web/src/components/feature/TaskCard.tsx`
- `apps/web/src/components/feature/TaskerProfileCard.tsx`
- `apps/web/src/components/feature/StatCard.tsx`
- `apps/web/src/components/feature/ReviewCard.tsx`
- `apps/web/src/components/feature/GradientButton.tsx`
- `apps/web/src/components/feature/EmptyState.tsx`
- `apps/web/src/components/feature/ErrorAlert.tsx`
- `apps/web/src/components/feature/ContentSkeleton.tsx`
- `apps/web/src/components/feature/VerificationBadge.tsx`
- `apps/web/src/components/feature/index.ts` — barrel export

---

### Task 1: Reconcile tokens.css with Figma palette

**Files:**
- Modify: `packages/design-tokens/tokens.css`

- [ ] **Step 1: Update `:root` block to match tokens.ts**

Replace these values in the `:root` block:

```css
:root {
    /* Figma-aligned Light Theme */
    --tasky-color-background: 0 0% 98%;
    --tasky-color-foreground: 0 0% 9%;
    --tasky-color-card: 0 0% 100%;
    --tasky-color-card-foreground: 0 0% 9%;
    --tasky-color-popover: 0 0% 100%;
    --tasky-color-popover-foreground: 0 0% 9%;
    --tasky-color-primary: 263 70% 50%;
    --tasky-color-primary-foreground: 0 0% 100%;
    --tasky-color-secondary: 251 91% 95%;
    --tasky-color-secondary-foreground: 264 67% 35%;
    --tasky-color-muted: 0 0% 95%;
    --tasky-color-muted-foreground: 265 8% 40%;
    --tasky-color-accent: 38 92% 50%;
    --tasky-color-accent-foreground: 0 0% 0%;
    --tasky-color-border: 240 6% 90%;
    --tasky-color-input: 240 6% 90%;
    --tasky-color-ring: 263 70% 50%;
    --tasky-color-destructive: 0 84% 60%;
    --tasky-color-destructive-foreground: 0 0% 100%;
    --tasky-radius: 1rem;

    /* Note: --tasky-radius stays at 1rem (existing value) to preserve shadcn/ui component radii.
       The spec adds xl/2xl/full keys for Figma components without changing the base. */

    /* Figma semantic tokens */
    --tasky-color-primary-deep: 275 100% 36%;
    --tasky-color-trust: 33 100% 86%;
    --tasky-color-trust-foreground: 30 100% 8%;
    --tasky-color-trust-muted: 30 100% 20%;
    --tasky-color-status-open: 152 76% 90%;
    --tasky-color-status-open-foreground: 162 93% 24%;
    --tasky-color-status-assigned: 263 70% 50%;
    --tasky-color-status-assigned-foreground: 0 0% 100%;
    --tasky-color-verified: 160 59% 45%;
    --tasky-color-subtle-violet: 249 42% 92%;
    --tasky-color-chip-inactive: 0 0% 89%;
    --tasky-color-nav-inactive: 220 9% 46%;
}
```

Keep the `.dark` block unchanged (out of scope).

- [ ] **Step 2: Verify the web app still builds**

Run: `cd apps/web && npx vite build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add packages/design-tokens/tokens.css
git commit -m "fix(tokens): reconcile tokens.css with Figma palette from tokens.ts"
```

---

### Task 2: Update styles.css and Tailwind config

**Files:**
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/tailwind.config.ts`

- [ ] **Step 1: Add font import and bridge variables to styles.css**

Replace the entire `apps/web/src/styles.css` with:

```css
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
@import "../../../packages/design-tokens/tokens.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
    color-scheme: light;
    --background: var(--tasky-color-background);
    --foreground: var(--tasky-color-foreground);
    --card: var(--tasky-color-card);
    --card-foreground: var(--tasky-color-card-foreground);
    --popover: var(--tasky-color-popover);
    --popover-foreground: var(--tasky-color-popover-foreground);
    --primary: var(--tasky-color-primary);
    --primary-foreground: var(--tasky-color-primary-foreground);
    --secondary: var(--tasky-color-secondary);
    --secondary-foreground: var(--tasky-color-secondary-foreground);
    --muted: var(--tasky-color-muted);
    --muted-foreground: var(--tasky-color-muted-foreground);
    --accent: var(--tasky-color-accent);
    --accent-foreground: var(--tasky-color-accent-foreground);
    --border: var(--tasky-color-border);
    --input: var(--tasky-color-input);
    --ring: var(--tasky-color-ring);
    --radius: var(--tasky-radius);
    --destructive: var(--tasky-color-destructive);
    --destructive-foreground: var(--tasky-color-destructive-foreground);

    /* Figma semantic bridges */
    --primary-deep: var(--tasky-color-primary-deep);
    --trust: var(--tasky-color-trust);
    --trust-foreground: var(--tasky-color-trust-foreground);
    --trust-muted: var(--tasky-color-trust-muted);
    --status-open: var(--tasky-color-status-open);
    --status-open-foreground: var(--tasky-color-status-open-foreground);
    --status-assigned: var(--tasky-color-status-assigned);
    --status-assigned-foreground: var(--tasky-color-status-assigned-foreground);
    --verified: var(--tasky-color-verified);
    --subtle-violet: var(--tasky-color-subtle-violet);
    --chip-inactive: var(--tasky-color-chip-inactive);
    --nav-inactive: var(--tasky-color-nav-inactive);
}

* {
    @apply border-border;
}

body {
    margin: 0;
    @apply bg-background text-foreground antialiased font-sans;
}
```

- [ ] **Step 2: Update Tailwind config**

Replace `apps/web/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))"
                },
                "primary-deep": "hsl(var(--primary-deep))",
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))"
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))"
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))"
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))"
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))"
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))"
                },
                trust: {
                    DEFAULT: "hsl(var(--trust))",
                    foreground: "hsl(var(--trust-foreground))",
                    muted: "hsl(var(--trust-muted))"
                },
                status: {
                    open: "hsl(var(--status-open))",
                    "open-foreground": "hsl(var(--status-open-foreground))",
                    assigned: "hsl(var(--status-assigned))",
                    "assigned-foreground": "hsl(var(--status-assigned-foreground))"
                },
                verified: "hsl(var(--verified))",
                "subtle-violet": "hsl(var(--subtle-violet))",
                "chip-inactive": "hsl(var(--chip-inactive))",
                "nav-inactive": "hsl(var(--nav-inactive))"
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                xl: "12px",
                "2xl": "16px",
                full: "9999px"
            },
            fontFamily: {
                sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
                display: ["Manrope", "system-ui", "sans-serif"]
            }
        }
    },
    plugins: [tailwindcssAnimate]
};

export default config;
```

- [ ] **Step 3: Verify build**

Run: `cd apps/web && npx vite build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/styles.css apps/web/tailwind.config.ts
git commit -m "feat(web): add Figma fonts, semantic token bridges, and Tailwind color/radius extensions"
```

---

### Task 3: Update Header with role-aware nav

**Files:**
- Modify: `apps/web/src/app/layout/Header.tsx`

- [ ] **Step 1: Rewrite Header.tsx**

```tsx
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAppContext } from "../context/AppContext";

const TASKER_LINKS = [
    { to: "/tasker/tasks", label: "nav.findWork", fallback: "Find Work" },
    { to: "/tasker/my-tasks", label: "nav.myJobs", fallback: "My Jobs" },
    { to: "/communication", label: "nav.inbox", fallback: "Inbox" },
];

const CUSTOMER_LINKS = [
    { to: "/customer/dashboard", label: "nav.dashboard", fallback: "Dashboard" },
    { to: "/customer/tasks", label: "nav.tasks", fallback: "Tasks" },
    { to: "/communication", label: "nav.inbox", fallback: "Inbox" },
];

const COMMON_LINKS = [
    { to: "/profile", label: "nav.profile", fallback: "Profile" },
];

export function Header() {
    const { profile, signOut } = useAppContext();
    const { t } = useTranslation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [devRole, setDevRole] = useState<string | null>(null);

    const effectiveRole = devRole ?? profile?.role;
    const roleLinks = effectiveRole === "TASKER" ? TASKER_LINKS
        : effectiveRole === "CUSTOMER" ? CUSTOMER_LINKS
        : [];
    const allLinks = [...roleLinks, ...COMMON_LINKS];

    const linkClass = ({ isActive }: { isActive: boolean }): string =>
        [
            "rounded-xl px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors whitespace-nowrap",
            isActive
                ? "bg-primary text-primary-foreground"
                : "text-nav-inactive hover:bg-muted"
        ].join(" ");

    return (
        <>
            <header className="fixed left-0 right-0 top-0 z-50 w-full border-b border-border/40 bg-background/75 backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 h-16">
                    {/* Brand */}
                    <div className="flex items-center gap-4">
                        <span className="text-xl font-extrabold font-display text-primary-deep tracking-tight">
                            Tasky
                        </span>
                        <LanguageSwitcher />
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
                        {allLinks.map(link => (
                            <NavLink key={link.to} className={linkClass} to={link.to}>
                                {t(link.label, link.fallback)}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Right: user + mobile toggle */}
                    <div className="flex items-center gap-3">
                        {profile && (
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                                    {profile.full_name?.charAt(0) ?? "?"}
                                </div>
                            </div>
                        )}
                        <Button variant="ghost" size="sm" className="text-xs font-semibold" onClick={signOut}>
                            {t("nav.logout", "Sign out")}
                        </Button>
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-muted"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {mobileOpen && (
                    <nav className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-md px-6 py-3 flex flex-col gap-1" aria-label="Mobile navigation">
                        {allLinks.map(link => (
                            <NavLink
                                key={link.to}
                                className={linkClass}
                                to={link.to}
                                onClick={() => setMobileOpen(false)}
                            >
                                {t(link.label, link.fallback)}
                            </NavLink>
                        ))}
                    </nav>
                )}
            </header>

            {/* Dev toggle */}
            {import.meta.env.DEV && (
                <button
                    className="fixed bottom-4 right-4 z-50 bg-foreground/10 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-foreground/20 transition-colors"
                    onClick={() => setDevRole(prev =>
                        prev === "TASKER" ? "CUSTOMER" : prev === "CUSTOMER" ? null : "TASKER"
                    )}
                >
                    {devRole ? `Dev: ${devRole}` : "Dev: auto"}
                </button>
            )}
        </>
    );
}
```

- [ ] **Step 2: Update ScreenFrame**

Replace `apps/web/src/app/layout/ScreenFrame.tsx`:

```tsx
import type { ReactNode } from "react";
import { Header } from "./Header";

export function ScreenFrame({ children }: { children: ReactNode }) {
    return (
        <main className="relative min-h-screen bg-background">
            <Header />
            <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-12 pt-24">
                {children}
            </section>
        </main>
    );
}
```

- [ ] **Step 3: Verify build and TypeScript**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | grep "error TS" | head -10`
Expected: no errors (or only pre-existing)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/layout/Header.tsx apps/web/src/app/layout/ScreenFrame.tsx
git commit -m "feat(web): role-aware nav header with frosted glass, mobile hamburger, and dev toggle"
```

---

### Task 4: Create shared feature components (batch 1 — foundational)

**Files:**
- Create: `apps/web/src/components/feature/StatusBadge.tsx`
- Create: `apps/web/src/components/feature/CategoryChip.tsx`
- Create: `apps/web/src/components/feature/GradientButton.tsx`
- Create: `apps/web/src/components/feature/VerificationBadge.tsx`
- Create: `apps/web/src/components/feature/EmptyState.tsx`
- Create: `apps/web/src/components/feature/ErrorAlert.tsx`
- Create: `apps/web/src/components/feature/ContentSkeleton.tsx`

- [ ] **Step 1: Create StatusBadge**

```tsx
// apps/web/src/components/feature/StatusBadge.tsx
import { cn } from "../../lib/utils";

const STATUS_STYLES: Record<string, string> = {
    open: "bg-status-open text-status-open-foreground",
    assigned: "bg-status-assigned text-status-assigned-foreground",
    completed: "bg-verified text-white",
    cancelled: "bg-muted text-muted-foreground",
    no_show: "bg-destructive text-destructive-foreground",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
    const key = status.toLowerCase().replace(" ", "_");
    return (
        <span className={cn(
            "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[1px]",
            STATUS_STYLES[key] ?? "bg-muted text-muted-foreground",
            className
        )}>
            {status}
        </span>
    );
}
```

- [ ] **Step 2: Create CategoryChip**

```tsx
// apps/web/src/components/feature/CategoryChip.tsx
import { cn } from "../../lib/utils";

interface CategoryChipProps {
    label: string;
    isActive?: boolean;
    onClick?: () => void;
}

export function CategoryChip({ label, isActive = false, onClick }: CategoryChipProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
                isActive
                    ? "bg-primary text-primary-foreground shadow-[0_10px_15px_-3px_rgba(83,0,183,0.2)]"
                    : "bg-chip-inactive text-muted-foreground hover:bg-muted"
            )}
        >
            {label}
        </button>
    );
}
```

- [ ] **Step 3: Create GradientButton**

```tsx
// apps/web/src/components/feature/GradientButton.tsx
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
}

export function GradientButton({ children, className, isLoading, disabled, ...props }: GradientButtonProps) {
    return (
        <button
            className={cn(
                "w-full py-4 rounded-xl text-white font-bold text-lg uppercase tracking-wide",
                "bg-gradient-to-br from-primary-deep to-primary",
                "shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)]",
                "hover:-translate-y-0.5 transition-transform",
                "disabled:opacity-50 disabled:pointer-events-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? <Loader2 className="mx-auto animate-spin" size={20} /> : children}
        </button>
    );
}
```

- [ ] **Step 4: Create VerificationBadge**

```tsx
// apps/web/src/components/feature/VerificationBadge.tsx
import { CheckCircle, Shield } from "lucide-react";
import { cn } from "../../lib/utils";

interface VerificationBadgeProps {
    type: "verified" | "pro";
    size?: "sm" | "md";
    className?: string;
}

export function VerificationBadge({ type, size = "sm", className }: VerificationBadgeProps) {
    const dim = size === "sm" ? "w-5 h-5" : "w-6 h-6";
    const iconSize = size === "sm" ? 12 : 14;

    if (type === "verified") {
        return (
            <span className={cn("inline-flex items-center justify-center rounded-full bg-verified text-white", dim, className)}>
                <CheckCircle size={iconSize} />
            </span>
        );
    }

    return (
        <span className={cn("inline-flex items-center justify-center rounded-full bg-trust text-trust-muted", dim, className)}>
            <Shield size={iconSize} />
        </span>
    );
}
```

- [ ] **Step 5: Create EmptyState**

```tsx
// apps/web/src/components/feature/EmptyState.tsx
import type { ReactNode } from "react";

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold font-display text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
            {action}
        </div>
    );
}
```

- [ ] **Step 6: Create ErrorAlert**

```tsx
// apps/web/src/components/feature/ErrorAlert.tsx
import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";

interface ErrorAlertProps {
    message: string;
    onRetry?: () => void;
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
            <AlertTriangle className="text-destructive shrink-0" size={20} />
            <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{message}</p>
            </div>
            {onRetry && (
                <Button variant="ghost" size="sm" onClick={onRetry}>Retry</Button>
            )}
        </div>
    );
}
```

- [ ] **Step 7: Create ContentSkeleton**

```tsx
// apps/web/src/components/feature/ContentSkeleton.tsx
import { cn } from "../../lib/utils";

interface ContentSkeletonProps {
    variant?: "card" | "list-item" | "profile";
    className?: string;
}

export function ContentSkeleton({ variant = "card", className }: ContentSkeletonProps) {
    if (variant === "profile") {
        return (
            <div className={cn("animate-pulse space-y-4", className)}>
                <div className="mx-auto w-32 h-32 rounded-full bg-muted" />
                <div className="mx-auto w-40 h-6 rounded bg-muted" />
                <div className="mx-auto w-24 h-4 rounded bg-muted" />
                <div className="flex gap-3 justify-center">
                    <div className="w-24 h-20 rounded-xl bg-muted" />
                    <div className="w-24 h-20 rounded-xl bg-muted" />
                    <div className="w-24 h-20 rounded-xl bg-muted" />
                </div>
            </div>
        );
    }

    if (variant === "list-item") {
        return (
            <div className={cn("animate-pulse flex items-center gap-4 p-4 rounded-xl bg-card", className)}>
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                    <div className="w-3/4 h-4 rounded bg-muted" />
                    <div className="w-1/2 h-3 rounded bg-muted" />
                </div>
            </div>
        );
    }

    return (
        <div className={cn("animate-pulse rounded-xl bg-card p-5 space-y-4", className)}>
            <div className="flex justify-between">
                <div className="w-12 h-12 rounded-xl bg-muted" />
                <div className="w-16 h-6 rounded-full bg-muted" />
            </div>
            <div className="w-3/4 h-5 rounded bg-muted" />
            <div className="w-1/3 h-6 rounded bg-muted" />
            <div className="flex gap-4 pt-4 border-t border-border">
                <div className="w-1/3 h-4 rounded bg-muted" />
                <div className="w-1/3 h-4 rounded bg-muted" />
            </div>
        </div>
    );
}
```

- [ ] **Step 8: Verify TypeScript**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | grep "error TS" | head -10`

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/components/feature/
git commit -m "feat(web): add foundational feature components (StatusBadge, CategoryChip, GradientButton, VerificationBadge, EmptyState, ErrorAlert, ContentSkeleton)"
```

---

### Task 5: Create shared feature components (batch 2 — composite)

**Files:**
- Create: `apps/web/src/components/feature/TrustBanner.tsx`
- Create: `apps/web/src/components/feature/TaskCard.tsx`
- Create: `apps/web/src/components/feature/TaskerProfileCard.tsx`
- Create: `apps/web/src/components/feature/StatCard.tsx`
- Create: `apps/web/src/components/feature/ReviewCard.tsx`
- Create: `apps/web/src/components/feature/index.ts`

- [ ] **Step 1: Create TrustBanner**

```tsx
// apps/web/src/components/feature/TrustBanner.tsx
import { ShieldCheck } from "lucide-react";
import { cn } from "../../lib/utils";

interface TrustBannerProps {
    title: string;
    description: string;
    variant?: "default" | "compact";
}

export function TrustBanner({ title, description, variant = "default" }: TrustBannerProps) {
    return (
        <div className={cn(
            "flex items-center gap-4 rounded-xl p-4",
            variant === "default"
                ? "bg-trust/30 border border-trust"
                : "bg-trust"
        )}>
            <div className={cn(
                "shrink-0 flex items-center justify-center",
                variant === "default"
                    ? "w-10 h-10 rounded-lg bg-trust"
                    : "w-10 h-10 rounded-full bg-trust-muted/10"
            )}>
                <ShieldCheck size={20} className="text-trust-muted" />
            </div>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-trust-muted">{title}</p>
                <p className="text-sm text-trust-foreground leading-snug">{description}</p>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Create TaskCard**

```tsx
// apps/web/src/components/feature/TaskCard.tsx
import { MapPin, Clock } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { cn } from "../../lib/utils";

interface TaskCardProps {
    title: string;
    description?: string;
    budget: number;
    status: string;
    location?: string;
    scheduledAt?: string;
    categoryIcon?: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export function TaskCard({ title, description, budget, status, location, scheduledAt, categoryIcon, onClick, className }: TaskCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left bg-card rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
                "hover:border-primary/30 border border-transparent transition-colors",
                className
            )}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-subtle-violet flex items-center justify-center text-primary-deep">
                    {categoryIcon}
                </div>
                <StatusBadge status={status} />
            </div>
            <h3 className="text-lg font-bold font-display text-foreground leading-snug mb-1 line-clamp-2">{title}</h3>
            {description && <p className="text-sm text-muted-foreground line-clamp-2 mb-1">{description}</p>}
            <p className="text-2xl font-bold text-primary-deep">₮{budget.toLocaleString()}</p>
            <div className="flex gap-6 mt-4 pt-4 border-t border-border">
                {location && (
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <MapPin size={12} />
                        <span>{location}</span>
                    </div>
                )}
                {scheduledAt && (
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Clock size={12} />
                        <span>{scheduledAt}</span>
                    </div>
                )}
            </div>
        </button>
    );
}
```

- [ ] **Step 3: Create TaskerProfileCard**

```tsx
// apps/web/src/components/feature/TaskerProfileCard.tsx
import { Star, ShieldCheck } from "lucide-react";
import { VerificationBadge } from "./VerificationBadge";
import { cn } from "../../lib/utils";

interface TaskerProfileCardProps {
    name: string;
    avatarUrl?: string | null;
    rating: number;
    reviewCount: number;
    isVerified?: boolean;
    isPro?: boolean;
    bio?: string;
    onMessage?: () => void;
    className?: string;
}

export function TaskerProfileCard({
    name, avatarUrl, rating, reviewCount, isVerified, isPro, bio, onMessage, className
}: TaskerProfileCardProps) {
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div className={cn("bg-card rounded-xl p-5 space-y-4", className)}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={name} className="w-16 h-16 rounded-xl object-cover ring-2 ring-muted" />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-subtle-violet flex items-center justify-center text-primary-deep font-bold text-lg">
                                {initials}
                            </div>
                        )}
                        {isVerified && (
                            <VerificationBadge type="verified" className="absolute -bottom-1 -right-1" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold font-display text-foreground">{name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Star size={12} className="text-accent fill-accent" />
                            <span className="text-sm font-bold text-foreground">{rating}</span>
                            <span className="text-xs text-muted-foreground">({reviewCount} reviews)</span>
                        </div>
                    </div>
                </div>
                {isPro && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-trust text-trust-muted text-[10px] font-bold uppercase">
                        <ShieldCheck size={12} />
                        Verified
                    </span>
                )}
            </div>
            {bio && <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>}
            {onMessage && (
                <button
                    onClick={onMessage}
                    className="w-full py-3 rounded-lg border border-muted-foreground/30 text-sm font-bold text-primary-deep hover:bg-muted transition-colors"
                >
                    Message Tasker
                </button>
            )}
        </div>
    );
}
```

- [ ] **Step 4: Create StatCard**

```tsx
// apps/web/src/components/feature/StatCard.tsx
export function StatCard({ value, label }: { value: string; label: string }) {
    return (
        <div className="flex-1 bg-muted rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
        </div>
    );
}
```

- [ ] **Step 5: Create ReviewCard**

```tsx
// apps/web/src/components/feature/ReviewCard.tsx
import { Star } from "lucide-react";
import { cn } from "../../lib/utils";

interface ReviewCardProps {
    reviewerInitials: string;
    reviewerName: string;
    rating: number;
    comment: string;
    timeAgo: string;
    featured?: boolean;
}

export function ReviewCard({ reviewerInitials, reviewerName, rating, comment, timeAgo, featured }: ReviewCardProps) {
    return (
        <div className={cn(
            "bg-muted rounded-xl p-5 space-y-3",
            featured && "border-l-4 border-l-primary-deep pl-6"
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-subtle-violet flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {reviewerInitials}
                    </div>
                    <span className="font-bold text-foreground">{reviewerName}</span>
                </div>
                <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < rating ? "text-accent fill-accent" : "text-chip-inactive"} />
                    ))}
                </div>
            </div>
            <p className="text-sm text-muted-foreground italic leading-relaxed">{comment}</p>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">{timeAgo}</p>
        </div>
    );
}
```

- [ ] **Step 6: Create barrel export**

```tsx
// apps/web/src/components/feature/index.ts
export { StatusBadge } from "./StatusBadge";
export { CategoryChip } from "./CategoryChip";
export { GradientButton } from "./GradientButton";
export { VerificationBadge } from "./VerificationBadge";
export { EmptyState } from "./EmptyState";
export { ErrorAlert } from "./ErrorAlert";
export { ContentSkeleton } from "./ContentSkeleton";
export { TrustBanner } from "./TrustBanner";
export { TaskCard } from "./TaskCard";
export { TaskerProfileCard } from "./TaskerProfileCard";
export { StatCard } from "./StatCard";
export { ReviewCard } from "./ReviewCard";
```

- [ ] **Step 7: Verify TypeScript**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | grep "error TS" | head -10`

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/feature/
git commit -m "feat(web): add composite feature components (TrustBanner, TaskCard, TaskerProfileCard, StatCard, ReviewCard) and barrel export"
```

---

### Task 6: Final verification

- [ ] **Step 1: Full TypeScript check**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | grep "error TS" | head -20`
Expected: no new errors

- [ ] **Step 2: Build check**

Run: `cd apps/web && npx vite build 2>&1 | tail -5`
Expected: successful build

- [ ] **Step 3: Verify all feature components exported**

Run: `grep "export" apps/web/src/components/feature/index.ts | wc -l`
Expected: 12

- [ ] **Step 4: Commit any remaining fixes**

```bash
git status apps/web/src/ packages/design-tokens/
# Stage only relevant files
git add apps/web/ packages/design-tokens/tokens.css
git commit -m "feat(web): complete foundation restyle - tokens, fonts, header, 12 shared components"
```
