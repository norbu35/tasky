# Stitch Screen Generation Tracker

> Track generation status for the current 91-screen mobile pack in Stitch project "Tasky Mobile v2" (ID: `15920227283524999360`).
>
> Scope boundary: this tracker now covers customer/tasker marketplace surfaces plus AI Profile Polish, boost checkout, and B2B account-management/billing through Phase 3. It does not yet include Phase 4 Tasky Plus or Family Plan customer-subscription screens. See `docs/design/evaluation-report.md`.

| Status | Count |
|--------|-------|
| ✅ Complete | 81 |
| ⬜ Not started | 10 |
| 🗑 Duplicates to remove | 14 |

---

## Shared
> Auth, onboarding, profile, inbox — foundation screens

- [x] **SCR-SHARED-001** — Splash / Launch Screen (2 states)  
- [x] **SCR-SHARED-002** — Auth — Login (7 states)  
- [x] **SCR-SHARED-003** — Auth — OTP Verification (7 states)  
- [x] **SCR-SHARED-004** — Auth — OTP Migration Gate (5 states)  
- [x] **SCR-SHARED-005** — Onboarding Carousel (3 states)  
- [x] **SCR-SHARED-006** — Role Selection (2 states)  
- [x] **SCR-SHARED-007** — Permission Primer — Camera (3 states)  
- [x] **SCR-SHARED-008** — Permission Primer — Location (3 states)  
- [x] **SCR-SHARED-009** — Permission Primer — Notifications (3 states)  
- [x] **SCR-SHARED-010** — Inbox — Conversation List (6 states)  
- [x] **SCR-SHARED-011** — Inbox — Chat Detail (7 states)  
- [x] **SCR-SHARED-012** — Profile — My Profile (4 states)  
- [x] **SCR-SHARED-013** — Profile — Edit Profile (7 states)  
- [x] **SCR-SHARED-014** — Profile — Settings (7 states)  
- [x] **SCR-SHARED-015** — Account Deletion Confirmation (5 states)  
- [x] **SCR-SHARED-016** — Notification Center (5 states)  
- [x] **SCR-SHARED-017** — Review Form (8 states)  
- [x] **SCR-SHARED-018** — Review Reminder (2 states)  
- [x] **SCR-SHARED-019** — Review Hard Lock (3 states)  
- [x] **SCR-SHARED-020** — Suspended Account (3 states)  
- [x] **SCR-SHARED-021** — Banned Account (1 states)  

## Infrastructure
> Error, offline, update, legal — system screens

- [x] **SCR-INFRA-001** — Network Error / Offline (4 states)  
- [x] **SCR-INFRA-002** — App Update (2 states)  
- [x] **SCR-INFRA-003** — Session Expired (1 states)  
- [x] **SCR-INFRA-004** — Terms of Service (3 states)  
- [x] **SCR-INFRA-005** — Help & Support / FAQ (3 states)  

## Customer
> Task posting, applicants, bookings, disputes — customer flow

- [x] **SCR-CUST-001** — My Tasks — Task List (6 states)  
- [x] **SCR-CUST-002** — Post Task — Category Selection (3 states)  
- [x] **SCR-CUST-003** — Post Task — Intake Form (3 states)  
- [x] **SCR-CUST-004** — Post Task — Photo Upload (6 states)  
- [x] **SCR-CUST-005** — Post Task — Location Pin (4 states)  
- [x] **SCR-CUST-006** — Post Task — Schedule & Budget (5 states)  
- [x] **SCR-CUST-007** — Post Task — Review & Submit (4 states)  
- [x] **SCR-CUST-008** — Task Posted — Success (1 states)  
- [x] **SCR-CUST-009** — Task Detail (Customer) (9 states)  
- [x] **SCR-CUST-010** — Task Cancel Confirmation (4 states)  
- [x] **SCR-CUST-011** — Applicants List (6 states)  
- [x] **SCR-CUST-012** — Applicant Timeout/Decline (3 states)  
- [x] **SCR-CUST-013** — Tasker Public Profile (3 states)  
- [x] **SCR-CUST-014** — Booking Confirmation (5 states)  
- [x] **SCR-CUST-015** — Booking Confirmed — Success (1 states)  
- [x] **SCR-CUST-016** — Customer Bookings List (7 states)  
- [x] **SCR-CUST-017** — Booking Detail (Customer) (12 states)  
- [x] **SCR-CUST-018** — Confirm Completion — Decision (2 states)  
- [x] **SCR-CUST-019** — Booking Timeline (3 states)  
- [x] **SCR-CUST-020** — Reschedule (6 states)  
- [x] **SCR-CUST-021** — No-Show Flag + Reminder (4 states)  
- [x] **SCR-CUST-022** — Booking Cancel (Customer) (4 states)  
- [x] **SCR-CUST-023** — Rebook Shortcut (5 states)  
- [x] **SCR-CUST-024** — Dispute — Raise (8 states)  
- [x] **SCR-CUST-025** — Dispute — Status (7 states)  
- [x] **SCR-CUST-026** — No Applicant Rescue (5 states)  
- [x] **SCR-CUST-027** — Instant Match Customer (5 states)  
- [ ] **SCR-CUST-028** — Task Boost Options (6 states)  
- [ ] **SCR-CUST-029** — Task Boost Payment (6 states)  

## Tasker
> Browse, verify, apply, manage jobs — tasker flow

