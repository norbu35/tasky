# God Class Decomposition — Delegation Plan

**Date:** 2026-04-14
**Status:** awaiting-review
**Scope:** Backend god class decomposition (AuthService, TaskService)
**Prerequisite:** Boundary enforcement delegation (complete)

## Purpose

Decompose the two largest application services into domain-aligned classes that match the V2 module map
from `ARCHITECTURE.md §2.2`. Each decomposed service should own a single cohesive responsibility,
have its own DAO dependencies, and be testable in isolation.

This is a **behavior-preserving refactor** — no feature changes, no API changes, no schema changes.

## Architecture Reference

From `ARCHITECTURE.md §2.2`, the identity domain is:

```
identity domain → auth, user, security, verification packages
```

But `AuthService` currently holds identity + verification + moderation + profile + search + uploads — six
distinct responsibilities in one 1,345-line file with 10 DAO dependencies and 34 public methods.

Similarly, `TaskService` (1,092 lines) holds task CRUD + applications + photo uploads + draft management +
cross-module notifications + analytics.

## Candidate Assessment

### AuthService (1345 LOC, 34 public methods, 10 DAOs)

| Responsibility Cluster | Methods | DAOs Used | Target Service |
|----------------------|---------|-----------|----------------|
| **Auth lifecycle** (OTP, Facebook, dev login, token refresh, session issue) | `requestOtp`, `verifyOtp` ×2, `facebookLogin`, `devLogin`, `refreshToken` | `UserDao`, `OtpChallengeDao`, `RefreshSessionDao`, `FacebookGraphClient`, `JwtTokenService`, `SmsService` | **AuthService** (keep, ~400 LOC) |
| **Profile management** (get/update profile, avatar upload, user stats, role activation, status resolution) | `getProfile`, `updateProfile`, `updateUserStats`, `activateTaskerRole`, `createAvatarUploadUrl`, `currentUserStatus`, `requiresOtpMigration`, `isInstantMatchAllowed`, `revokeInstantMatch` | `UserDao`, `ProfileDao`, `BadgeDao`, `StorageService` | **UserProfileService** (new, ~250 LOC) |
| **Verification** (submit, approve, reject, query, upload URL) | `submitVerification`, `approveVerification`, `rejectVerification`, `getVerificationStatus`, `getVerificationDetail`, `listPendingVerifications` ×2, `verificationExists`, `createVerificationUploadUrl` | `VerificationDao`, `UserDao`, `ProfileDao`, `StorageService` | **VerificationService** (new, ~300 LOC) |
| **Moderation** (strikes, bans, suspension, policy CRUD) | `addStrike` ×2, `banUser`, `unbanUser`, `getModerationPolicy`, `updateModerationPolicy`, `requestAccountDeletion` | `StrikeDao`, `SuspensionEventDao`, `ModerationPolicyDao`, `UserDao`, `AuditEventDao` | **ModerationService** (new, ~250 LOC) |
| **User search** (phone, name, Facebook ID — admin) | `searchUsersByPhone`, `searchUsersByName`, `searchUsersByFacebookId` | `UserDao`, `ProfileDao` | **UserSearchService** (new, ~150 LOC) |

### TaskService (1092 LOC, ~20 public methods, 8 DAOs + 6 services)

| Responsibility Cluster | Methods | Target Service |
|----------------------|---------|----------------|
| **Task CRUD** (create, get, update, cancel, state transitions) | `createTask`, `getTask`, `updateTask`, `cancelTask`, `transitionTo*` ×4, `updateTaskStatus` | **TaskService** (keep, ~500 LOC) |
| **Task applications** (apply, list, accept, count) | `applyToTask`, `listTaskApplications` ×2, `acceptApplication`, `countApplications` | **TaskApplicationService** (new, ~300 LOC) |
| **Task photos** (upload URL, access URLs) | `createPhotoUploadUrl`, `buildPhotoAccessUrls`, `buildOwnedPhotoAccessUrl` | **TaskPhotoService** (new, ~100 LOC) |
| **Task listings** (marketplace queries, recent locations) | `listTasks`, `listMyTasks`, `recentLocations` | **TaskQueryService** (new, ~200 LOC) |

