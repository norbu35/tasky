# Mobile Design Refresh — Design Spec
**Date:** 2026-04-02
**Status:** Approved
**Figma file:** `IljfnTQPkq7vpkmK1NN1NC` (file: "Mobile", page: "Page 1")

---

## Goal

Replace the visual shell of the Tasky mobile application (`apps/mobile/`) with the designs from the Figma "Mobile" file. Preserve all existing data-fetching hooks, business logic, navigation structure, and API client calls. Touch only UI layout, styles, and component composition.

---

## Scope

**In scope:** 63 screens across 5 parallel agent domains (see Agent Groupings below).

**Deferred to follow-up** (see AGENTS.md §Deferred Mobile Screens):
- SCR-TASK-003–010: Tasker verification & KYC flow (8 screens)
- SCR-P2-001–005: Credits & payments (5 screens)
- SCR-P3-001–005: Wallet, escrow, payout, instant match, Pro subscription (5 screens)
- SCR-CUST-028–029: Task boost options & payment (2 screens — specs not yet written)
- SCR-TASK-019: AI Profile Polish (1 screen — spec not yet written)
- SCR-B2B-001–007: Business accounts (7 screens — specs not yet written)

---

## Three-Source Workflow

Every screen is implemented by combining three inputs:

| Source | Provides | How to use |
|---|---|---|
| `docs/design/screen-specs/SCR-*.yaml` | What to build: components, states, copy, API endpoints, acceptance criteria | Primary requirements. Read first. |
| `docs/design/component-contract.yaml` | How to build: component props, variants, composition rules, token constraints | Reference when choosing/using a component. |
| Figma `get_design_context(fileKey, nodeId)` | How it looks: layout, spacing, visual hierarchy, color application | Visual reference. Adapt to RN + token system; do not copy CSS verbatim. |

**`docs/design/prompts/global-context.yaml`** is also useful as a design system token reference (colors, typography, spacing, visual rules).

---

## Agent Groupings

### Agent 1 — Auth & Onboarding (9 screens)

| SCR-ID | Screen name | Figma node | Code path | Action |
|---|---|---|---|---|
| SCR-SHARED-001 | Splash / Launch | 2:87 | `app/index.tsx` | update |
| SCR-SHARED-002 | Auth — Login | 2:320 | `app/(auth)/index.tsx` | update |
| SCR-SHARED-003 | Auth — OTP Verification | 2:193 | `app/(auth)/otp.tsx` | update |
| SCR-SHARED-004 | Auth — OTP Migration Gate | 2:413 | `app/(auth)/otp-migration.tsx` | update |
| SCR-SHARED-005 | Onboarding Carousel | 2:2 | `app/onboarding.tsx` | update |
| SCR-SHARED-006 | Role Selection | 2:38 | `app/(auth)/role-select.tsx` | update |
| SCR-SHARED-007 | Permission Primer — Camera | 2:119 | `app/(auth)/permission-camera.tsx` | update |
| SCR-SHARED-008 | Permission Primer — Location | 2:250 | `app/(auth)/permission-location.tsx` | update |
| SCR-SHARED-009 | Permission Primer — Notifications | 2:362 | `app/(auth)/permission-notifications.tsx` | update |

### Agent 2A — Inbox & Profile (12 screens)

| SCR-ID | Screen name | Figma node | Code path | Action |
|---|---|---|---|---|
| SCR-SHARED-010 | Inbox — Conversation List | 2:451 | `app/(tabs)/inbox/index.tsx` | update |
| SCR-SHARED-011 | Inbox — Chat Detail | 2:553 | `app/(tabs)/inbox/[id].tsx` | update |
| SCR-SHARED-012 | Profile — My Profile | 2:817 | `app/(tabs)/profile.tsx` | update |
| SCR-SHARED-013 | Profile — Edit Profile | 2:756 | `app/(shared)/profile/edit.tsx` | update |
| SCR-SHARED-014 | Profile — Settings | 2:634 | `app/(shared)/profile/settings.tsx` | update |
| SCR-SHARED-015 | Account Deletion Confirmation | 2:902 | `app/(shared)/profile/delete.tsx` | update |
| SCR-SHARED-016 | Notification Center | 2:988 | `app/(shared)/notifications.tsx` | update |
| SCR-SHARED-017 | Review Form | 2:1089 | `app/(shared)/review/[bookingId].tsx` | update |
| SCR-SHARED-018 | Review Reminder | 2:1180 | `features/review/components/ReviewReminder.tsx` | update |
| SCR-SHARED-019 | Review Hard Lock | 2:1215 | `features/review/components/ReviewHardLock.tsx` | update |
| SCR-SHARED-020 | Suspended Account | 2:1270 | `app/(shared)/account/suspended.tsx` | update |
| SCR-SHARED-021 | Banned Account | 2:1325 | `app/(shared)/account/banned.tsx` | update |

### Agent 2B — Infrastructure (5 screens)