- [x] **SCR-TASK-001** — Browse — Task Feed (9 states)  
- [x] **SCR-TASK-002** — Task Detail (Tasker) (6 states)  
- [x] **SCR-TASK-003** — Verification Gate (1 states)  
- [x] **SCR-TASK-004** — Verification — Consent (2 states)  
- [x] **SCR-TASK-005** — Verification — ID Upload (9 states)  
- [x] **SCR-TASK-006** — Verification — DAN Fast-Path (5 states)  
- [x] **SCR-TASK-007** — Verification — Pending (3 states)  
- [x] **SCR-TASK-008** — Verification — Approved (1 states)  
- [x] **SCR-TASK-009** — Verification — Rejected (3 states)  
- [x] **SCR-TASK-010** — Verification Submitted — Success (1 states)  
- [x] **SCR-TASK-011** — Application Sent (1 states)  
- [x] **SCR-TASK-012** — Tasker Bookings / My Jobs (7 states)  
- [x] **SCR-TASK-013** — Booking Detail (Tasker) (9 states)  
- [x] **SCR-TASK-014** — No-Show Flag (Tasker) (4 states)  
- [x] **SCR-TASK-015** — Booking Cancel (Tasker) (4 states)  
- [x] **SCR-TASK-016** — Tasker Stats Dashboard (3 states)  
- [x] **SCR-TASK-017** — Lead Unlock — Accept/Decline (7 states)  
- [x] **SCR-TASK-018** — Privacy Policy (2 states)  
- [ ] **SCR-TASK-019** — AI Profile Polish (6 states)  

## B2B
> Business accounts, account-scoped posting, tasks, and billing

- [ ] **SCR-B2B-001** — Business Accounts (5 states)  
- [ ] **SCR-B2B-002** — Business Account Editor (6 states)  
- [ ] **SCR-B2B-003** — Business Location Editor (6 states)  
- [ ] **SCR-B2B-004** — Business Members (6 states)  
- [ ] **SCR-B2B-005** — Post Task as Business (5 states)  
- [ ] **SCR-B2B-006** — Business Tasks (5 states)  
- [ ] **SCR-B2B-007** — Business Subscription Billing (7 states)  

## Phase 2
> Credits, payments, referrals — monetization

- [x] **SCR-P2-001** — Credits — Balance & Purchase (5 states)  
- [x] **SCR-P2-002** — Credits — QPay Payment (6 states)  
- [x] **SCR-P2-003** — Credits — Transaction History (5 states)  
- [x] **SCR-P2-004** — Credits — Low Balance Alert (2 states)  
- [x] **SCR-P2-005** — Referral — My Code & Stats (5 states)  

## Phase 3
> Wallet, escrow, subscription, instant match — advanced

- [x] **SCR-P3-001** — Wallet — Balance & Payouts (4 states)  
- [x] **SCR-P3-002** — Wallet — Request Payout (5 states)  
- [x] **SCR-P3-003** — Escrow — Payment Flow (5 states)  
- [x] **SCR-P3-004** — Subscription — Tasker Pro (7 states)  
- [x] **SCR-P3-005** — Instant Match — Tasker (5 states)  

---

## Duplicate Screens to Remove from Stitch

> These 14 screens were generated with **wrong content** during the first pass (wrong numbering assumption for the Tasker block). They should be manually deleted from the Stitch project. The correct versions have been regenerated above.

| Stitch Screen ID | Title in Stitch | Why Remove |
|---|---|---|
| `22b24c5b2798485bb6d870c568cc2aad` | Job Detail (Tasker) | Duplicate of SCR-TASK-013 (Booking Detail Tasker) |
| `e4cca8dcc7d7434ea15d178f812d5122` | Mark Complete (Tasker) | Was misgenerated as SCR-TASK-008; correct version is "Verification — Approved" |
| `c0dcdf03e19f486cb0ed08cb2801f293` | Availability Schedule | Not in inventory — feature not in spec |
| `9571ea1059444bd0921bbb53827088a8` | Apply to Task — Compose | Not in inventory — apply is inline, not a separate screen |
| `5e45feba203e419ca41f171808eadde5` | Customer No-Show (Tasker View) | Duplicate of SCR-TASK-014 (No-Show Flag Tasker) |
| `2302bd7a9e34471aaf3bb5fe73aad2b0` | Reschedule (Tasker) | Not in inventory — tasker reschedule not a separate screen |
| `2a191f70e3a84810a0f467ff02c024d2` | KYC Verification Status | Duplicate of SCR-TASK-007 (Verification Pending) |
| `68200cee2f4547c1bbae8383177227e9` | My Applications Tracker | Not in inventory — SCR-TASK-011 "Application Sent" is the correct screen |
| `18517756fd74408bba53a24a63592c77` | Service Areas | Not in inventory — feature not in MVP spec |
| `ccb02e7b4ad549c69dd9de3c1fa71302` | Earnings Dashboard | Duplicate of SCR-TASK-016 (Tasker Stats Dashboard) |
| `dedbc148181747b4b247279930f989ce` | Portfolio | Not in inventory — feature not in MVP spec |
| `17ffd25c2aee4535bd2ae726f810e99a` | Tasker Verification | Duplicate of SCR-TASK-003 (Verification Gate) |
| `5011493defd4485bad72493d44b3a6ea` | Performance Stats | Duplicate of SCR-TASK-016 (Tasker Stats Dashboard) |
| `57556010dd004570af8afe1a35b29e98` | Dispute — Tasker View | Not in inventory — tasker dispute is not a separate screen |

---

## Notes

- Generate in order: Shared → Infrastructure → Customer → Tasker → B2B → Phase 2 → Phase 3
- Each screen's `stitch_prompt` is in `docs/design/prompts/screens/SCR-*.yaml`
- Prepend `global-context.yaml` for consistent styling across all screens
- Use journey files for flow consistency within a user journey
