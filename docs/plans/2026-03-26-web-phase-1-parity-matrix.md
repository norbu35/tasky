# Web Phase 0-1 Parity Matrix

This matrix maps the Phase `0-1` mobile/design inventory to the current web app surface so the implementation plan can target the real gaps instead of guessing.

## Legend

- `aligned` - the web route/page already represents the same screen contract closely enough that only small cleanup is needed.
- `partial` - the web route/page exists, but it combines screens, omits states, or differs in business semantics.
- `missing` - no current web route/page owns the screen.
- `intentionally web-adapted` - the web app should not mirror the mobile screen 1:1; a web-native surface is the right representation.

## Current Web Surface

The current web app exposes these primary routes/pages:

- `/` -> `LandingPage`
- `/auth` -> `AuthPage`
- `/profile` -> `ProfilePage`
- `/customer/dashboard` -> `CustomerDashboardPage`
- `/customer/tasks` -> `CustomerTaskPage`
- `/customer/tasks/new` -> `CustomerTaskPage`
- `/customer/tasks/:taskId` -> `CustomerTaskDetailsPage`
- `/customer/booking-confirmation` -> `BookingConfirmationPage`
- `/customer/booking-payment` -> `BookingConfirmationPage`
- `/tasker/tasks` -> `TaskerFeedPage`
- `/tasker/my-tasks` -> `TaskerTasksPage`
- `/verification` -> `VerificationPage`
- `/booking/safety` -> `BookingSafetyPage`
- `/communication` -> `MessagingNotificationsPage`
- `/banned` -> `RestrictedAccountPage`
- `/admin/*` -> admin surfaces

## Shared

| ID | Mobile screen | Mobile template | Current web owner | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| `SCR-SHARED-001` | Splash / Launch Screen | `auth` | `LandingPage` at `/` | `intentionally web-adapted` | Web uses a public landing page instead of a mobile splash. |
| `SCR-SHARED-002` | Auth - Login | `auth` | `AuthPage` at `/auth` | `partial` | Facebook login exists, but the page still carries web-only dev auth behavior and needs parity cleanup. |
| `SCR-SHARED-005` | Onboarding Carousel | `auth` | none | `missing` | No dedicated web onboarding route exists. |
| `SCR-SHARED-006` | Role Selection | `auth` | none | `missing` | Role selection is not exposed as a web route. |
| `SCR-SHARED-007` | Permission Primer - Camera | `modal_sheet` | none | `intentionally web-adapted` | Web should rely on browser/device permission patterns, not a dedicated mobile primer route. |
| `SCR-SHARED-008` | Permission Primer - Location | `modal_sheet` | none | `intentionally web-adapted` | Same web-native treatment as camera permissions. |
| `SCR-SHARED-009` | Permission Primer - Notifications | `modal_sheet` | none | `intentionally web-adapted` | Web should prompt through browser notification settings only when needed. |
| `SCR-SHARED-010` | Inbox - Conversation List | `feed_list` | `MessagingNotificationsPage` at `/communication` | `partial` | Inbox and notifications are combined into one split-pane page. |
| `SCR-SHARED-011` | Inbox - Chat Detail | `detail` | `MessagingNotificationsPage` at `/communication` | `partial` | Chat detail exists, but not as a dedicated route. |
| `SCR-SHARED-012` | Profile - My Profile | `detail` | `ProfilePage` at `/profile` | `partial` | The page is edit-heavy; it does not yet match the mobile summary-first profile shell. |
| `SCR-SHARED-013` | Profile - Edit Profile | `form_wizard` | `ProfilePage` at `/profile` | `partial` | Edit controls exist inline instead of a separate edit route. |
| `SCR-SHARED-014` | Profile - Settings | `settings` | none | `missing` | No separate settings page exists yet. |
| `SCR-SHARED-015` | Account Deletion Confirmation | `modal_sheet` | none | `missing` | No dedicated delete-account confirmation surface exists yet. |
| `SCR-SHARED-016` | Notification Center | `feed_list` | `MessagingNotificationsPage` at `/communication` | `partial` | Notification center behavior is folded into inbox messaging. |
| `SCR-SHARED-017` | Review Form | `form_wizard` | `BookingSafetyPage` at `/booking/safety` | `partial` | Review UI exists inside booking actions, not as a dedicated review route. |
| `SCR-SHARED-018` | Review Reminder | `modal_sheet` | `BookingSafetyPage` dialogs | `partial` | Reminder behavior is only partially represented through booking actions. |
| `SCR-SHARED-019` | Review Hard Lock | `error_state` | none | `missing` | No dedicated hard-lock route or guard page exists yet. |
| `SCR-SHARED-020` | Suspended Account | `error_state` | none | `missing` | No suspended-account web surface exists yet. |
| `SCR-SHARED-021` | Banned Account | `error_state` | `RestrictedAccountPage` at `/banned` | `partial` | The banned-state page exists, but it also doubles as a generic restricted-account surface. |

