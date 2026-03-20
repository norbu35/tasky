# Web App Figma Restyle Design

**Date:** 2026-03-20
**Status:** Approved
**Scope:** Restyle the existing web app to match the Figma design language, adding missing consumer UX patterns. Sub-project 1 of 3 (Foundation + Core Pages + UX Completeness).

## Problem

The web app has 12 functional pages with routing, API wiring, and i18n, but uses generic shadcn/ui styling that looks like an admin panel. The Figma designs define a polished consumer-grade visual language (deep purple, amber trust system, Manrope headings, bento layouts) that has been implemented on mobile. The web needs the same treatment — plus missing UX patterns (empty states, loading states, error handling, accessibility) that a consumer product requires.

## Decisions

- **Visual direction:** Desktop-adapted — same Figma design language (colors, fonts, components) adapted for wider viewports with multi-column layouts. Responsive down to mobile.
- **Navigation:** Role-aware with dev toggle — nav shows only links for the user's current role (CUSTOMER or TASKER), with a dev-only toggle to switch role view.
- **Approach:** Restyle existing pages in-place. Add missing web equivalents of mobile-only screens (ReviewForm, RescheduleModal, VerificationFlow). No router structure changes, no API client changes.

---

## 1. Foundation: Theme + Layout Shell

### Reconcile `tokens.css` with `tokens.ts` (Figma source of truth)

**Critical prerequisite.** The existing `tokens.css` `:root` values diverge from `tokens.ts` (the Figma palette). Before adding new tokens, update existing `:root` values to match `tokens.ts`:

| Variable | Current (tokens.css) | Corrected (tokens.ts) |
|----------|---------------------|-----------------------|
| `--tasky-color-primary` | `243 75% 59%` | `263 70% 50%` |
| `--tasky-color-background` | `210 40% 98%` | `0 0% 98%` |
| `--tasky-color-foreground` | `222.2 84% 4.9%` | `0 0% 9%` |
| `--tasky-color-secondary` | `210 40% 96.1%` | `251 91% 95%` |
| `--tasky-color-secondary-foreground` | `222.2 47.4% 11.2%` | `264 67% 35%` |
| `--tasky-color-muted` | `210 40% 96.1%` | `0 0% 95%` |
| `--tasky-color-muted-foreground` | `215.4 16.3% 46.9%` | `265 8% 40%` |
| `--tasky-color-accent` | `316 70% 50%` (magenta) | `38 92% 50%` (amber) |
| `--tasky-color-accent-foreground` | `210 40% 98%` | `0 0% 0%` |
| `--tasky-color-border` | `214.3 31.8% 91.4%` | `240 6% 90%` |
| `--tasky-color-input` | `214.3 31.8% 91.4%` | `240 6% 90%` |
| `--tasky-color-ring` | `243 75% 59%` | `263 70% 50%` |

### New CSS Custom Properties

Add to `tokens.css` `:root` block:

```css
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
```

Bridge in `styles.css` `:root`:
```css
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
```

### Font Imports

```css
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
```

**Breaking change:** Replaces Inter with Plus Jakarta Sans as the default body font. Intentional — matches the Figma design system.

### Tailwind Config Additions

**Font families:**
```ts
fontFamily: {
  display: ['Manrope', 'system-ui', 'sans-serif'],
  sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
}
```

**Color extensions:**
```ts
colors: {
  "primary-deep": "hsl(var(--primary-deep))",
  trust: {
    DEFAULT: "hsl(var(--trust))",
    foreground: "hsl(var(--trust-foreground))",
    muted: "hsl(var(--trust-muted))",
  },
  status: {
    open: "hsl(var(--status-open))",
    "open-foreground": "hsl(var(--status-open-foreground))",
    assigned: "hsl(var(--status-assigned))",
    "assigned-foreground": "hsl(var(--status-assigned-foreground))",
  },
  verified: "hsl(var(--verified))",
  "subtle-violet": "hsl(var(--subtle-violet))",
  "chip-inactive": "hsl(var(--chip-inactive))",
  "nav-inactive": "hsl(var(--nav-inactive))",
}
```

**Border radius:** Add alongside existing shadcn keys (do NOT replace `sm`/`md`/`lg`):
```ts
borderRadius: {
  xl: "12px",
  "2xl": "16px",
  full: "9999px",
}
```

### Header Redesign

- Frosted glass: `bg-background/75 backdrop-blur-md`
- Left: "Tasky" brand in `text-primary-deep font-display font-extrabold text-xl`
- Center: role-filtered nav links with active pill
  - TASKER: Find Work, My Jobs, Inbox
  - CUSTOMER: Dashboard, Tasks, Inbox
  - Common (always): Profile
- Right: avatar circle + sign out
- **Null role fallback:** Show only Profile link when profile is null/loading
- **Removed nav entries:** `/customer/tasks/new`, `/customer/booking-confirmation`, `/booking/safety` removed from top nav — reached via in-flow navigation only
- **Dev toggle:** fixed bottom-right, only in `import.meta.env.DEV`
- **Mobile (< 768px):** Hamburger menu replacing horizontal nav

