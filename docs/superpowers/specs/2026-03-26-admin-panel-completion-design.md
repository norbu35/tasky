# Admin Panel Completion — Design Spec

**Date:** 2026-03-26
**Approach:** Two-pass (Pass 1: bug fix + scaffold polish; Pass 2: new pages + API client additions)
**PRD refs:** REQ-ADMIN-01–07, REQ-PAY-36/37, REQ-SAFE-08
**API refs:** `/admin/*` endpoints in `docs/API.yaml`

---

## 1. Scope

### Pass 1 — Bug Fix + Scaffold Polish
| Item | File(s) |
|---|---|
| Fix ADMIN dev login redirect | `apps/web/src/pages/AuthPage.tsx` |
| Polish AdminDisputesPage | `apps/web/src/pages/admin/AdminDisputesPage.tsx` |
| Polish AdminDisputeDetailPage | `apps/web/src/pages/admin/AdminDisputeDetailPage.tsx` |
| Polish AdminConciergePage | `apps/web/src/pages/admin/AdminConciergePage.tsx` |

### Pass 2 — New Pages
| Item | File(s) |
|---|---|
| AdminModerationPage | `apps/web/src/pages/admin/AdminModerationPage.tsx` (new) |
| AdminPayoutsPage | `apps/web/src/pages/admin/AdminPayoutsPage.tsx` (new) |
| AdminLeadPricingPage | `apps/web/src/pages/admin/AdminLeadPricingPage.tsx` (new) |
| API client additions | `apps/web/src/lib/apiClient.ts` |
| Navigation + routing | `AdminLayout.tsx`, `AppRoutes.tsx`, `pages/admin/index.ts` |

---

## 2. Bug Fix — Admin Dev Login Redirect

**Root cause:** `handleDevLogin` in `AuthPage.tsx` always navigates to `returnPath`, which defaults to `/profile` when no `location.state.from` is present. An admin logging in via the dev panel lands on the user profile page and never reaches `/admin`.

**Fix:** Apply a role-aware destination override in `handleDevLogin`:

```ts
// apps/web/src/pages/AuthPage.tsx
const destination = role === 'ADMIN' ? '/admin/verifications' : returnPath;
navigate(destination, { replace: true });
```

**Scope:** One line change. No other files affected. `AdminRoute` guard already correctly gates on `profile.role === 'ADMIN'`.

---

## 3. Scaffold Polish

**Quality bar:** Match the design system consistency of `AdminVerificationsPage`, `AdminUsersPage`, `AdminCategoriesPage`, and `AdminFeaturesPage`. No logic changes — purely component swaps and state presentation upgrades.

**Pattern for all three pages:**
- Loading: `<Skeleton>` cards (3 items)
- Error: `<Card>` with `text-destructive` + `<Button>` Retry
- Empty: `<Card>` with `text-muted-foreground` message
- Mutations: `toast.success` / `toast.error` (already imported via sonner)

### 3.1 AdminDisputesPage

| Current | Target |
|---|---|
| Bare `<table>` with no wrapper | `<div className="overflow-x-auto rounded-lg border"><table>` |
| `<p>Loading...</p>` | 3× `<Skeleton className="h-16 w-full">` in `<Card>` |
| `<p className="text-red-600">Error: {error}</p>` | `<Card>` with destructive text + Retry `<Button>` |
| Bare `<p>No disputes found.</p>` | `<Card>` with `text-muted-foreground` |
| Plain `dispute.status` text | `<Badge>` with variant mapping |
| `hover:bg-gray-50` on rows | `hover:bg-muted/50` |

**Badge variant mapping** (from API enum `OPEN | RESOLVED_TASKER | RESOLVED_CUSTOMER | ESCALATED | CLOSED_INSUFFICIENT_EVIDENCE`):**
```ts
OPEN                         → 'default'
RESOLVED_CUSTOMER            → 'secondary'
RESOLVED_TASKER              → 'secondary'
ESCALATED                    → 'outline'
CLOSED_INSUFFICIENT_EVIDENCE → 'outline'
```

### 3.2 AdminDisputeDetailPage

| Current | Target |
|---|---|
| Raw `<section className="border rounded p-4">` | `<Card><CardContent className="space-y-2 p-6">` |
| `<button className="px-3 py-1 border rounded">Back</button>` | `<Button variant="outline" size="sm">` |
| `<button className="px-4 py-2 bg-blue-600 ...">` resolve buttons | `<Button variant="default">` (Customer) / `<Button variant="default">` (Tasker) |
| `<button className="px-4 py-2 bg-yellow-600 ...">` escalate | `<Button variant="secondary">` |
| Raw `<textarea className="w-full border rounded p-2">` | `<Textarea>` from design system |
| Loading: `<p>Loading...</p>` | `<Skeleton>` cards |
| Error when no detail: bare `<p className="text-red-600">` | `<Card>` with destructive text |
| `dispute.status` raw text | `<Badge>` with variant mapping |

