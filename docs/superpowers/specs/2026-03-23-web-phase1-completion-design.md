# Web Application Phase 1 Completion — Design Spec

**Date:** 2026-03-23
**Status:** Approved
**Scope:** Complete all missing web frontend features for Phase 0-1 launch readiness.

## 1. Context

The web app has ~85% of customer/tasker flows complete. The following subsystems are
missing and block Phase 1 launch:

1. **Admin Panel** — 0% built, 21 backend API endpoints already defined in API.yaml
2. **Schema-driven Intake Forms** — 0% built, PRD requires structured intake per category
3. Analytics dashboards and AI Profile Polish are deferred (lower priority)

## 2. Subsystems

### 2.1 Admin API Client Extension

Add admin types and ~21 methods to `apps/web/src/lib/apiClient.ts` following existing
patterns (interface + HttpApiClient implementation).

**Types to add (from API.yaml schemas):**
- `VerificationDetail` — id, user_id, user_phone, user_name, id_card_front_url, id_card_back_url, selfie_url, status (PENDING|APPROVED|REJECTED), admin_notes, submitted_at, reviewed_at
- `FeatureToggle` — feature_name, is_enabled, updated_by, updated_at
- `StrikePolicy` — strikeWindowDays, strikeThreshold, firstSuspensionDays, repeatSuspensionDays, repeatOffenseWindowDays, autoUnsuspendEnabled, updatedAt
- `LeadUnlockPrice` — id, category_id, district_id, credits_required, effective_from, effective_to
- `PayoutRequest` — id, user_id, amount, bank_name, bank_account, status, created_at, processed_at
- `AdminDisputeDetail` — dispute, booking, conversation_id, evidence_messages[]
- `CategorySchemaVersion` — version, status (DRAFT|CANARY|ACTIVE|ROLLED_BACK), schema_json, created_at

**Methods to add (grouped by admin screen):**
1. `adminSearchUsers(token, phone)` → CursorPage<User>
2. `adminBanUser(token, userId, reason)` → User
3. `adminUnbanUser(token, userId)` → User
4. `adminListFlaggedMessages(token)` → CursorPage<Message>
5. `adminListPendingVerifications(token)` → CursorPage<VerificationDetail>
6. `adminApproveVerification(token, id)` → VerificationDetail
7. `adminRejectVerification(token, id, reason)` → VerificationDetail
8. `adminListDisputes(token)` → CursorPage<Dispute>
9. `adminGetDispute(token, id)` → AdminDisputeDetail
10. `adminResolveDispute(token, id, resolution, notes, idempotencyKey)` → Dispute
11. `adminGetStrikePolicy(token)` → StrikePolicy
12. `adminUpdateStrikePolicy(token, payload)` → StrikePolicy
13. `adminListFeatureToggles(token)` → { data: FeatureToggle[] }
14. `adminUpdateFeatureToggle(token, featureName, isEnabled)` → FeatureToggle
15. `adminConciergeAssignTask(token, taskId, taskerId, overrideReason, disclaimerAccepted, idempotencyKey)` → Booking
16. `adminListCategories(token)` → CursorPage<Category>
17. `adminCreateCategory(token, payload)` → Category
18. `adminUpdateCategory(token, id, payload)` → Category
19. `adminListCategorySchemas(token, categoryId)` → { data: CategorySchemaVersion[] }
20. `adminCreateCategorySchema(token, categoryId, schemaJson, activateAs?)` → CategorySchemaVersion
21. `adminActivateCategorySchema(token, categoryId, version, mode)` → CategorySchemaVersion

### 2.2 Admin Shell (Layout + Routing)

- `AdminLayout.tsx` — sidebar navigation, header with user info, content area
- `AdminRoute` guard — redirects non-ADMIN users to `/`
- Sidebar nav items: Verifications, Disputes, Users, Categories, Feature Toggles, Concierge
- Routes added to AppRoutes.tsx under `/admin/*` path prefix
- All admin pages are lazy-loaded

### 2.3 Verification Queue Page

**Route:** `/admin/verifications`
**REQ:** REQ-ADMIN-04