### ScreenFrame Update

- Background: `bg-[#F9F9F9]` (flat, no gradient)
- Content: `max-w-6xl mx-auto px-6 pt-24 pb-12`
- Header retains `max-w-7xl` (intentionally wider)

---

## 2. Shared Web Components

Create in `apps/web/src/components/feature/`:

| Component | Description |
|-----------|-------------|
| `StatusBadge` | Pill badge: OPEN=green, ASSIGNED=violet, COMPLETED=emerald, CANCELLED=gray, NO_SHOW=red |
| `CategoryChip` | Pill filter with active (primary fill + shadow) / inactive states |
| `TrustBanner` | Amber bordered (default) or solid amber (compact). Shield + title + description |
| `TaskCard` | Category icon + status badge + title + description snippet + location/time meta + budget. **Hierarchy: description > category+verification > distance/time > budget** (trust-first, not price-first) |
| `TaskerProfileCard` | Avatar with verification checkmark overlay + name + star rating + review count + pro badge + bio snippet + "Message Tasker" button. Used on task detail, booking confirmation |
| `StatCard` | Number + label, muted bg, centered |
| `ReviewCard` | Initials avatar + stars + italic comment + timestamp. Featured variant: left purple border |
| `GradientButton` | CSS gradient primaryDeep→primary with shadow. Disabled state: opacity-50. Loading state: spinner |
| `EmptyState` | Icon + headline + description + optional CTA button. Reusable across all pages |
| `ErrorAlert` | Error message + "Retry" button + optional "Contact support" link |
| `ContentSkeleton` | Animated shimmer skeleton matching card/list shapes. Variants: card, list-item, profile |
| `VerificationBadge` | Small green checkmark overlay for avatars (verified) or amber shield (pro) |

**Component states matrix:**

| Component | Default | Hover | Active/Selected | Disabled | Loading |
|-----------|---------|-------|-----------------|----------|---------|
| GradientButton | gradient bg | translate-y-[-1px] + brighter | — | opacity-50, no pointer | spinner replaces text |
| CategoryChip | chip-inactive bg | slight darken | primary fill + shadow | — | — |
| TaskCard | white bg, subtle shadow | border-primary/30 | — | — | ContentSkeleton |
| StatusBadge | status color | — | — | — | — |

---

## 3. Core Page Restyling (4 pages)

### TaskerFeedPage

**Structural refactor** of existing filter UI (not just restyle). Current: dropdown + lat/lng/radius inputs. New: hero search + category chips.

- Hero: `font-display font-extrabold text-3xl`, "Service Task" in `text-primary-deep`
- Search bar: `bg-muted rounded-xl h-14 px-4` with search icon
- Category chips: horizontal flex, `CategoryChip` components
- Trust banner: `TrustBanner`
- Section header: "Available Tasks" + "See map" link
- Task grid: `grid grid-cols-1 md:grid-cols-2 gap-4` using `TaskCard`
- **Empty state:** "No tasks nearby" icon + "Try expanding your search radius or check back soon" + "Post a task" CTA (for customers)
- **Loading state:** 4x `ContentSkeleton` variant="card" in 2-column grid
- **Error state:** `ErrorAlert` with retry

### CustomerTaskPage (task wizard)

- Progress bar: `h-1 bg-muted` track + `bg-primary-deep` fill
- Step indicator: "Step X of 4"
- Step 1: Category bento grid `grid grid-cols-2 lg:grid-cols-3 gap-4`
- Steps 2-4: `grid grid-cols-1 md:grid-cols-2 gap-6`
- Sticky footer: Back (outline) + Next/Post (GradientButton)
- **Draft persistence:** Auto-save form state to `localStorage` every 5s. On revisit: "Resume your draft?" prompt

### CustomerTaskDetailsPage

- `StatusBadge` at top
- Title in `font-display font-extrabold text-3xl`
- **When ASSIGNED:** `TaskerProfileCard` prominently at top with "Confirmed Tasker" label, booking timeline below
- **When OPEN:** Applicant list with `TaskerProfileCard` per applicant, "Recommended" badge on top-ranked
- Bento detail grid: Date/Time + Budget + Address
- Map placeholder
- Actions: `GradientButton` ("Mark Complete") + "Reschedule" + "Report Issue"
- **"Book Again" CTA** on COMPLETED bookings — navigates to `/customer/tasks/new?repost={taskId}`

### ProfilePage

**Information hierarchy reordered** (reviews before bio for trust):
1. Avatar (with `VerificationBadge` overlay) + Name + Title — centered
2. Star rating + review count — largest secondary text
3. Stats grid: Completion Rate, Avg Rating, Response Time
4. **Featured review** — most recent 5-star review card
5. Bio card
6. All reviews list
7. CTA: `GradientButton` ("Book a Session")
- **Verification status:** Prominent green "✓ Identity Verified" pill or "Complete verification" CTA for unverified taskers