| SCR-ID | Screen name | Figma node | Code path | Action |
|---|---|---|---|---|
| SCR-INFRA-001 | Network Error / Offline | 2:1360 | `app/(shared)/network-error.tsx` | update |
| SCR-INFRA-002 | App Update Required | 2:1557 | `app/(shared)/app-update.tsx` | update |
| SCR-INFRA-003 | Session Expired | 2:1390 | `app/(shared)/session-expired.tsx` | update |
| SCR-INFRA-004 | Terms of Service | 2:1462 | `app/(shared)/legal/terms.tsx` | update |
| SCR-INFRA-005 | Help & Support / FAQ | 2:1594 | `app/(shared)/help.tsx` | update |

### Agent 3 — Customer Task Flow (13 screens)

| SCR-ID | Screen name | Figma node | Code path | Action |
|---|---|---|---|---|
| SCR-CUST-001 | My Tasks — Task List | 2:1689 | `app/(customer)/tasks/index.tsx` | update |
| SCR-CUST-002 | Post Task — Category Selection | 2:1783 | `app/(customer)/tasks/new/category.tsx` | update |
| SCR-CUST-003 | Post Task — Intake Form | 2:1880 | `app/(customer)/tasks/new/intake.tsx` | update |
| SCR-CUST-004 | Post Task — Photo Upload | 2:1956 | `app/(customer)/tasks/new/photos.tsx` | update |
| SCR-CUST-005 | Post Task — Location Pin | 2:2021 | `app/(customer)/tasks/new/location.tsx` | update |
| SCR-CUST-006 | Post Task — Schedule & Budget | 2:2080 | `app/(customer)/tasks/new/schedule.tsx` | update |
| SCR-CUST-007 | Post Task — Review & Submit | 2:2212 | `app/(customer)/tasks/new/review.tsx` | update |
| SCR-CUST-008 | Task Posted — Success | 2:16276 | `app/(customer)/tasks/new/success.tsx` | update |
| SCR-CUST-009 | Task Detail (Customer) | 2:16205 | `app/(customer)/tasks/[taskId]/index.tsx` | update |
| SCR-CUST-010 | Task Cancel Confirmation | 2:16325 | `features/tasks/components/TaskCancelSheet.tsx` | update |
| SCR-CUST-011 | Applicants List | 2:16393 | `app/(customer)/tasks/[taskId]/applicants.tsx` | update |
| SCR-CUST-012 | Applicant Timeout/Decline | 2:16512 | `app/(customer)/tasks/[taskId]/applicants.tsx` | update |
| SCR-CUST-013 | Tasker Public Profile | 2:16551 | `app/(customer)/taskers/[taskerId].tsx` | update |

### Agent 4 — Customer Booking Flow (14 screens)

| SCR-ID | Screen name | Figma node | Code path | Action |
|---|---|---|---|---|
| SCR-CUST-014 | Booking Confirmation | 2:16679 | `app/(customer)/bookings/confirm.tsx` | update |
| SCR-CUST-015 | Booking Confirmed — Success | 2:16767 | `app/(customer)/bookings/confirmed.tsx` | update |
| SCR-CUST-016 | Customer Bookings List | 2:16826 | `app/(customer)/bookings/index.tsx` | update |
| SCR-CUST-017 | Booking Detail (Customer) | 2:16933 | `app/(customer)/bookings/[bookingId]/index.tsx` | update |
| SCR-CUST-018 | Confirm Completion — Decision | 2:17017 | `features/bookings/components/ConfirmCompletionSheet.tsx` | update |
| SCR-CUST-019 | Booking Timeline | 2:17093 | `app/(customer)/bookings/[bookingId]/timeline.tsx` | update |
| SCR-CUST-020 | Reschedule | 2:17223 | `app/(customer)/bookings/[bookingId]/reschedule.tsx` | update |
| SCR-CUST-021 | No-Show Flag + Reminder | 2:17362 | `features/bookings/components/CustomerNoShowSheet.tsx` | update |
| SCR-CUST-022 | Booking Cancel (Customer) | 2:17462 | `features/bookings/components/CustomerCancelSheet.tsx` | update |
| SCR-CUST-023 | Rebook Shortcut | 2:17568 | `app/(customer)/rebook.tsx` | update |
| SCR-CUST-024 | Dispute — Raise | 2:17672 | `app/(customer)/bookings/[bookingId]/dispute.tsx` | update |
| SCR-CUST-025 | Dispute — Status | 2:17747 | `app/(customer)/disputes/[disputeId]/index.tsx` | update |
| SCR-CUST-026 | No Applicant Rescue | 2:17850 | `features/tasks/components/NoApplicantRescue.tsx` | update |
| SCR-CUST-027 | Instant Match — Customer | 2:17939 | `app/(customer)/tasks/[taskId]/instant-match.tsx` | update |

### Agent 5 — Tasker Flow (10 screens)