## Infrastructure

| ID | Mobile screen | Mobile template | Current web owner | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| `SCR-INFRA-001` | Network Error / Offline | `error_state` | none | `missing` | No dedicated offline/error route exists yet. |
| `SCR-INFRA-002` | App Update | `error_state` | none | `missing` | No update-gate surface exists yet. |
| `SCR-INFRA-003` | Session Expired | `modal_sheet` | none | `missing` | No session-expired modal or page exists yet. |
| `SCR-INFRA-004` | Terms of Service | `detail` | none | `missing` | Legal content is not routed yet. |
| `SCR-INFRA-005` | Help & Support / FAQ | `feed_list` | none | `missing` | No help/FAQ page exists yet. |

## Customer

| ID | Mobile screen | Mobile template | Current web owner | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| `SCR-CUST-001` | My Tasks - Task List | `feed_list` | `CustomerDashboardPage` at `/customer/dashboard` | `partial` | Dashboard covers task list semantics, but it is not a dedicated my-tasks page. |
| `SCR-CUST-002` | Post Task - Category Selection | `feed_list` | `CustomerTaskPage` at `/customer/tasks` | `partial` | Category selection is embedded in the task creation wizard. |
| `SCR-CUST-003` | Post Task - Intake Form | `form_wizard` | `CustomerTaskPage` at `/customer/tasks` | `partial` | Intake exists, but it is part of a combined wizard page. |
| `SCR-CUST-004` | Post Task - Photo Upload | `form_wizard` | `CustomerTaskPage` at `/customer/tasks` | `partial` | Photo upload is embedded in the combined task wizard. |
| `SCR-CUST-005` | Post Task - Location Pin | `form_wizard` | `CustomerTaskPage` at `/customer/tasks` | `partial` | Location pin entry exists inside the combined wizard. |
| `SCR-CUST-006` | Post Task - Schedule & Budget | `form_wizard` | `CustomerTaskPage` at `/customer/tasks` | `partial` | Schedule and budget live in the same task creation page. |
| `SCR-CUST-007` | Post Task - Review & Submit | `detail` | `CustomerTaskPage` at `/customer/tasks` | `partial` | Review/submit is present, but not as a dedicated confirmation screen. |
| `SCR-CUST-008` | Task Posted - Success | `success_celebration` | none | `missing` | No dedicated success page exists after task creation. |
| `SCR-CUST-009` | Task Detail (Customer) | `detail` | `CustomerTaskDetailsPage` at `/customer/tasks/:taskId` | `partial` | Customer task detail exists and is close to the mobile contract. |
| `SCR-CUST-010` | Task Cancel Confirmation | `modal_sheet` | none | `missing` | No dedicated cancellation confirmation surface exists yet. |
| `SCR-CUST-011` | Applicants List | `feed_list` | `CustomerTaskDetailsPage` at `/customer/tasks/:taskId` | `partial` | Applicants are rendered inline in the task detail page. |
| `SCR-CUST-013` | Tasker Public Profile | `detail` | none | `missing` | No public tasker profile route exists yet. |
| `SCR-CUST-014` | Booking Confirmation | `detail` | `BookingConfirmationPage` at `/customer/booking-confirmation` | `partial` | The page exists, but the mobile confirmation flow still needs closer semantic parity. |
| `SCR-CUST-015` | Booking Confirmed - Success | `success_celebration` | `BookingConfirmationPage` at `/customer/booking-confirmation` | `partial` | Success state is rendered inline on the same page instead of a separate route. |
| `SCR-CUST-016` | Customer Bookings List | `feed_list` | `BookingSafetyPage` at `/booking/safety` | `partial` | Booking management exists, but it is merged into a broader safety page. |
| `SCR-CUST-017` | Booking Detail (Customer) | `detail` | `BookingSafetyPage` at `/booking/safety` | `partial` | Booking detail is not a dedicated page yet. |
| `SCR-CUST-018` | Confirm Completion - Decision | `modal_sheet` | `BookingSafetyPage` dialogs | `partial` | Completion is represented as an action dialog, not a separate screen. |
| `SCR-CUST-019` | Booking Timeline | `detail` | none | `missing` | No timeline page exists yet. |
| `SCR-CUST-020` | Reschedule | `form_wizard` | none | `missing` | No reschedule flow exists yet. |
| `SCR-CUST-021` | No-Show Flag + Reminder | `modal_sheet` | none | `missing` | No dedicated no-show reminder surface exists yet. |
| `SCR-CUST-022` | Booking Cancel (Customer) | `modal_sheet` | `BookingSafetyPage` dialogs | `partial` | Cancel exists as a dialog, not as a dedicated screen. |
| `SCR-CUST-023` | Rebook Shortcut | `form_wizard` | none | `missing` | No rebook route exists yet. |
| `SCR-CUST-024` | Dispute - Raise | `form_wizard` | `BookingSafetyPage` dialogs | `partial` | Dispute entry exists, but only as part of booking management. |
| `SCR-CUST-025` | Dispute - Status | `detail` | none | `missing` | No dispute status page exists yet. |
| `SCR-CUST-026` | No Applicant Rescue | `modal_sheet` | none | `missing` | No rescue surface exists yet for tasks with no applicants. |