---

## 4. Missing Pages (web equivalents of mobile screens)

These exist on mobile but not on web. Create web versions:

| Page | Route | What it does |
|------|-------|--------------|
| `ReviewSubmissionPage` | `/bookings/{bookingId}/review` | Post-completion star ratings (per-category) + freetext. Matches mobile `ReviewForm` |
| `DisputeFilingPage` | `/bookings/{bookingId}/dispute` | Reason selection + evidence upload (photo, chat excerpt, timeline). At least 1 artifact required |
| `RescheduleDialog` | Modal from task detail | New date/time + reason. Counterparty accept/decline. Matches mobile `RescheduleModal` |
| `TaskerVerificationPage` | `/tasker/verification` | ID upload (front + back + selfie) via presigned URLs. Status tracking (PENDING/VERIFIED/REJECTED). SLA display |

---

## 5. Remaining Pages (restyle-only)

Apply Figma tokens and typography, keep existing structure:

- **AuthPage** — gradient CTA, "Tasky" brand, muted bg
- **LandingPage** — display font hero, primaryDeep accent, category preview, trust banner
- **CustomerDashboardPage** — `TaskCard` components, updated tab colors
- **BookingConfirmationPage** — `TaskerProfileCard` + liability disclaimer + `GradientButton`
- **BookingSafetyPage** — restyle cards and typography
- **MessagingNotificationsPage** — muted bgs, primaryDeep accents
- **TaskerTasksPage** — `StatusBadge` + bento booking cards
- **RestrictedAccountPage** — danger color scheme

---

## 6. UX Patterns (all pages)

### Empty States

Every page with data-dependent content must have an empty state:

| Page | Empty State |
|------|-------------|
| TaskerFeedPage | "No tasks nearby" + expand radius suggestion + post task CTA |
| CustomerDashboardPage | "No tasks yet" + "Post your first task" CTA with category icons |
| TaskerTasksPage | "No bookings yet" + "Browse available tasks" CTA |
| MessagingNotificationsPage | "No conversations" + explanation of when messages appear |
| ProfilePage (reviews) | "No reviews yet" + "Complete a booking to earn your first review" |

Use the `EmptyState` component: icon + headline + description + CTA.

### Loading States

- **List/feed pages:** `ContentSkeleton` grid matching final layout shape (animated shimmer)
- **Detail pages:** `ContentSkeleton` with card + text block shapes
- **Form submissions:** Spinner inside `GradientButton` (button disabled during submission)
- **Never use bare spinners** for content loads — always skeleton

### Error States

- **API failures:** `ErrorAlert` with message + "Retry" button
- **Network timeout:** "Connection lost" banner at top of page with auto-retry countdown
- **Validation errors:** Field-level red border + error text below field (existing shadcn pattern)
- **Auth errors (401):** Auto-redirect to `/auth` (existing behavior)

### First-Time User Experience

- **Post-signup redirect:** Goes to `/profile` (existing). Profile page shows:
  - For CUSTOMER: "Welcome! Post your first task" hero card with category icons
  - For TASKER: "Complete verification to start earning" card with ID upload CTA
- **No separate onboarding wizard** — guidance is contextual on each page via empty states

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| `sm` | 640px+ | Single column, larger touch targets |
| `md` | 768px+ | 2-column grids, side-by-side fields |
| `lg` | 1024px+ | Full desktop layout, 3-column category grids |
| `xl` | 1280px+ | Max-width container, comfortable spacing |

**Mobile-specific (< 768px):**
- Header: hamburger menu (nav items in dropdown)
- Task cards: single column, full width
- Bento grids: stack vertically
- Sticky footer: full-width, safe-area padding
- All touch targets: minimum 44px height

---

## 8. Accessibility

### WCAG AA Baseline

- **Contrast:** All text must meet 4.5:1 for body text, 3:1 for large text (18px+). Verify all token color pairs.
- **Focus states:** All interactive elements show `ring-2 ring-primary ring-offset-2` on keyboard focus. Visible on both light and dark backgrounds.
- **Keyboard navigation:** Tab order follows visual order. All actions reachable without mouse.
- **Screen reader labels:** All icon-only buttons have `aria-label`. Status badges have `role="status"`. Form fields have associated labels.
- **Reduced motion:** Respect `prefers-reduced-motion` — disable shimmer animations, transitions.

---

## 9. What Stays Unchanged

- React Router structure (all existing routes stay)
- API client (`apiClient.ts`)
- React Query hooks (`@tasky/core`)
- AppContext / AppShell
- shadcn/ui base primitives — rethemed via CSS variables only
- i18n setup and translation files

## 10. Out of Scope

- Backend API changes
- Dark mode (deferred — plan HSL inversions for future)
- Map integration (stays placeholder)
- Photo upload UX improvements (camera/gallery picker)
- Infinite scroll / pagination UX (keep existing "load more" pattern)
- Applicant filtering/sorting beyond "Recommended" badge
