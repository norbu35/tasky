# Authority Chain Alignment Audit — 2026-04-05

**Chain:** PRD.md → journey-catalog.yaml → screen-specs/SCR-*.yaml → Maestro flows
**Method:** Read PRD sections 6.1–6.4 and 7.1–7.5, cross-referenced every JRN-* happy path against Maestro flow YAML and app code navigation.

## Critical Misalignments

### 1. Onboarding happens BEFORE auth — should happen AFTER

| Layer | Says |
|-------|------|
| **PRD §6.1 step 1** | "User downloads app → **Authenticates** (Facebook OAuth) → Creates Profile" |
| **Journey catalog JRN-SHARED-01** | Step 2: Login (002) → Facebook OAuth → Step 3: Onboarding (005) |
| **App code (`index.tsx`)** | `!session && !hasSeenOnboarding → /onboarding` (onboarding BEFORE login) |
| **Maestro flow** | `clearState → expects SCR-SHARED-005` (assumes onboarding before auth) |

**Verdict:** App code and Maestro flow are wrong. PRD and journey catalog agree: auth first, then onboarding for new users.

**App fix needed in `index.tsx`:**
```typescript
// WRONG (current):
!session ? (hasSeenOnboarding ? '/(auth)' : '/onboarding') : ...

// CORRECT (per PRD):
!session ? '/(auth)' : (!hasSeenOnboarding ? '/onboarding' : ...)
```

**Flow fix needed in `JRN-SHARED-01`:**
```yaml
- launchApp: { clearState: true }
- extendedWaitUntil: { visible: { id: "SCR-SHARED-002" }, timeout: 10000 }
- tapOn: { id: "facebook-login-button" }
# After first-time auth, app routes to onboarding because hasSeenOnboarding=false
- extendedWaitUntil: { visible: { id: "SCR-SHARED-005" }, timeout: 30000 }
```

---

### 2. Task posting wizard step order mismatches

| Layer | Order |
|-------|-------|
| **PRD §6.1 step 2** | Intake → **Reviews auto-generated Job Scope Summary (editable)** → Sets Location → Sets Schedule/Budget |
| **Journey catalog JRN-CUST-01** | Photos (004) → **Review (007)** → Location (005) → Schedule (006) |
| **App code** | Photos (004) → **Location (005)** → **Schedule (006)** → **Review (007)** |
| **Maestro flow** | Photos (004) → Location (005) → Schedule (006) → Review (007) |

**Verdict:** App code has drifted from the spec. PRD and journey catalog agree: Review (Job Scope Summary) comes BEFORE Location and Schedule. The app puts it after — meaning users set location and budget before seeing what they're submitting.

**App fix needed:** In `photos.tsx`, navigate to `review` instead of `location`. In `review.tsx`, navigate to `location` instead of `success`. In `schedule.tsx`, navigate to `success` instead of `review`.

Navigation chain fix:
```
category → intake → photos → review → location → schedule → success
```

**Maestro flow `JRN-CUST-01` fix needed:** Reorder the flow steps to match the corrected chain.

---

### 3. JRN-SHARED-03 (OTP Login) — wrong exit screen

| Layer | Exit |
|-------|------|
| **Journey catalog** | Exit: `SCR-SHARED-005` (onboarding — new OTP users also need onboarding) |
| **Maestro flow** | Expects `SCR-CUST-001` (customer home) after OTP verification |

**Verdict:** Flow is wrong. A new user signing up via OTP also needs onboarding. Once auth completes with `hasSeenOnboarding=false`, the app should route to onboarding. Flow must expect `SCR-SHARED-005` not `SCR-CUST-001`.

---

### 4. JRN-CUST-04 (Manage Active Booking) — flow tests wrong path

| Layer | Happy path |
|-------|------------|
| **Journey catalog** | Bookings list → Booking detail → **Tasker marks done** → **Confirm completion (018)** → **Review (017)** |
| **Maestro flow** | Bookings list → Booking detail → **Timeline view (019)** → Back |

**Verdict:** Flow tests the timeline alternate path (JRN-CUST-04-A4), not the happy path. The happy path goes through completion confirmation and review submission. Flow needs rewrite.

---

### 5. JRN-CUST-05 (Rebook) — skips booking confirmation screen

| Layer | Path |
|-------|------|
| **Journey catalog** | Booking detail → Rebook (023) → **Confirm booking (014)** → Success (015) |
| **Maestro flow** | Booking detail → Rebook (023) → ~~skips 014~~ → Success (015) |

