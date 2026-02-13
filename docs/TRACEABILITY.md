# Traceability Matrix (PRD -> Architecture -> API -> Backlog)

## Purpose
This matrix is the backlog-generation control document that links every PRD requirement to:
1. Owning architecture module(s)
2. OpenAPI contract surface
3. Planned atomic backlog ticket(s)

Coverage target for backlog generation baseline: 44/44 PRD requirement IDs mapped.

## Requirement Mapping
| Requirement ID | Requirement Summary | Architecture Module(s) | API Contract Surface | Planned Ticket(s) |
|---|---|---|---|---|
| REQ-AUTH-01 | Phone + OTP login/signup | `identity` | `POST /auth/otp/request`, `POST /auth/otp/verify` | `TASK-000`, `TASK-010`, `TASK-011`, `TASK-080`, `TASK-082` |
| REQ-AUTH-02 | Prevent duplicate accounts by phone | `identity` | `POST /auth/otp/verify` (with unique phone constraint) | `TASK-010`, `TASK-080`, `TASK-082` |
| REQ-AUTH-03 | Issue secure JWT session token | `identity` | `POST /auth/otp/verify`, `POST /auth/token/refresh` | `TASK-010`, `TASK-080`, `TASK-082` |
| REQ-AUTH-04 | Tasker role activation before verification completion | `identity` | `POST /users/me/role/tasker`, `POST /verification/submit`, `GET /verification/status`, `GET /admin/verifications/pending`, `POST /admin/verifications/{id}/approve`, `POST /admin/verifications/{id}/reject` | `TASK-012`, `TASK-013` |
| REQ-TASK-01 | Create task with category/desc/photos/location/schedule/budget | `marketplace` | `POST /tasks`, `POST /tasks/photos/upload-url`, `POST /tasks/{id}/photos/upload-url` | `TASK-021`, `TASK-080`, `TASK-082` |
| REQ-TASK-02 | Task lifecycle OPEN->ASSIGNED->COMPLETED/CANCELLED | `marketplace`, `wallet` | `POST /tasks`, `POST /tasks/{id}/cancel`, `POST /tasks/{id}/applications/{applicationId}/accept`, `POST /payments/qpay/callback`, `POST /bookings/{id}/complete` | `TASK-023`, `TASK-031`, `TASK-033` |
| REQ-TASK-03 | Taskers view OPEN task feed with privacy constraints | `marketplace` | `GET /tasks` | `TASK-022`, `TASK-080`, `TASK-082` |
| REQ-TASK-04 | Task photo upload via presigned URL, max 3 photos | `marketplace` | `POST /tasks/photos/upload-url`, `POST /tasks/{id}/photos/upload-url`, `POST /tasks` | `TASK-021` |
| REQ-TASK-05 | Categories admin-managed + feed filters | `marketplace`, `support` | `GET /categories`, `GET /tasks`, `GET /admin/categories`, `POST /admin/categories`, `PUT /admin/categories/{id}` | `TASK-020`, `TASK-022` |
| REQ-BOOK-01 | Tasker can apply to OPEN task | `marketplace` | `POST /tasks/{id}/applications` | `TASK-023`, `TASK-080`, `TASK-082` |
| REQ-BOOK-02 | Customer can view and accept applicants | `marketplace` | `GET /tasks/{id}/applications`, `POST /tasks/{id}/applications/{applicationId}/accept` | `TASK-023`, `TASK-080`, `TASK-082` |
| REQ-BOOK-03 | Booking finalization only after payment secured | `marketplace`, `wallet` | `POST /tasks/{id}/applications/{applicationId}/accept`, `POST /payments/bookings/{id}/initiate`, `POST /payments/qpay/callback` | `TASK-030`, `TASK-031`, `TASK-081`, `TASK-083` |
| REQ-BOOK-04 | Customer cancellation policy with late fee | `marketplace`, `wallet` | `POST /bookings/{id}/cancel` | `TASK-032`, `TASK-081`, `TASK-083` |
| REQ-BOOK-05 | Booking lifecycle PENDING_PAYMENT->PAID->COMPLETED/CANCELLED | `marketplace`, `wallet` | `POST /payments/qpay/callback`, `POST /bookings/{id}/complete`, `POST /bookings/{id}/cancel`, `GET /bookings/{id}` | `TASK-030`, `TASK-031`, `TASK-033`, `TASK-081`, `TASK-083` |
| REQ-BOOK-06 | Tasker cancellation with strike/suspension logic | `marketplace`, `support` | `POST /bookings/{id}/cancel`, `GET /bookings/{id}` | `TASK-032`, `TASK-081`, `TASK-083` |
| REQ-PAY-01 | QPay initiation (QR/deeplink) | `wallet` | `POST /payments/bookings/{id}/initiate` | `TASK-031`, `TASK-081`, `TASK-083` |
| REQ-PAY-02 | Pending credit to tasker wallet after completion | `wallet` | `POST /bookings/{id}/complete`, `GET /wallet`, `GET /wallet/transactions` | `TASK-033` |
| REQ-PAY-03 | Configurable platform fee deduction | `wallet` | `POST /bookings/{id}/complete`, `GET /wallet/transactions` | `TASK-033` |
| REQ-PAY-04 | Tasker payout request from wallet balance | `wallet` | `POST /wallet/payouts` | `TASK-034` |
| REQ-PAY-05 | Admin pending payouts and process action | `wallet`, `support` | `GET /admin/payouts/pending`, `POST /admin/payouts/{id}/process` | `TASK-034` |
| REQ-PAY-06 | Fixed payout schedule (Tue/Fri) | `wallet` | `POST /wallet/payouts`, `POST /admin/payouts/{id}/process` | `TASK-034` |
| REQ-SAFE-01 | Tasker remains pending until admin verification | `identity`, `support` | `POST /verification/upload-url`, `POST /verification/submit`, `GET /verification/status`, `GET /admin/verifications/pending`, `POST /admin/verifications/{id}/approve`, `POST /admin/verifications/{id}/reject` | `TASK-012`, `TASK-013` |
| REQ-SAFE-02 | Ratings/reviews after completed booking | `marketplace`, `support` | `POST /bookings/{id}/reviews`, `GET /users/{id}/reviews` | `TASK-040`, `TASK-081`, `TASK-083` |
| REQ-SAFE-03 | Dispute flow with payout pause | `support`, `wallet` | `POST /bookings/{id}/disputes`, `GET /disputes/{id}`, `GET /admin/disputes`, `POST /admin/disputes/{id}/resolve` | `TASK-041`, `TASK-081`, `TASK-083` |
| REQ-SAFE-04 | Auto-assign pro badge based on completions and rating | `identity`, `marketplace` | `GET /users/me`, `GET /users/{id}/reviews` | `TASK-040` |
| REQ-NOTIF-01 | Push notifications for key booking/task events | `communication` | `POST /notifications/devices`, `DELETE /notifications/devices/{token}` (event producer hooks from task/booking endpoints) | `TASK-044`, `TASK-081`, `TASK-083` |
| REQ-NOTIF-02 | SMS fallback when app not open | `communication` | Event-driven from booking/apply/confirm flows; delivery logs via notification subsystem | `TASK-044`, `TASK-081`, `TASK-083` |
| REQ-MSG-01 | In-app messaging after apply, real-time STOMP | `communication` | `GET /conversations`, `GET /conversations/{id}/messages`, `POST /conversations/{id}/messages` (+ STOMP channel documented in architecture) | `TASK-042`, `TASK-043`, `TASK-081`, `TASK-083` |
| REQ-MSG-02 | Persisted history available to both parties and admin | `communication`, `support` | `GET /conversations/{id}/messages`, `GET /admin/disputes`, `GET /disputes/{id}` | `TASK-042`, `TASK-041` |
| REQ-ADMIN-01 | Admin search users by phone | `support`, `identity` | `GET /admin/users` | `TASK-045` |
| REQ-ADMIN-02 | Admin dispute manager with resolve actions | `support`, `wallet`, `communication` | `GET /admin/disputes`, `POST /admin/disputes/{id}/resolve`, `GET /disputes/{id}` | `TASK-041` |
| REQ-ADMIN-03 | Admin ban user (login blocked) | `support`, `identity` | `POST /admin/users/{id}/ban`, `POST /admin/users/{id}/unban` | `TASK-004`, `TASK-045` |
| REQ-UI-01 | Web must use `shadcn/ui` primitives as base component library | `frontend-web` | Web UI implementation policy (component source path: `apps/web/src/components/ui`) | `TASK-070` |
| REQ-UI-02 | Mobile must implement native equivalents aligned to shared design tokens/states | `frontend-mobile` | Mobile component parity policy (token adapter + component layer) | `TASK-071` |
| NFR-SEC-01 | Encrypt PII at rest | cross-cutting (`identity`, `wallet`, storage security) | Affects all PII endpoints; strongest impact on verification, users, admin views | `TASK-004`, `TASK-060` |
| NFR-PERF-01 | Open task feed under 1s on 4G | `marketplace` | `GET /tasks` | `TASK-022`, `TASK-063` |
| NFR-LOC-01 | Mongolian Cyrillic handling and display | cross-cutting (`identity`, `marketplace`, `communication`, clients) | Request/response localization via `Accept-Language`; all user-facing endpoints | `TASK-061` |
| NFR-LEGAL-01 | Liability disclaimer required in booking/payment flow | `wallet`, `marketplace` | `POST /payments/bookings/{id}/initiate` (requires disclaimer acceptance flag) | `TASK-064`, `TASK-081`, `TASK-083` |
| NFR-RELI-01 | Idempotent payment webhooks with retry handling | `wallet` | `POST /payments/qpay/callback` | `TASK-000`, `TASK-001`, `TASK-003`, `TASK-031` |
| NFR-RELI-02 | Mobile read-only offline cache of My Tasks | `marketplace`, `communication` | `GET /tasks`, `GET /bookings`, `GET /bookings/{id}` (mobile cache consumer) | `TASK-062` |
| NFR-API-01 | Cursor-based pagination for list endpoints | cross-cutting (`marketplace`, `wallet`, `communication`, `support`) | `GET /tasks`, `GET /bookings`, `GET /wallet/transactions`, `GET /conversations`, `GET /conversations/{id}/messages`, `GET /users/{id}/reviews`, `GET /admin/users`, `GET /admin/disputes`, `GET /admin/payouts/pending`, `GET /admin/verifications/pending`, `GET /admin/categories`, `GET /categories` | `TASK-000`, `TASK-002`, `TASK-022`, `TASK-065` |
| NFR-OBS-01 | MVP funnel analytics events and KPI-computable telemetry | cross-cutting (`marketplace`, `wallet`, `communication`, clients) | Event emissions from task, booking, payment, dispute, and completion flows | `TASK-090` |
| NFR-UI-01 | Shared design token source of truth across web and mobile | cross-cutting (`frontend-web`, `frontend-mobile`) | Shared token package and platform adapters | `TASK-070`, `TASK-071` |
| NFR-UI-02 | Web accessibility baseline (keyboard + WCAG 2.1 AA contrast) | `frontend-web` | Web component/screen quality gate | `TASK-072` |

## Coverage Gate
This document is valid for backlog generation only when:
1. Every PRD requirement ID appears at least once in this table.
2. Every table row maps to at least one planned ticket.
3. Every planned ticket exists in `/docs/BACKLOG_MVP.md`.