- Table of pending verifications sorted by submission time
- Each row: user name, phone, submitted_at, SLA countdown (24h - elapsed)
- SLA badge: green (>12h left), yellow (4-12h), red (<4h), overdue
- Click row → expand to show ID card images (front/back) + selfie
- Approve / Reject (with reason input) action buttons
- Optimistic update on action, rollback on error

### 2.4 Dispute Manager Page

**Route:** `/admin/disputes` (list) + `/admin/disputes/:id` (detail)
**REQ:** REQ-ADMIN-02

- List: open disputes with task title, customer/tasker names, dispute reason, created_at
- Detail: dispute info, booking context, conversation evidence messages
- Resolution actions: Resolve for Customer / Resolve for Tasker / Escalate
- Mandatory notes field for resolution rationale
- Idempotency key on resolve action

### 2.5 User Moderation Page

**Route:** `/admin/users`
**REQ:** REQ-ADMIN-01, REQ-ADMIN-03

- Search by phone number
- Results table: name, phone, role, status, created_at
- Ban action (with reason) / Unban action per user
- Tab for flagged messages (phone number sharing)

### 2.6 Category Management Page

**Route:** `/admin/categories`
**REQ:** REQ-ADMIN-05

- Category list with name (en/mn), icon, active status, sort order, intake enabled
- Create / Edit category dialog
- Schema management section per category:
  - List schema versions with status badges
  - Create new schema version with JSON editor
  - Activate/Rollback schema version

### 2.7 Feature Toggle Panel

**Route:** `/admin/features`
**REQ:** REQ-ADMIN-06

- List of feature toggles with switch controls
- Toggle names: lead_fee_enabled, subscription_enabled, escrow_enabled, ai_scope_summary_enabled
- Confirmation dialog before toggling
- Last updated by / timestamp display

### 2.8 Concierge Dispatch

**Route:** `/admin/concierge`
**REQ:** REQ-ADMIN-07

- Select from open tasks (reuse existing listTasks API)
- Select verified tasker (search by phone via adminSearchUsers, filter TASKER role)
- Override reason text input
- Liability disclaimer checkbox
- Assign action with idempotency key

### 2.9 Intake Form Renderer

**Location:** `apps/web/src/components/TaskCreation/IntakeFormRenderer.tsx`

Pure component that takes an `intake_schema` JSON and renders:
- `single_select` → radio group
- `multi_select` → checkbox group
- `dropdown` → select element
- `yes_no` → toggle/switch
- `numeric_counter` → number input with +/- buttons

Props: `schema`, `values`, `onChange`, `errors`
Output: structured answers object keyed by field name.

### 2.10 Intake Form Integration

Replace free-text description in CustomerTaskPage with:
1. After category selection, load active intake schema for category
2. Render IntakeFormRenderer with schema
3. On submit, generate deterministic Job Scope Summary from answers
4. Pass structured answers + summary to createTask API

## 3. Dependency Graph

```
Task 1: Admin API Client ──────────┐
                                    ↓
Task 2: Admin Shell ───────────────┐
    ↓         ↓        ↓      ↓   ↓   ↓
  Task 3   Task 4   Task 5  T6  T7  T8
  Verif.   Dispute  Users   Cat Feat Conc.
  Queue    Manager  Mod.    Mgmt Tog  Disp.
                             ↓
Task 9: Intake Renderer ──→ Task 10: Intake Integration
(independent)                (depends on T9 + T8)
```

Tasks 3-8 are independent of each other and can run in parallel.
Task 9 is independent of all admin tasks.

## 4. Execution Methodology

For each task:
1. **Worktree** — `git worktree add` with isolated branch
2. **RED** — Subagent writes comprehensive failing tests
3. **GREEN** — Subagent implements minimal code to pass tests
4. **VERIFY** — Subagent reviews code quality and confirms all tests pass
5. **MERGE** — Branch merged into `feat/mobile-app-remake` after verification

## 5. Tech Stack (existing patterns)

- React 18, Vite, TailwindCSS, shadcn/ui primitives
- Vitest + @testing-library/react for tests
- react-i18next for i18n (en + mn)
- react-router-dom for routing
- Existing apiClient pattern: interface method + HttpApiClient implementation
- Fetch mock pattern: `vi.spyOn(globalThis, "fetch").mockResolvedValue(...)`
