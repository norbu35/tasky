# Mobile Route Normalization Matrix (63-screen scope)

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans`.

This matrix separates external route contract (`docs/design/screen-specs`) from internal Expo href/file targets to avoid ambiguity during parallel implementation.

| SCR-ID | Lane | Screen | Figma node | Spec Route Contract | Canonical Expo Href | Canonical File | Surface | Notes |
|---|---|---|---|---|---|---|---|---|
| SCR-SHARED-001 | Agent 1 | Splash / Launch | 2:87 | `/` | `/` | `app/index.tsx` | route |  |
| SCR-SHARED-002 | Agent 1 | Auth — Login | 2:320 | `/auth/login` | `/(auth)` | `app/(auth)/index.tsx` | route |  |
| SCR-SHARED-003 | Agent 1 | Auth — OTP Verification | 2:193 | `/auth/otp-verify` | `/(auth)/otp` | `app/(auth)/otp.tsx` | route |  |
| SCR-SHARED-004 | Agent 1 | Auth — OTP Migration Gate | 2:413 | `/auth/otp-migration` | `/(auth)/otp-migration` | `app/(auth)/otp-migration.tsx` | route |  |
| SCR-SHARED-005 | Agent 1 | Onboarding Carousel | 2:2 | `/onboarding` | `/onboarding` | `app/onboarding.tsx` | route |  |
| SCR-SHARED-006 | Agent 1 | Role Selection | 2:38 | `/onboarding/role` | `/(auth)/role-select` | `app/(auth)/role-select.tsx` | route |  |
| SCR-SHARED-007 | Agent 1 | Permission Primer — Camera | 2:119 | `/onboarding/permission-camera` | `/(auth)/permission-camera` | `app/(auth)/permission-camera.tsx` | route |  |
| SCR-SHARED-008 | Agent 1 | Permission Primer — Location | 2:250 | `/onboarding/permission-location` | `/(auth)/permission-location` | `app/(auth)/permission-location.tsx` | route |  |
| SCR-SHARED-009 | Agent 1 | Permission Primer — Notifications | 2:362 | `/onboarding/permission-notifications` | `/(auth)/permission-notifications` | `app/(auth)/permission-notifications.tsx` | route |  |
| SCR-SHARED-010 | Agent 2A | Inbox — Conversation List | 2:451 | `/inbox` | `/(tabs)/inbox` | `app/(tabs)/inbox/index.tsx` | route |  |
| SCR-SHARED-011 | Agent 2A | Inbox — Chat Detail | 2:553 | `/inbox/:conversationId` | `/(tabs)/inbox/[id]` | `app/(tabs)/inbox/[id].tsx` | route |  |
| SCR-SHARED-012 | Agent 2A | Profile — My Profile | 2:817 | `/profile` | `/(tabs)/profile` | `app/(tabs)/profile.tsx` | route |  |
| SCR-SHARED-013 | Agent 2A | Profile — Edit Profile | 2:756 | `/profile/edit` | `/(shared)/profile/edit` | `app/(shared)/profile/edit.tsx` | route |  |
| SCR-SHARED-014 | Agent 2A | Profile — Settings | 2:634 | `/profile/settings` | `/(shared)/profile/settings` | `app/(shared)/profile/settings.tsx` | route |  |
| SCR-SHARED-015 | Agent 2A | Account Deletion Confirmation | 2:902 | `/profile/settings/delete` | `/(shared)/profile/delete` | `app/(shared)/profile/delete.tsx` | route |  |
| SCR-SHARED-016 | Agent 2A | Notification Center | 2:988 | `/notifications` | `/(shared)/notifications` | `app/(shared)/notifications.tsx` | route |  |
| SCR-SHARED-017 | Agent 2A | Review Form | 2:1089 | `/(shared)/review/:bookingId` | `/(shared)/review/[bookingId]` | `app/(shared)/review/[bookingId].tsx` | route | Route contract migrated to booking-scoped review path; no compatibility alias required. |
| SCR-SHARED-018 | Agent 2A | Review Reminder | 2:1180 | `null` | `/(shared)/review/[bookingId]` | `features/review/components/ReviewReminder.tsx` | embedded component |  |
| SCR-SHARED-019 | Agent 2A | Review Hard Lock | 2:1215 | `null` | `/(shared)/review/[bookingId]` | `features/review/components/ReviewHardLock.tsx` | embedded component |  |
| SCR-SHARED-020 | Agent 2A | Suspended Account | 2:1270 | `/account/suspended` | `/(shared)/account/suspended` | `app/(shared)/account/suspended.tsx` | route |  |
| SCR-SHARED-021 | Agent 2A | Banned Account | 2:1325 | `/account/banned` | `/(shared)/account/banned` | `app/(shared)/account/banned.tsx` | route |  |
| SCR-INFRA-001 | Agent 2B | Network Error / Offline | 2:1360 | `null` | `/(shared)/network-error` | `app/(shared)/network-error.tsx` | route |  |
| SCR-INFRA-002 | Agent 2B | App Update Required | 2:1557 | `null` | `/(shared)/app-update` | `app/(shared)/app-update.tsx` | route |  |
| SCR-INFRA-003 | Agent 2B | Session Expired | 2:1390 | `null` | `/(shared)/session-expired` | `app/(shared)/session-expired.tsx` | route |  |
| SCR-INFRA-004 | Agent 2B | Terms of Service | 2:1462 | `/legal/terms` | `/(shared)/legal/terms` | `app/(shared)/legal/terms.tsx` | route |  |
| SCR-INFRA-005 | Agent 2B | Help & Support / FAQ | 2:1594 | `/help` | `/(shared)/help` | `app/(shared)/help.tsx` | route |  |
| SCR-CUST-001 | Agent 3 | My Tasks — Task List | 2:1689 | `/(customer)/tasks` | `/(customer)/tasks` | `app/(customer)/tasks/index.tsx` | route |  |
| SCR-CUST-002 | Agent 3 | Post Task — Category Selection | 2:1783 | `/(customer)/tasks/new/category` | `/(customer)/tasks/new/category` | `app/(customer)/tasks/new/category.tsx` | route |  |
| SCR-CUST-003 | Agent 3 | Post Task — Intake Form | 2:1880 | `/(customer)/tasks/new/intake` | `/(customer)/tasks/new/intake` | `app/(customer)/tasks/new/intake.tsx` | route |  |
| SCR-CUST-004 | Agent 3 | Post Task — Photo Upload | 2:1956 | `/(customer)/tasks/new/photos` | `/(customer)/tasks/new/photos` | `app/(customer)/tasks/new/photos.tsx` | route |  |
| SCR-CUST-005 | Agent 3 | Post Task — Location Pin | 2:2021 | `/(customer)/tasks/new/location` | `/(customer)/tasks/new/location` | `app/(customer)/tasks/new/location.tsx` | route |  |
| SCR-CUST-006 | Agent 3 | Post Task — Schedule & Budget | 2:2080 | `/(customer)/tasks/new/schedule` | `/(customer)/tasks/new/schedule` | `app/(customer)/tasks/new/schedule.tsx` | route |  |
| SCR-CUST-007 | Agent 3 | Post Task — Review & Submit | 2:2212 | `/(customer)/tasks/new/review` | `/(customer)/tasks/new/review` | `app/(customer)/tasks/new/review.tsx` | route |  |
| SCR-CUST-008 | Agent 3 | Task Posted — Success | 2:16276 | `/(customer)/tasks/new/success` | `/(customer)/tasks/new/success` | `app/(customer)/tasks/new/success.tsx` | route |  |
| SCR-CUST-009 | Agent 3 | Task Detail (Customer) | 2:16205 | `/(customer)/tasks/:taskId` | `/(customer)/tasks/[taskId]` | `app/(customer)/tasks/[taskId]/index.tsx` | route |  |
| SCR-CUST-010 | Agent 3 | Task Cancel Confirmation | 2:16325 | `null` | `/(customer)/tasks/[taskId]` | `features/tasks/components/TaskCancelSheet.tsx` | embedded component |  |
| SCR-CUST-011 | Agent 3 | Applicants List | 2:16393 | `/(customer)/tasks/:taskId/applicants` | `/(customer)/tasks/[taskId]/applicants` | `app/(customer)/tasks/[taskId]/applicants.tsx` | route |  |
| SCR-CUST-012 | Agent 3 | Applicant Timeout/Decline | 2:16512 | `null` | `/(customer)/tasks/[taskId]/applicants` | `app/(customer)/tasks/[taskId]/applicants.tsx` | route | Phase-2 modal state implemented inside Applicants route state machine; do not split into separate screen file. |
| SCR-CUST-013 | Agent 3 | Tasker Public Profile | 2:16551 | `/(customer)/taskers/:taskerId` | `/(customer)/taskers/[taskerId]` | `app/(customer)/taskers/[taskerId].tsx` | route |  |
| SCR-CUST-014 | Agent 4 | Booking Confirmation | 2:16679 | `/(customer)/bookings/confirm` | `/(customer)/bookings/confirm` | `app/(customer)/bookings/confirm.tsx` | route |  |
| SCR-CUST-015 | Agent 4 | Booking Confirmed — Success | 2:16767 | `/(customer)/bookings/confirmed` | `/(customer)/bookings/confirmed` | `app/(customer)/bookings/confirmed.tsx` | route |  |
| SCR-CUST-016 | Agent 4 | Customer Bookings List | 2:16826 | `/(customer)/bookings` | `/(customer)/bookings` | `app/(customer)/bookings/index.tsx` | route |  |
| SCR-CUST-017 | Agent 4 | Booking Detail (Customer) | 2:16933 | `/(customer)/bookings/:bookingId` | `/(customer)/bookings/[bookingId]` | `app/(customer)/bookings/[bookingId]/index.tsx` | route |  |
| SCR-CUST-018 | Agent 4 | Confirm Completion — Decision | 2:17017 | `null` | `/(customer)/bookings/[bookingId]` | `features/bookings/components/ConfirmCompletionSheet.tsx` | embedded component |  |
| SCR-CUST-019 | Agent 4 | Booking Timeline | 2:17093 | `/(customer)/bookings/:bookingId/timeline` | `/(customer)/bookings/[bookingId]/timeline` | `app/(customer)/bookings/[bookingId]/timeline.tsx` | route |  |
| SCR-CUST-020 | Agent 4 | Reschedule | 2:17223 | `/(customer)/bookings/:bookingId/reschedule` | `/(customer)/bookings/[bookingId]/reschedule` | `app/(customer)/bookings/[bookingId]/reschedule.tsx` | route |  |
| SCR-CUST-021 | Agent 4 | No-Show Flag + Reminder | 2:17362 | `null` | `/(customer)/bookings/[bookingId]` | `features/bookings/components/CustomerNoShowSheet.tsx` | embedded component |  |
| SCR-CUST-022 | Agent 4 | Booking Cancel (Customer) | 2:17462 | `null` | `/(customer)/bookings/[bookingId]` | `features/bookings/components/CustomerCancelSheet.tsx` | embedded component |  |
| SCR-CUST-023 | Agent 4 | Rebook Shortcut | 2:17568 | `/(customer)/rebook` | `/(customer)/rebook` | `app/(customer)/rebook.tsx` | route |  |
| SCR-CUST-024 | Agent 4 | Dispute — Raise | 2:17672 | `/(customer)/bookings/:bookingId/dispute` | `/(customer)/bookings/[bookingId]/dispute` | `app/(customer)/bookings/[bookingId]/dispute.tsx` | route |  |
| SCR-CUST-025 | Agent 4 | Dispute — Status | 2:17747 | `/(customer)/disputes/:disputeId` | `/(customer)/disputes/[disputeId]` | `app/(customer)/disputes/[disputeId]/index.tsx` | route |  |
| SCR-CUST-026 | Agent 4 | No Applicant Rescue | 2:17850 | `null` | `/(customer)/tasks/[taskId]` | `features/tasks/components/NoApplicantRescue.tsx` | embedded component |  |
| SCR-CUST-027 | Agent 4 | Instant Match — Customer | 2:17939 | `/(customer)/tasks/:taskId/instant-match` | `/(customer)/tasks/[taskId]/instant-match` | `app/(customer)/tasks/[taskId]/instant-match.tsx` | route |  |
| SCR-TASK-001 | Agent 5 | Browse — Task Feed | 2:18034 | `/(tasker)/browse` | `/(tabs)` | `app/(tabs)/index.tsx` | route |  |
| SCR-TASK-002 | Agent 5 | Task Detail (Tasker) | 2:18192 | `/(tasker)/tasks/:taskId` | `/(tasker)/tasks/[taskId]` | `app/(tasker)/tasks/[taskId].tsx` | alias route | Wrapper route redirects to `/task/[id]` implementation. |
| SCR-TASK-011 | Agent 5 | Application Sent | 2:18408 | `null` | `/(tasker)/tasks/[taskId] (via alias to /task/[id])` | `features/tasks/components/ApplicationSentSuccess.tsx` | embedded component |  |
| SCR-TASK-012 | Agent 5 | My Jobs — Tasker View | 2:48522 | `/(tasker)/jobs` | `/(tasker)/jobs` | `app/(tasker)/jobs/index.tsx` | route |  |
| SCR-TASK-013 | Agent 5 | Booking Detail (Tasker) | 2:48874 | `/(tasker)/jobs/:bookingId` | `/(tasker)/jobs/[bookingId]` | `app/(tasker)/jobs/[bookingId]/index.tsx` | route |  |
| SCR-TASK-014 | Agent 5 | No-Show Flag (Tasker) | 2:48978 | `null` | `/(tasker)/jobs/[bookingId]` | `features/bookings/components/TaskerNoShowSheet.tsx` | embedded component |  |
| SCR-TASK-015 | Agent 5 | Booking Cancel (Tasker) | 2:19029 | `null` | `/(tasker)/jobs/[bookingId]` | `features/bookings/components/TaskerCancelSheet.tsx` | embedded component |  |
| SCR-TASK-016 | Agent 5 | Tasker Stats Dashboard | 2:49048 | `/(tasker)/stats` | `/(tasker)/stats` | `app/(tasker)/stats.tsx` | route |  |
| SCR-TASK-017 | Agent 5 | Lead Unlock — Accept/Decline | 2:48641 | `null` | `/(tasker)/jobs/[bookingId]` | `features/bookings/components/LeadUnlockSheet.tsx` | embedded component |  |
| SCR-TASK-018 | Agent 5 | Privacy Policy | 2:48774 | `/legal/privacy` | `/(shared)/legal/privacy` | `app/(shared)/legal/privacy.tsx` | route |  |