All `disabled={resolving}` logic preserved unchanged.

### 3.3 AdminConciergePage

| Current | Target |
|---|---|
| `<div className="cursor-pointer rounded border p-3 ...bg-blue-50">` task items | `<Card>` with `selected` state: `border-primary bg-primary/10` vs default border |
| `<div className="...bg-green-50">` tasker items | Same `<Card>` selection pattern |
| Raw `<input type="text" className="rounded border px-3 py-2">` | `<Input>` component |
| `<button className="rounded bg-blue-600 ...">Search</button>` | `<Button>` |
| `<button className="rounded bg-green-600 ...">Assign</button>` | `<Button>` |
| Raw `<input type="text">` override reason | `<Input>` |
| Loading: bare `<p>Loading...</p>` | `<div data-testid="concierge-loading">` with 3× `<Skeleton>` |
| Error state: bare `<button>` retry | `<Card>` + `<Button>` |
| Success state: bare `<div>` | `<Card>` with booking details |
| Native checkbox: keep as-is | Wrap label in `<Label>` component |

Remove all hardcoded `bg-blue-600`, `bg-green-600`, `border-blue-500`, `border-green-500` color classes.

---

## 4. New Pages

All new pages follow the same structural pattern as existing admin pages:
- `useCallback` + `useEffect` for data fetching
- Loading / error / empty / ready states
- `session.accessToken` access via `useAppContext`
- `toast.success` / `toast.error` for mutation feedback

### 4.1 AdminModerationPage (`/admin/moderation`)

**PRD basis:** Strike system described in §7.1, REQ-SAFE enforcement.
**API:** `GET /admin/moderation/strike-policy`, `PUT /admin/moderation/strike-policy`
**Nav icon:** `Scale` (lucide-react)

**Data shape (`StrikePolicy`):**
```ts
strikeWindowDays: integer (1–365)
strikeThreshold: integer (1–10)
firstSuspensionDays: integer (1–365)
repeatSuspensionDays: integer (1–365)
repeatOffenseWindowDays: integer (1–730)
autoUnsuspendEnabled: boolean
updatedAt: string (date-time)
```

**UX:**
- Fetches on mount; displays fields in a single `<Card>` in read-only mode
- "Edit" `<Button variant="outline">` toggles all fields to `<Input type="number">` (or `<Switch>` for `autoUnsuspendEnabled`)
- "Save" triggers `adminUpdateStrikePolicy`; on success returns to read-only and shows toast
- "Cancel" discards local edits and returns to read-only
- No confirmation dialog (non-destructive edit, consistent with Categories edit pattern)
- `updatedAt` shown as `text-xs text-muted-foreground` footer in the card

**apiClient:** `adminGetStrikePolicy` and `adminUpdateStrikePolicy` already exist — no additions needed.

### 4.2 AdminPayoutsPage (`/admin/payouts`)

**PRD basis:** REQ-PAY-36, REQ-PAY-37
**API:** `GET /admin/payouts/pending`, `POST /admin/payouts/{id}/process`
**Nav icon:** `Banknote` (lucide-react)
**Phase gate:** 503 → info card "Payouts are not active in the current phase" (not an error toast)

**Data shape (`PayoutRequest`):**
```ts
id: uuid
user_id: uuid
amount: integer (MNT)
bank_name: string
bank_account: string
status: 'PENDING' | 'PROCESSED' | 'REJECTED'
created_at: date-time
processed_at: date-time | null
```

**UX:**
- Table columns: Tasker ID, Bank, Amount (MNT, locale-formatted), Requested At, Actions
- "Process" button per row opens a confirmation `<Dialog>` (destructive variant) — irreversible bank transfer warrants confirmation
- Confirmation triggers `adminProcessPayout(accessToken, id, crypto.randomUUID())`
- On success: row removed from list + toast
- On 409 (off-schedule): toast with message "Payouts can only be processed on Tuesdays and Fridays"
- Backend enforces day-of-week restriction; frontend does not replicate this logic

**apiClient additions:**
```ts
// Interface
adminListPendingPayouts(accessToken: string, cursor?: string, limit?: number): Promise<CursorPage<PayoutRequest>>;
adminProcessPayout(accessToken: string, id: string, idempotencyKey: string): Promise<PayoutRequest>;

// Types
export interface PayoutRequest {
  id: string;
  user_id?: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  created_at: string;
  processed_at: string | null;
}
```

### 4.3 AdminLeadPricingPage (`/admin/pricing`)