### Other Large Files (Not Decomposed)

| File | LOC | Verdict |
|------|-----|---------|
| `TaskController` (597) | Controller, not a service. Size is proportional to TaskService. Will naturally shrink once TaskService splits. |
| `BookingPublicOperationService` (372) | Runtime composition — acceptable size for an orchestrator |
| `BookingService` (371) | Core booking state machine — cohesive, single-concern |
| `JdbiConfig` (331) | DAO wiring config — long but mechanical, not a god class |

---

## Program Rules

- **No behavior changes.** The public API surface (ports + controllers) must not change.
- **No schema changes.** No Flyway migrations.
- **Existing tests must keep passing.** Update imports only. Do not change test assertions.
- **Cross-module callers of AuthService must be rewired.** `BookingLifecycleService`, `BookingService`,
  `NoShowService`, `ReviewService`, and `TaskService` currently call `AuthService` directly for
  `addStrike`, `updateUserStats`, `revokeInstantMatch`, and `getProfile`. After decomposition,
  these should call the appropriate new service within the auth module.
- **Identity port handlers stay thin.** `IdentityCommandHandler` and `IdentityQueryHandler` currently
  delegate to `AuthService`. After decomposition, they should delegate to the appropriate new service.
- **Leave JwtAuthenticationFilter alone.** It calls `authService.currentUserStatus()` — this method
  stays in the profile/status resolution service.
- **Commit per tranche.** Each tranche is one commit with a focused scope.

---

## Tranche 1: Extract UserProfileService from AuthService

**One concern:** Profile management, user stats, status resolution.

**Files to create:**
- `auth/application/UserProfileService.java`

**Files to modify:**
- `auth/application/AuthService.java` — remove profile methods, inject UserProfileService where needed
- `identity/application/query/IdentityQueryHandler.java` — `getProfile()` delegates to UserProfileService
- `identity/application/command/IdentityCommandHandler.java` — `updateProfile()`, `activateTaskerRole()`,
  `createAvatarUploadUrl()` delegate to UserProfileService
- `common/security/JwtAuthenticationFilter.java` — if it calls `currentUserStatus()`,
  rewire to UserProfileService

**Methods to move:**
- `getProfile`, `updateProfile`, `updateUserStats`, `activateTaskerRole`, `createAvatarUploadUrl`,
  `currentUserStatus`, `requiresOtpMigration`, `isInstantMatchAllowed`, `revokeInstantMatch`,
  `toProfile`, `resolveUserStatus` (shared helper — keep in AuthService and make package-visible,
  OR extract to a shared `UserStatusResolver` utility)

**DAOs to inject in new service:** `UserDao`, `ProfileDao`, `BadgeDao`, `StorageService`,
`StorageKeyPolicy`, `SuspensionEventDao` (for status resolution)

**Tricky detail:** `resolveUserStatus()` is used by both auth lifecycle and profile methods.
Extract it to a package-private `UserStatusResolver` utility class that both `AuthService` and
`UserProfileService` can inject.

**Cross-module rewiring:**
- `TaskService.applyToTask()` calls `authService.getProfile()` → change to `userProfileService.getProfile()`
- `BookingService.markBookingDone()` calls `authService.updateUserStats()` → change to `userProfileService.updateUserStats()`
- `BookingService.markBookingDone()` calls `authService.revokeInstantMatch()` → change to `userProfileService.revokeInstantMatch()`
- `ReviewService.submitReview()` calls `authService.updateUserStats()` → change to `userProfileService.updateUserStats()`

**Verification:**
```bash
./gradlew :services:api:test --tests "mn.tasky.architecture.*"
./gradlew :services:api:test --tests "mn.tasky.auth.*"
```

**Success condition:** AuthService drops to ~1,000 LOC. New UserProfileService is ~250 LOC.
All existing tests pass with import-only changes.

---

## Tranche 2: Extract VerificationService from AuthService