## Tasker

| ID | Mobile screen | Mobile template | Current web owner | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| `SCR-TASK-001` | Browse - Task Feed | `feed_list` | `TaskerFeedPage` at `/tasker/tasks` | `aligned` | The core browse/feed contract is already represented on web. |
| `SCR-TASK-002` | Task Detail (Tasker) | `detail` | none | `missing` | No tasker task-detail page exists yet. |
| `SCR-TASK-003` | Verification Gate | `auth` | `VerificationPage` at `/verification` | `aligned` | The web verification flow is already its own route. |
| `SCR-TASK-004` | Verification - Consent | `detail` | `VerificationPage` at `/verification` | `aligned` | Consent is represented inside the verification flow. |
| `SCR-TASK-005` | Verification - ID Upload | `form_wizard` | `VerificationPage` at `/verification` | `aligned` | Upload flow exists on the same page. |
| `SCR-TASK-007` | Verification - Pending | `empty_state` | `VerificationPage` at `/verification` | `aligned` | Pending state is already handled in the verification page state machine. |
| `SCR-TASK-008` | Verification - Approved | `success_celebration` | `VerificationPage` at `/verification` | `aligned` | Approved state exists on the same route. |
| `SCR-TASK-009` | Verification - Rejected | `error_state` | `VerificationPage` at `/verification` | `aligned` | Rejected state exists on the same route. |
| `SCR-TASK-010` | Verification Submitted - Success | `success_celebration` | `VerificationPage` at `/verification` | `aligned` | Submission success is already surfaced inline. |
| `SCR-TASK-011` | Application Sent | `success_celebration` | `TaskerFeedPage` at `/tasker/tasks` | `partial` | The state is currently an inline message rather than a dedicated screen. |
| `SCR-TASK-012` | Tasker Bookings (My Jobs) | `feed_list` | `TaskerTasksPage` at `/tasker/my-tasks` | `partial` | My-jobs exists, but still needs closer parity for tasker-specific state handling. |
| `SCR-TASK-013` | Booking Detail (Tasker) | `detail` | none | `missing` | No tasker booking-detail page exists yet. |
| `SCR-TASK-014` | No-Show Flag (Tasker) | `modal_sheet` | none | `missing` | No tasker no-show action surface exists yet. |
| `SCR-TASK-015` | Booking Cancel (Tasker) | `modal_sheet` | none | `missing` | No tasker cancellation surface exists yet. |
| `SCR-TASK-016` | Tasker Stats Dashboard | `detail` | none | `missing` | No stats dashboard route exists yet. |
| `SCR-TASK-018` | Privacy Policy | `detail` | none | `missing` | No privacy policy route exists yet. |
| `SCR-TASK-019` | AI Profile Polish | `detail` | none | `missing` | No tasker profile-polish route exists yet. |

## Notes For The Web Plan

- Phase `2` and `3+` screens are intentionally excluded from this matrix because they are follow-on scope, not active Phase `0-1` parity work.
- The matrix is conservative by design: if a web page combines multiple mobile screens, it is marked `partial` rather than `aligned`.
- This matrix should be used as the implementation checklist for the Phase `0-1` web supplement plan.