**Verdict:** Flow is missing SCR-CUST-014 (booking confirmation + liability disclaimer). Per PRD REQ-BOOK-03, "Booking is final when a Customer accepts an applicant and explicitly accepts liability disclaimer terms."

---

### 6. JRN-CUST-07 (Cancel Open Task) — missing cancel confirmation screen

| Layer | Path |
|-------|------|
| **Journey catalog** | Task detail (009) → **Cancel confirmation (010)** → Task list (001) |
| **Maestro flow** | Task detail (009) → task-cancel-sheet → Task list (001) |

**Action:** Verify whether SCR-CUST-010 is implemented as a separate screen or as the `TaskCancelSheet` component. If the sheet IS SCR-CUST-010 (just implemented as a bottom sheet), add `testID="SCR-CUST-010"` to it and update the flow to assert it.

---

### 7. JRN-CUST-08 (Instant Match) — skips booking confirmation screen

| Layer | Path |
|-------|------|
| **Journey catalog** | Task detail → Instant match (027) → **Confirm booking (014)** → Success (015) |
| **Maestro flow** | Task detail → Instant match (027) → ~~skips 014~~ → Success (015) |

**Verdict:** Same issue as JRN-CUST-05. The booking confirmation with liability disclaimer is required by PRD.

---

### 8. JRN-TASK-03 (Lead Unlock) — wrong entry point

| Layer | Entry |
|-------|-------|
| **Journey catalog** | Entry: `SCR-TASK-017` (notification/lead unlock screen) |
| **Maestro flow** | Starts at `SCR-TASK-012` (My Jobs list), navigates to `SCR-TASK-013` (booking detail) |

**Verdict:** The journey starts when the tasker receives a selection notification. The flow should navigate to or simulate arrival at SCR-TASK-017, not browse from the jobs list.

---

### 9. JRN-TASK-04 (Manage Active Booking - Tasker) — wrong exit

| Layer | Happy path exit |
|-------|-----------------|
| **Journey catalog** | Mark Done → Customer confirms → **Review submission (SCR-SHARED-017)** |
| **Maestro flow** | Mark Done → Confirm sheet → **Jobs list (SCR-TASK-012)** |

**Verdict:** Happy path per PRD goes all the way through to review. Flow stops too early.

---

### 10. JRN-TASK-08 (AI Profile Polish) — wrong entry

| Layer | Entry |
|-------|-------|
| **Journey catalog** | Entry: `SCR-SHARED-013` (profile edit) → Tap "AI polish" → `SCR-TASK-019` |
| **Maestro flow** | Starts directly at `SCR-TASK-019` |

**Verdict:** Flow should start from profile edit screen and navigate to AI polish, not jump directly to it.

---

## Non-Critical Notes

### JRN-TASK-05 (Credit Purchase) — flow entry assumes direct navigation
Journey catalog entry is SCR-P2-001, which is fine. But the flow should show how the tasker navigates to the credits screen (via profile tab → credits link). Currently the flow just waits for SCR-P2-001 without navigating there.

### JRN-TASK-07 (Subscription) — same entry issue
Flow waits for SCR-P3-004 directly without navigating there from the profile/settings.

---

## Summary Matrix

| # | Journey | Issue Type | Severity | Fix Target |
|---|---------|-----------|----------|------------|
| 1 | JRN-SHARED-01 | Auth/onboarding order inverted | **Critical** | App (`index.tsx`) + Flow |
| 2 | JRN-CUST-01 | Wizard step order wrong | **Critical** | App (4 files in `tasks/new/`) + Flow |
| 3 | JRN-SHARED-03 | Wrong exit screen | Medium | Flow |
| 4 | JRN-CUST-04 | Tests alternate path not happy path | Medium | Flow |
| 5 | JRN-CUST-05 | Missing confirmation screen | Medium | Flow |
| 6 | JRN-CUST-07 | SCR-CUST-010 not asserted | Low | App (add testID) + Flow |
| 7 | JRN-CUST-08 | Missing confirmation screen | Medium | Flow |
| 8 | JRN-TASK-03 | Wrong entry point | Medium | Flow |
| 9 | JRN-TASK-04 | Stops before review | Medium | Flow |
| 10 | JRN-TASK-08 | Wrong entry point | Low | Flow |

**Critical items (1 and 2) require app code changes before flows can be corrected.**
All other items are flow-only corrections that must match the journey catalog.
