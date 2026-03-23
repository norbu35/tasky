# Tasky Mobile — Design Artifact Stack Specification

**Date:** 2026-03-22
**Status:** Approved
**Scope:** Complete mobile app design pipeline from PRD to Figma Make screen generation

---

## 1. Context & Goal

Produce a complete set of design artifacts that enable consistent, functionally complete mobile screen generation via Figma Make. The artifacts serve as the shared truth layer between product requirements, design generation, and code implementation.

The pipeline follows the robust flow: **PRD → structured requirements → flows/states → components/templates → screen packets → Figma generation → evaluator → implementation handoff.**

## 2. Design Decisions

### App Model
- **Single app, dual-role** — one app serves both Customers and Taskers
- **Role selection at onboarding** — user picks primary role after auth, can switch later via Profile
- **First-time Tasker switch triggers verification flow**

### Navigation
- **4 tabs per role** with role-aware labels:
  - **Customer:** My Tasks / Bookings / Inbox / Profile
  - **Tasker:** Browse / My Jobs / Inbox / Profile
- **FAB (Floating Action Button)** on Customer "My Tasks" tab for "Post Task"
- Tab icons and labels change dynamically based on active role

### Visual Direction
- **Hybrid Split-Card** — dark teal header (person + price), light body (task details)
- Two-tone cards create clear visual hierarchy: person first, task second
- All screens use the **Steppe Diffusion** palette

### Content & Localization
- **Mongolian Cyrillic as primary** with English annotations per prompt
- **16px hard floor** for body text (non-negotiable for Cyrillic readability)
- Bilingual parity — Mongolian copy written for Mongolian readers, not translated

### Phase Strategy
- Design the **full product vision** (Phase 0-1 through 3+)
- Every screen tagged with its phase
- Navigation routes togglable via feature flags as phases go live
- **Phase 0-1:** 65 screens (ship now)
- **Phase 2:** 9 screens (enable with feature toggles)
- **Phase 3+:** 7 screens (enable later)

## 3. Screen Inventory Summary (v3 — 81 screens, ~140 states)

### Shared Screens — Both Roles (21 screens)
1. Splash / Launch Screen
2. Auth — Login (Facebook OAuth + Phone OTP dual)
3. Auth — OTP Verification
4. Auth — OTP Migration Gate (Phase 2)
5. Onboarding Carousel (3 slides)
6. Role Selection
7. Permission Primer — Camera
8. Permission Primer — Location
9. Permission Primer — Notifications
10. Inbox — Conversation List
11. Inbox — Chat Detail (with phone-number flagging warning)
12. Profile — My Profile
13. Profile — Edit Profile
14. Profile — Settings (language, notifications, role switch, account deletion)
15. Account Deletion Confirmation
16. Notification Center
17. Review Form
18. Review Reminder (bottom sheet)
19. Review Hard Lock
20. Suspended Account
21. Banned Account

### Infrastructure Screens (5 screens)
22. Network Error / Offline
23. App Update (soft + force)
24. Session Expired (bottom sheet)
25. Terms of Service
26. Help & Support / FAQ

### Customer Flow (25 screens)
27. My Tasks — Task List (with activation-oriented empty state)
28. Post Task — Category Selection
29. Post Task — Intake Form
30. Post Task — Photo Upload
31. Post Task — Location Pin (map-based)
32. Post Task — Schedule & Budget
33. Post Task — Review & Submit
34. Task Posted — Success
35. Task Detail (Customer) — Open, Assigned, Tasker Marked Done, Completed, Cancelled, No-Show
36. Task Cancel Confirmation
37. Applicants List (with accept confirmation sheet, "Recommended" label Phase 2)
38. Applicant Timeout/Decline (Phase 2)
39. Tasker Public Profile
40. Booking Confirmation (with Add to Calendar)
41. Booking Confirmed — Success
42. Customer Bookings List
43. Booking Detail (Customer) (with Timeline entry, Rebook CTA on completed, Escrow Phase 3)
44. Confirm Completion — Decision
45. Booking Timeline
46. Reschedule (request + receive)
47. No-Show Flag + Reminder
48. Booking Cancel (Customer)
49. Rebook Shortcut
50. Dispute — Raise
51. Dispute — Status
52. No Applicant Rescue
53. Instant Match Customer (Phase 3)

### Tasker Flow (18 screens)
54. Browse — Task Feed (with customer trust signals, activation-oriented empty state, distance filter)
55. Task Detail (Tasker) — Viewable/unverified, Apply/verified, Already Applied, Cap Reached
56. Verification Gate (encouraging interstitial)
57. Verification — Consent
58. Verification — ID Upload (Front, Back, Selfie)
59. Verification — DAN Fast-Path (Phase 2)
60. Verification — Pending
61. Verification — Approved
62. Verification — Rejected
63. Verification Submitted — Success
64. Application Sent
65. Tasker Bookings (My Jobs)
66. Booking Detail (Tasker)
67. No-Show Flag (Tasker)
68. Booking Cancel (Tasker)
69. Tasker Stats Dashboard
70. Lead Unlock — Accept/Decline (Phase 2)
71. Privacy Policy