| SCR-ID | Screen name | Figma node | Code path | Action |
|---|---|---|---|---|
| SCR-TASK-001 | Browse — Task Feed | 2:18034 | `app/(tabs)/index.tsx` | update |
| SCR-TASK-002 | Task Detail (Tasker) | 2:18192 | `app/(tasker)/tasks/[taskId].tsx` | update (alias route) |
| SCR-TASK-011 | Application Sent | 2:18408 | `features/tasks/components/ApplicationSentSuccess.tsx` | update |
| SCR-TASK-012 | My Jobs — Tasker View | 2:48522 | `app/(tasker)/jobs/index.tsx` | update |
| SCR-TASK-013 | Booking Detail (Tasker) | 2:48874 | `app/(tasker)/jobs/[bookingId]/index.tsx` | update |
| SCR-TASK-014 | No-Show Flag (Tasker) | 2:48978 | `features/bookings/components/TaskerNoShowSheet.tsx` | update |
| SCR-TASK-015 | Booking Cancel (Tasker) | 2:19029 | `features/bookings/components/TaskerCancelSheet.tsx` | update |
| SCR-TASK-016 | Tasker Stats Dashboard | 2:49048 | `app/(tasker)/stats.tsx` | update |
| SCR-TASK-017 | Lead Unlock — Accept/Decline | 2:48641 | `features/bookings/components/LeadUnlockSheet.tsx` | update |
| SCR-TASK-018 | Privacy Policy | 2:48774 | `app/(shared)/legal/privacy.tsx` | update |

---

## Invalid Figma Frames — Do Not Implement

The following 14 Figma frames exist in the file but are **duplicates or invalidated screens** per `docs/design/prompts/generation-tracker.md`. Agents must not implement these:

| Figma node | Frame name | Reason |
|---|---|---|
| 2:18448 | Job Detail (Tasker) | Duplicate of SCR-TASK-013 |
| 2:18662 | Mark Complete (Tasker) | Misgenerated |
| 2:46979 | Availability Schedule | Not in MVP spec |
| 2:18346 | Apply to Task — Compose | Not in inventory (apply is inline) |
| 2:18744 | Customer No-Show (Tasker View) | Duplicate of SCR-TASK-014 |
| 2:19102 | Цаг өөрчлөх (Tasker) | Not in inventory |
| 2:19342 | KYC Verification Status | Duplicate of SCR-TASK-007 (deferred) |
| 2:18546 | My Applications Tracker | Not in inventory |
| 2:19454 | Service Areas | Not in MVP spec |
| 2:18818 | Earnings Dashboard | Duplicate of SCR-TASK-016 |
| 2:47195 | Ажлын жишээ (Portfolio) | Not in MVP spec |
| 2:18274 | Tasker Verification | Duplicate of SCR-TASK-003 (deferred) |
| 2:18928 | Performance Stats | Duplicate of SCR-TASK-016 |
| 2:19239 | Dispute — Tasker View | Not in inventory |

---

## Per-Agent Execution Steps

Each agent follows this sequence for every screen in its domain:

1. **Read spec** — `docs/design/screen-specs/<SCR-ID>.yaml` for components, states, copy, acceptance criteria
2. **Read component contracts** — `docs/design/component-contract.yaml` for relevant components
3. **Fetch visual** — `get_design_context(fileKey="IljfnTQPkq7vpkmK1NN1NC", nodeId="<figma_node>", clientFrameworks="react-native,expo", clientLanguages="typescript")`
4. **Read existing code** — identify hooks, navigation calls, and data props to preserve
5. **Implement** — combine spec requirements + visual reference + existing logic. Adapt Figma output to React Native StyleSheet + mobileTheme tokens; do not copy CSS
6. **Verify** — self-check each `acceptance_criteria` item in the spec
7. **After all screens**: `pnpm --filter @tasky/mobile typecheck` must pass with zero errors

---

## Conventions & Guardrails

### What agents may and may not touch

| Allowed | Prohibited |
|---|---|
| `src/app/**/*.tsx` | `src/features/*/hooks/**/*.ts` |
| `src/components/ui/**/*.tsx` | `src/lib/**`, `src/store/**`, `src/providers/**` |
| `src/components/templates/**/*.tsx` | All Java/Kotlin backend code |
| `src/features/*/components/**/*.tsx` | `docs/design/screen-specs/**` (read-only) |

### Token usage
All colors, spacing, typography, and radius via `mobileTheme` from `src/design/tokenAdapter.ts`. Never hardcode hex values or pixel numbers. Canonical token values are in `docs/design/prompts/global-context.yaml`.

### Bilingual copy
All user-facing strings via `useTranslation()`. Mongolian is the primary locale. Copy strings come from the `copy:` block in each `SCR-*.yaml`. No hardcoded English strings.

### New screens
Create at the `route:` specified in the spec. Register in the appropriate `_layout.tsx`. Follow existing layout patterns in the route group.

### No new dependencies
Do not add new npm packages without explicit user approval. Use existing dependencies: `expo-router`, `lucide-react-native`, `react-native-reanimated`, `expo-blur`, etc.

---

## Deferred Scope

The following are explicitly out of scope for this refresh. See `AGENTS.md §Deferred Mobile Screens` for the full list with Figma node IDs and reason codes. A task has been added to the tracker as `TASK-001`.

- Tasker verification & KYC: SCR-TASK-003–010
- Credits & payments: SCR-P2-001–005
- Wallet, escrow, payout: SCR-P3-001–005
- Task boost: SCR-CUST-028–029
- AI Profile Polish: SCR-TASK-019
- Business accounts: SCR-B2B-001–007