**One concern:** KYC verification lifecycle.

**Files to create:**
- `auth/application/VerificationService.java`

**Files to modify:**
- `auth/application/AuthService.java` — remove verification methods
- `identity/application/query/IdentityQueryHandler.java` — verification queries delegate to VerificationService
- `identity/application/command/IdentityCommandHandler.java` — verification commands delegate to VerificationService

**Methods to move:**
- `submitVerification`, `approveVerification`, `rejectVerification`, `getVerificationStatus`,
  `getVerificationDetail`, `listPendingVerifications` ×2, `verificationExists`,
  `createVerificationUploadUrl`, `toVerificationDetail`, `safeVerificationDownloadUrl`, `resolveVerification`

**DAOs to inject:** `VerificationDao`, `UserDao`, `ProfileDao`, `StorageService`, `StorageKeyPolicy`

**No cross-module callers** — verification is only called through the identity ports.

**Verification:**
```bash
./gradlew :services:api:test --tests "mn.tasky.auth.*"
./gradlew :services:api:test --tests "mn.tasky.architecture.*"
```

**Success condition:** AuthService drops to ~700 LOC. New VerificationService is ~300 LOC.

---

## Tranche 3: Extract ModerationService from AuthService

**One concern:** Strike/suspension/ban policy and account deletion.

**Files to create:**
- `auth/application/ModerationService.java`

**Files to modify:**
- `auth/application/AuthService.java` — remove moderation methods
- `identity/application/query/IdentityQueryHandler.java` — `getModerationPolicy()` delegates to ModerationService
- `identity/application/command/IdentityCommandHandler.java` — `banUser`, `unbanUser`,
  `updateModerationPolicy`, `requestAccountDeletion` delegate to ModerationService

**Methods to move:**
- `addStrike` ×2, `banUser`, `unbanUser`, `getModerationPolicy`, `updateModerationPolicy`,
  `moderationPolicy`, `validatePolicy`, `requestAccountDeletion`

**DAOs to inject:** `StrikeDao`, `SuspensionEventDao`, `ModerationPolicyDao`, `UserDao`, `AuditEventDao`

**Cross-module rewiring:**
- `BookingLifecycleService.cancelBooking()` calls `authService.addStrike()` → change to `moderationService.addStrike()`
- `NoShowService.flagNoShow()` calls `authService.addStrike()` → change to `moderationService.addStrike()`

**Verification:**
```bash
./gradlew :services:api:test --tests "mn.tasky.auth.*"
./gradlew :services:api:test --tests "mn.tasky.booking.*"
./gradlew :services:api:test --tests "mn.tasky.architecture.*"
```

**Success condition:** AuthService drops to ~500 LOC. New ModerationService is ~250 LOC.

---

## Tranche 4: Extract UserSearchService from AuthService

**One concern:** Admin user search (phone, name, Facebook ID).

**Files to create:**
- `auth/application/UserSearchService.java`

**Files to modify:**
- `auth/application/AuthService.java` — remove search methods
- `identity/application/query/IdentityQueryHandler.java` — search methods delegate to UserSearchService

**Methods to move:**
- `searchUsersByPhone`, `searchUsersByName`, `searchUsersByFacebookId`,
  `searchUsersByPhoneExact`, `parseUserSearchCursor`

**DAOs to inject:** `UserDao`, `ProfileDao`, `CryptoService`
(needs `UserStatusResolver` from Tranche 1 and `toProfile` from UserProfileService)

**No cross-module callers** — search is only called through the identity port.

**Verification:**
```bash
./gradlew :services:api:test --tests "mn.tasky.auth.*"
./gradlew :services:api:test --tests "mn.tasky.architecture.*"
```

**Success condition:** AuthService drops to ~400 LOC (pure auth lifecycle).
New UserSearchService is ~150 LOC.

---

## Tranche 5: Extract TaskApplicationService from TaskService

**One concern:** Task application lifecycle (apply, list, accept).

**Files to create:**
- `task/application/TaskApplicationService.java`