### Phase 2 Screens (5 screens)
72. Credits — Balance & Purchase
73. Credits — QPay Payment
74. Credits — Transaction History
75. Credits — Low Balance Alert
76. Referral — My Code & Stats

### Phase 3+ Screens (5 screens)
77. Wallet — Balance & Payouts
78. Wallet — Request Payout
79. Escrow — Payment Flow
80. Subscription — Tasker Pro
81. Instant Match — Tasker

## 4. Artifact Stack

All artifacts in `docs/design/`. YAML for machine-readable, Markdown for prose.

| # | Artifact | Format | Depends On | Purpose |
|---|----------|--------|------------|---------|
| 1 | Domain Lifecycle Models | YAML | PRD, API.yaml | State machines for Task, Booking, Application, Verification, Dispute, User |
| 2 | Screen Inventory v3 | YAML | Inventory v2, PM review, UX review | Machine-readable screen list with IDs, routes, roles, phases, states |
| 3 | Component Usage Contract | YAML | Existing components, screen inventory | Canonical components, variants, templates, composition rules |
| 4 | Design System Additions | YAML | Existing tokens, gap analysis | New tokens: disabled, overlay, interactive, icons, density, elevation |
| 5 | Journey Catalog | YAML | Domain lifecycles, PRD Section 6 | Formalized user flows with all paths per goal |
| 6 | Screen Graph | YAML | Journeys, screen inventory | Navigation graph: transitions, guards, data deps |
| 7 | State Coverage Matrix | YAML | Screen graph | Screen × state grid for completeness |
| 8 | Screen Spec Packets | YAML (per screen) | All above | One packet per screen: layout, components, states, copy, API deps |

### Execution Order
```
Phase 1 (parallel):  [1] Domain Lifecycles
                      [2] Screen Inventory v3
                      [3] Component Contract
                      [4] Design System Additions

Phase 2 (after 1):   [5] Journey Catalog

Phase 3 (after 2,5): [6] Screen Graph

Phase 4 (after 6):   [7] State Coverage Matrix

Phase 5 (after all):  [8] Screen Spec Packets

Phase 6:             [9] Evaluator Pass
```

## 5. Component System Architecture

### Canonical Screen Templates
- **Auth** — centered content, single CTA, trust messaging
- **Feed/List** — searchable scrollview, filter bar, cards, FAB overlay
- **Detail** — scrollable content, sticky bottom CTA bar
- **Form/Wizard** — step indicator, form fields, next/back navigation
- **Settings** — grouped list rows with disclosure indicators
- **Modal/Sheet** — bottom sheet with handle, content, action buttons
- **Empty State** — illustration, headline, description, CTA
- **Error State** — icon, message, retry CTA
- **Success/Celebration** — animated checkmark, headline, next steps, CTAs

### Product Grammar Rules
- All forms use the same validation pattern (inline errors below field)
- Destructive actions always use confirmation bottom sheet with explicit copy
- List → Detail flows always use push navigation
- Search/Filter/Sort follow one consistent pattern (filter bar → sheet)
- Pull-to-refresh on all list screens
- Pagination via infinite scroll with footer loading indicator
- Empty states include activation CTAs (not just "nothing here")
- All success moments include "what happens next" guidance

## 6. State Requirements Per Screen Type

Every screen must handle these states where applicable:

| State | When Required | Pattern |
|-------|--------------|---------|
| Loading (initial) | Any screen with async data | Skeleton matching content layout |
| Loading (refresh) | List screens | Pull-to-refresh spinner |
| Loading (pagination) | Paginated lists | Footer spinner |
| Empty | Lists, feeds | Illustration + CTA |
| Error (network) | Any async screen | Shared error component + retry |
| Error (validation) | Forms | Inline per-field |
| Offline | Any screen | Banner + cached content or full-screen |
| Auth required | Protected screens | Login CTA screen |
| Success | After mutations | Confirmation with next steps |
| Partial data | Slow-loading screens | Progressive rendering |

## 7. Evaluation Criteria

The evaluator agent checks:
- Every journey has all screens (no dead ends)
- Every action has a destination/result
- Every API state is represented in UI
- Components map to the design system
- Naming is consistent across all artifacts
- Routes and labels are coherent
- Edge cases exist for all screens
- No screen requires data not defined in API
- Terminology matches across screen specs, journeys, and component labels
- Mongolian copy lengths are realistic (not English-length placeholders)

## 8. Handoff Metadata

Each screen spec packet includes:
- `screen_id` — stable identifier (SCR-{FLOW}-{NNN})
- `route` — Expo Router path
- `feature` — feature module name
- `phase` — deployment phase (0-1, 2, 3)
- `api_endpoints` — required backend endpoints
- `analytics_events` — tracking events
- `acceptance_criteria` — testable requirements
- `figma_page` — target Figma page for organization
