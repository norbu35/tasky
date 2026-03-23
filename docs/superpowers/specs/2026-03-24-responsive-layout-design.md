# Responsive Web Layout Design

## Summary

Make all authenticated web pages responsive and desktop-friendly. Currently locked to mobile-width (672px max). Add adaptive navigation, per-page content widths, and responsive grids.

## Decisions

- **Navigation:** Adaptive bottom → top. Bottom bar on mobile, nav links in header on desktop (md+).
- **Content width:** Per-page via `ScreenFrame` prop. Narrow for forms, default for most pages, wide for feeds/dashboards.
- **Mobile top bar:** Tighten header positioning on mobile for better feel.

---

## 1. Navigation — Adaptive Bottom → Top

### Mobile (< md: 768px)
No changes. Keep:
- Floating `Header` with logo, back button
- Fixed `BottomNavBar` with role-based tabs

### Desktop (md+)
- **BottomNavBar:** Add `md:hidden` to hide on desktop
- **Header:** Add inline nav links on `md:` breakpoint, right-aligned before language switcher
  - **Customer nav:** Home, Tasks, Inbox, Profile
  - **Tasker nav:** Find Work, My Jobs, Inbox, Profile
  - Active route highlighted with accent/primary color
  - Use `useLocation()` from React Router for active state
  - Nav items render as `<NavLink>` components

### Header changes
- Nav items: `hidden md:flex` — invisible on mobile, flex row on desktop
- Profile button already exists on `sm:` — integrate nav links before it
- Max-width: Change from `sm:max-w-5xl` to `max-w-6xl` to align with widest content

---

## 2. ScreenFrame — Adaptive Width Prop

### Current
```tsx
<section className="mx-auto w-full max-w-2xl px-4 pb-28 pt-20 sm:px-6">
```

### New
Add a `maxWidth` prop with three presets:

| Preset | Class | Pixels | Use case |
|--------|-------|--------|----------|
| `"narrow"` | `max-w-2xl` | 672px | Forms, profile, verification, auth-related |
| `"default"` | `max-w-5xl` | 1024px | Most pages — bookings, messaging, task creation |
| `"wide"` | `max-w-6xl` | 1152px | Feed browsing, dashboards, task details |

Default value: `"default"` — so all existing pages automatically widen without code changes.

### Bottom padding
- Mobile: Keep `pb-28` (space for bottom nav)
- Desktop: Reduce to `md:pb-8` since bottom nav is hidden

---

## 3. Page Width Assignments

| Page | Width | Rationale |
|------|-------|-----------|
| `ProfilePage` | narrow | Single-column form |
| `VerificationPage` | narrow | Upload form |
| `BookingConfirmationPage` | narrow | Single confirmation card |
| `BookingSafetyPage` | default | Booking cards + dialogs |
| `CustomerTaskPage` | default | Task creation wizard |
| `MessagingNotificationsPage` | default | Conversation list |
| `CustomerDashboardPage` | wide | Task overview + stats |
| `TaskerFeedPage` | wide | Task browsing grid |
| `TaskerTasksPage` | default | Job list |
| `CustomerTaskDetailsPage` | wide | Task + applicants side-by-side |

---

## 4. Page-Level Responsive Grids

### Task feed / Dashboard (wide pages)
```
Mobile:        1 column (stack)
md (768px+):   2 columns
lg (1024px+):  3 columns
```

### Booking list
```
Mobile:        1 column
md (768px+):   2 columns
```

### Task details + applicants (CustomerTaskDetailsPage)
```
Mobile:        Stacked (task details, then applicants below)
lg (1024px+):  Side-by-side (task 60%, applicants 40%)
```

---

## 5. Mobile Header Fix

Current: `top-4` offset creates floating gap on mobile.

Change:
- Mobile: `top-0` with `px-3 pt-2` — sits at top of screen
- Desktop: Keep floating style with `md:top-4 md:mx-4` or similar offset
- Consistent `rounded-2xl` on desktop, `rounded-none` or `rounded-b-xl` on mobile

---

## 6. Files to Modify

### Layout components (3 files)
- `apps/web/src/layout/ScreenFrame.tsx` — Add `maxWidth` prop, responsive bottom padding
- `apps/web/src/layout/Header.tsx` — Add desktop nav links, fix mobile positioning, align max-width
- `apps/web/src/layout/BottomNavBar.tsx` — Add `md:hidden`

### Pages (10 files)
- `CustomerDashboardPage.tsx` — `maxWidth="wide"`, add responsive grid
- `TaskerFeedPage.tsx` — `maxWidth="wide"`, add responsive grid
- `CustomerTaskDetailsPage.tsx` — `maxWidth="wide"`, add side-by-side layout on lg
- `ProfilePage.tsx` — `maxWidth="narrow"`
- `VerificationPage.tsx` — `maxWidth="narrow"`
- `BookingConfirmationPage.tsx` — `maxWidth="narrow"`
- `BookingSafetyPage.tsx` — responsive booking card grid (`md:grid-cols-2`)
- `TaskerTasksPage.tsx` — responsive grid
- `MessagingNotificationsPage.tsx` — (default width, no change needed)
- `CustomerTaskPage.tsx` — (default width, no change needed)

### No changes needed
- `AuthPage.tsx` — Already has custom responsive layout
- `LandingPage.tsx` — Already responsive with full-bleed sections
- `RestrictedAccountPage.tsx` — Custom layout, already works
- `AdminLayout.tsx` — Already desktop-first with sidebar

---

## 7. Breakpoint Strategy

| Breakpoint | Navigation | Content | Grid |
|-----------|-----------|---------|------|
| < 640px (mobile) | Bottom bar | Full width, narrow max | 1 col |
| 640px (sm) | Bottom bar | Padding increase | 1 col |
| 768px (md) | Top nav in header, bottom hidden | Default/wide max | 2 col |
| 1024px (lg) | Top nav | Wide max | 3 col / side-by-side |
| 1280px+ (xl) | Top nav | Centered with margins | 3 col |

---

## 8. Testing

- Verify all pages render correctly at 375px (mobile), 768px (tablet), 1280px (desktop), 1920px (wide)
- Verify nav links match role (customer vs tasker)
- Verify active route highlighting works
- Verify bottom nav hidden on md+
- Run existing web test suite (205 tests) — should still pass
- Build check: `pnpm --filter @tasky/web build`