**Files to modify:**
- `task/application/TaskService.java` — remove application methods
- `task/api/TaskController.java` — application endpoints inject TaskApplicationService

**Methods to move:**
- `applyToTask`, `listTaskApplications` ×2, `acceptApplication`, `countApplications`

**DAOs to inject:** `TaskDao`, `TaskApplicationDao`, `BookingCommandPort`, `NotificationService`,
`AnalyticsService`, `MessagingService`, `DomainEventOutboxService`, `ReviewEnforcementService`

**Tricky detail:** `acceptApplication` is the most complex method (~60 LOC) — it creates a booking,
sends notifications, fires analytics. All of this moves as-is.

**Verification:**
```bash
./gradlew :services:api:test --tests "mn.tasky.task.*"
./gradlew :services:api:test --tests "mn.tasky.architecture.*"
```

**Success condition:** TaskService drops to ~800 LOC. New TaskApplicationService is ~300 LOC.

---

## Tranche 6: Extract TaskPhotoService and TaskQueryService from TaskService

**One concern:** Photo management and marketplace query logic.

**Files to create:**
- `task/application/TaskPhotoService.java`
- `task/application/TaskQueryService.java`

**Files to modify:**
- `task/application/TaskService.java` — remove photo and listing methods
- `task/api/TaskController.java` — photo and listing endpoints inject new services

**TaskPhotoService methods:**
- `createPhotoUploadUrl`, `buildPhotoAccessUrls`, `buildOwnedPhotoAccessUrl`

**TaskQueryService methods:**
- `listTasks`, `listMyTasks`, `recentLocations`

**Verification:**
```bash
./gradlew :services:api:test --tests "mn.tasky.task.*"
./gradlew :services:api:test --tests "mn.tasky.architecture.*"
```

**Success condition:** TaskService drops to ~500 LOC (pure task CRUD + state transitions).

---

## Tranche 7: Dead code cleanup + final docs sync

**One concern:** Remove confirmed dead code and sync documentation.

**Files to delete:**
- `analytics/application/KpiReportService.java`
- `analytics/domain/KpiReport.java`
- `notification/dto/UnregisterDeviceRequest.java`

**Files to modify:**
- `CHANGELOG.md` — note decomposition
- `docs/ARCHITECTURE.md` — update if any module descriptions changed

**Verification:**
```bash
./gradlew :services:api:test --tests "mn.tasky.architecture.*"
./gradlew gateSmoke
```

---

## Final State

| File | Before | After |
|------|--------|-------|
| `AuthService` | 1,345 LOC, 34 methods, 10 DAOs | ~400 LOC, 8 methods (pure auth lifecycle) |
| `UserProfileService` | — | ~250 LOC (profile, stats, status, uploads) |
| `VerificationService` | — | ~300 LOC (KYC lifecycle) |
| `ModerationService` | — | ~250 LOC (strikes, bans, policy) |
| `UserSearchService` | — | ~150 LOC (admin search) |
| `UserStatusResolver` | — | ~30 LOC (shared status helper) |
| `TaskService` | 1,092 LOC, 20 methods, 14 deps | ~500 LOC (CRUD + transitions) |
| `TaskApplicationService` | — | ~300 LOC (apply, list, accept) |
| `TaskPhotoService` | — | ~100 LOC (photo URLs) |
| `TaskQueryService` | — | ~200 LOC (marketplace queries) |

---

## Non-Goals

- Do not move DAOs or rename DAO packages
- Do not touch flyway migrations
- Do not change the identity publicapi port interfaces (only change which internal service the handlers delegate to)
- Do not restructure controllers beyond changing injected service references
- Do not decompose BookingService, DisputeService, or other mid-size services — they are cohesive
- Do not introduce new publicapi ports in this pass — the existing identity ports suffice

## Delegation Guidance

Each tranche is designed for a weaker implementation model:
- Small file set (1 create + 2-4 modify)
- Clear method list to move (copy → paste → delete → rewire callers)
- Explicit verification commands
- No architectural judgment required — just refactoring mechanics