**PRD basis:** REQ-PAY-24 (lead unlock pricing is admin-configurable, tier-to-category mapping), REQ-PAY-17
**API:** `GET /admin/lead-unlock-prices`, `POST /admin/lead-unlock-prices`
**Nav icon:** `Tag` (lucide-react)
**Phase gate:** 503 → same info card pattern as Payouts

**Data shape (`LeadUnlockPrice`):**
```ts
id: uuid
category_id: uuid
district_id: string
credits_required: integer (≥1)
effective_from: date-time
effective_to: date-time | null
```

**UX:**
- Table columns: Category ID, District, Credits, Effective From, Effective To (or "—")
- "Create Price" `<Button>` opens a `<Dialog>` form with:
  - `category_id`: `<Input>` (UUID text — no category picker needed at this stage)
  - `district_id`: `<Input>` (string)
  - `credits_required`: `<Input type="number">` (min 1)
  - `effective_from`: `<Input type="datetime-local">`
  - `effective_to`: `<Input type="datetime-local">` (optional, clearable)
- On submit: `adminCreateLeadUnlockPrice` → prepend to list + toast
- No edit/delete (API is append-only; prices are versioned by effective dates)

**apiClient additions:**
```ts
// Interface
adminListLeadUnlockPrices(accessToken: string, cursor?: string, limit?: number): Promise<CursorPage<LeadUnlockPrice>>;
adminCreateLeadUnlockPrice(accessToken: string, payload: LeadUnlockPricePayload): Promise<LeadUnlockPrice>;

// Types
export interface LeadUnlockPrice {
  id: string;
  category_id: string;
  district_id: string;
  credits_required: number;
  effective_from: string;
  effective_to: string | null;
}

export interface LeadUnlockPricePayload {
  category_id: string;
  district_id: string;
  credits_required: number;
  effective_from: string;
  effective_to?: string | null;
}
```

---

## 5. Navigation + Routing

### AdminLayout.tsx — new NAV_ITEMS entries
```ts
{ to: '/admin/moderation', icon: Scale,    label: 'admin.nav.moderation', fallback: 'Moderation' },
{ to: '/admin/payouts',    icon: Banknote, label: 'admin.nav.payouts',    fallback: 'Payouts'    },
{ to: '/admin/pricing',    icon: Tag,      label: 'admin.nav.pricing',    fallback: 'Pricing'    },
```

### AppRoutes.tsx — new admin routes
```tsx
<Route path="moderation" element={<AdminModerationPage />} />
<Route path="payouts"    element={<AdminPayoutsPage />} />
<Route path="pricing"    element={<AdminLeadPricingPage />} />
```

### pages/admin/index.ts — new exports
```ts
export { AdminModerationPage } from './AdminModerationPage';
export { AdminPayoutsPage }    from './AdminPayoutsPage';
export { AdminLeadPricingPage } from './AdminLeadPricingPage';
```

### AppRoutes.tsx — import additions
Add `AdminModerationPage`, `AdminPayoutsPage`, `AdminLeadPricingPage` to the destructured import from `'../pages/admin'`.

---

## 6. PRD Alignment Check

| Requirement | Status after this spec |
|---|---|
| REQ-ADMIN-01: User search (phone/name/FB ID) | ✅ Already done (`AdminUsersPage`) |
| REQ-ADMIN-02: Dispute Manager + misconduct note | ✅ Dispute list + detail done; misconduct note is backend-only in Phase 1 (admin adds note in resolution notes field) |
| REQ-ADMIN-03: Ban User | ✅ Already done (`AdminUsersPage`) |
| REQ-ADMIN-04: Verification Queue, 24h SLA | ✅ Already done (`AdminVerificationsPage`) |
| REQ-ADMIN-05: Category Management | ✅ Already done (`AdminCategoriesPage`) |
| REQ-ADMIN-06: Feature Toggle panel | ✅ Already done (`AdminFeaturesPage`) |
| REQ-ADMIN-07: Concierge Dispatch | ✅ Done (polish in Pass 1) |
| REQ-PAY-36: Pending payout view + process | ✅ `AdminPayoutsPage` (Pass 2) |
| REQ-PAY-37: Tue/Fri processing restriction | ✅ Backend-enforced; frontend surfaces 409 as toast |
| REQ-SAFE-08: Audit log for verification media | ✅ Backend-enforced; frontend uses presigned URLs from API (no change needed) |
| Strike policy management | ✅ `AdminModerationPage` (Pass 2) |
| Lead unlock pricing management | ✅ `AdminLeadPricingPage` (Pass 2) |

---

## 7. Out of Scope

- Pagination controls for Payouts and Lead Pricing (cursor pagination exists in API; load-more UI deferred)
- Category picker dropdown in Lead Pricing form (UUID input sufficient for Phase 2 internal use)
- Misconduct note as a separate UI field (handled via resolution notes in existing Dispute Detail page; backend attaches it internally)
- Mobile admin interface (admin panel is web-only)
