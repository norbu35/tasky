# Security Audit Report — 2026-02-14

## Meta

- **Date:** 2026-02-14
- **Scope:** Full backend application (`src/main/java/mn/tasky/`)
- **Baseline:** Commit `cbaedba` on `main`
- **Method:** Automated static code review against PRD, AGENTS.md, and ARCHITECTURE.md requirements
- **Status:** Partially remediated on 2026-02-14

## How to Use This Report

Each finding has a unique ID (`SEC-XXX`), severity, exact file and line references, the violated requirement, and a concrete recommended fix. Agents implementing fixes should:

1. Address findings in priority order (CRITICAL first, then HIGH, etc.).
2. Reference the finding ID in commit messages: `security(SEC-001): <summary>`.
3. Include tests that prove the vulnerability is closed.
4. Mark the finding as `FIXED` in this file after merge.

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 6 | Fixed (6/6) |
| HIGH | 16 | Partial (9 fixed / 7 open) |
| MEDIUM | 21 | Partial (3 fixed / 18 open) |
| LOW | 17 | Partial (1 fixed / 16 open) |
| INFO | 4 | Partial (1 fixed / 3 open) |
| **Total** | **64** | |

---

## CRITICAL (6)

### SEC-001: Static OTP Code — No Random Generation or SMS Delivery

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/auth/AuthService.java:60,86`
- **Config:** `src/main/resources/application.yml:32`
- **Violated:** REQ-AUTH-01, AGENTS.md 10.1.6 (placeholder security logic in auth is a merge blocker)
- **Description:** OTP code is a static configurable value (`123456` default) via `@Value("${tasky.auth.otp-code:123456}")`. Every user receives the same code. No random generation, no SMS delivery. Anyone who knows the default can authenticate as any phone number.
- **Fix:**
  1. Replace static code with `SecureRandom`-generated 6-digit code per request.
  2. Add an SMS gateway interface (`SmsService`) with a dev-mode stub that logs the code instead of sending.
  3. Remove the `tasky.auth.otp-code` config property entirely.
  4. Add a startup check that fails if the dev stub is active in a `production` profile.
- **Test:** Verify two consecutive OTP requests for the same phone produce different codes. Verify the old code from request 1 is invalid after request 2.
- **Validation:** `mn.tasky.OtpSecurityIntegrationTests`, `mn.tasky.OtpAuthIntegrationTests`

### SEC-002: Hardcoded JWT Signing Secret

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/resources/application.yml:35`
- **File:** `src/main/java/mn/tasky/common/security/JwtTokenService.java:30-31`
- **Violated:** AGENTS.md 6 ("Secrets never hardcoded"), AGENTS.md 10.1.6 (merge blocker)
- **Description:** JWT secret defaults to `tasky-dev-signing-secret-key-with-minimum-32-bytes` in committed config. `.env` does not define `TASKY_JWT_SECRET`, so the default is always used. Allows JWT forgery.
- **Fix:**
  1. Remove the default value from `application.yml` — make it `jwt-secret: ${TASKY_JWT_SECRET}` (no fallback).
  2. Add `TASKY_JWT_SECRET=<generate-random-64-char-hex>` to `.env.example` with generation instructions.
  3. Add a `@PostConstruct` check in `JwtTokenService` that fails startup if the secret is blank or shorter than 32 bytes.
  4. Update `.env` locally with a generated secret.
- **Test:** Application fails to start without `TASKY_JWT_SECRET` set.
- **Validation:** `mn.tasky.TaskyApplicationTests` (startup path), full suite pass with explicit secret configuration.

### SEC-003: Hardcoded AES Encryption Key with Plaintext in Comment

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/resources/application.yml:36`
- **File:** `src/main/java/mn/tasky/common/security/CryptoService.java:23`
- **Violated:** NFR-SEC-01, AGENTS.md 6 (merge blocker)
- **Description:** AES-256-GCM key defaults to `MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=` (base64 of `"12345678901234567890123456789012"`). Comment in YAML reveals the plaintext. All PII decryptable by anyone with source access.
- **Fix:**
  1. Remove the default value and the plaintext comment from `application.yml`.
  2. Make it `encryption-key: ${TASKY_ENCRYPTION_KEY}` (no fallback).
  3. Add `@PostConstruct` validation in `CryptoService` — fail if key is missing or not exactly 32 bytes after base64 decode.
  4. Add `TASKY_ENCRYPTION_KEY=<instructions>` to `.env.example`.
- **Test:** Application fails to start without `TASKY_ENCRYPTION_KEY`.
- **Validation:** `mn.tasky.EncryptionIntegrationTests`, full suite pass with explicit key configuration.

### SEC-004: QPay Callback HMAC Verification Disabled

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/payment/PaymentService.java:46-49`
- **Violated:** NFR-RELI-01, AGENTS.md 10.1.6 (placeholder security in payment is a merge blocker)
- **Description:** Signature check `if (!"VALID_SIG".equals(signature))` has `return false` commented out with note "For testing I'll allow any for now". The `/api/v1/payments/qpay/callback` endpoint is `permitAll()`. Anyone can forge payment confirmations.
- **Fix:**
  1. Add a config property `tasky.qpay.webhook-secret: ${TASKY_QPAY_WEBHOOK_SECRET}`.
  2. Implement HMAC-SHA256 verification: compute signature over `paymentId + "|" + status` using the secret, compare with constant-time `MessageDigest.isEqual()`.
  3. Return `false` and log a warning if signature is invalid.
  4. Remove the commented-out code and `"VALID_SIG"` placeholder entirely.
- **Test:** Callback with invalid signature returns failure. Callback with valid HMAC succeeds.
- **Validation:** `mn.tasky.PaymentIntegrationTests` (`...CALLBACK-SIGNATURE`, `...CALLBACK-IDEMPOTENT`)

### SEC-005: Payment Callback Lacks Idempotency (Race Condition)

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/payment/PaymentService.java:45-76`
- **File:** `src/main/java/mn/tasky/booking/BookingService.java:129-151`
- **Violated:** NFR-RELI-01
- **Description:** `processCallback()` has no idempotency guard. The `transition()` method does a non-atomic `get()` then `put()`. Two concurrent callbacks can both read `PENDING_PAYMENT` and both proceed to `PAID`, causing duplicate notifications and potentially duplicate wallet credits.
- **Fix:**
  1. Track processed payment IDs in a `Set<String> processedPaymentIds` (or database table when persistent). Reject duplicates before processing.
  2. Replace the `get-check-put` pattern in `BookingService.transition()` with `ConcurrentHashMap.compute()` for atomic state transitions.
  3. Return success (idempotent) if the payment was already processed.
- **Test:** Two concurrent calls with the same paymentId result in exactly one state transition and one notification.
- **Validation:** `mn.tasky.PaymentIntegrationTests` idempotent callback flow.

### SEC-006: Exact Location Leaked in Public Task Feed

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/task/TaskController.java:415-417`
- **Violated:** REQ-TASK-03 ("feed MUST show only Approximate Location")
- **Description:** `toPublicTaskResponse` labels fields `approximate_lat`/`approximate_lng` but passes raw exact coordinates from `task.locationLat()`/`task.locationLng()`. The hardcoded `"Ulaanbaatar, Mongolia (Fuzzed)"` text is cosmetic only.
- **Fix:**
  1. Add a `fuzzCoordinate(double coord)` utility that rounds to ~2 decimal places and adds a small random offset within 500m.
  2. Apply fuzzing in `toPublicTaskResponse` before returning lat/lng.
  3. Ensure `location_text` is never included in the public response (already omitted — verify).
- **Test:** `toPublicTaskResponse` output lat/lng differs from input by at least some amount and is within 500m of the original.
- **Validation:** `mn.tasky.TaskLifecycleIntegrationTests` (`...TASK-LIST-LOCATION`)

---

## HIGH (16)

### SEC-007: Negative Payout Amount Exploit (Money Minting)

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/wallet/WalletController.java:78`
- **File:** `src/main/java/mn/tasky/wallet/WalletService.java:112-123`
- **Violated:** REQ-PAY-04
- **Description:** `PayoutRequest.amount` is a raw `int` with no `@Positive` or `@Min` validation. `@Valid` is not on the `@RequestBody`. A negative amount passes the balance check (`currentVal < -1` is false for non-negative balances) and `currentVal - (-1)` increases the balance.
- **Fix:**
  1. Add `@Valid` to `@RequestBody` on the controller method.
  2. Add `@Positive` (or `@Min(1)`) to the `amount` field in `PayoutRequest`.
  3. Add server-side guard in `WalletService.requestPayout()`: `if (amount <= 0) throw IllegalArgumentException`.
- **Test:** Payout with amount 0 or -1 returns 400. Payout with valid positive amount succeeds.
- **Validation:** `mn.tasky.PayoutIntegrationTests` (`...amount must be positive`)

### SEC-008: Double-Credit on Booking Completion (No Deduplication)

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/wallet/WalletService.java:40-71`
- **Violated:** REQ-PAY-02
- **Description:** `creditTaskCompletion()` has no dedup by bookingId. Calling it twice for the same booking doubles the tasker's credit. Two `compute` calls and two `ledger.add()` calls are not atomic together.
- **Fix:**
  1. Track credited bookingIds in a `Set<String> creditedBookingIds`.
  2. At the start of `creditTaskCompletion()`, check and reject if already credited.
  3. When migrated to DB, use a unique constraint on `(booking_id, type=DEPOSIT)` in ledger.
- **Test:** Calling `creditTaskCompletion` twice for the same bookingId results in exactly one credit.
- **Validation:** `mn.tasky.PayoutIntegrationTests` (`...WALLET-DEDUP`)

### SEC-009: Booking State Transition Not Atomic

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/booking/BookingService.java:129-151`
- **Violated:** REQ-BOOK-05, NFR-RELI-01
- **Description:** `transition()` does `get()`, checks status, then `put()`. Two concurrent requests can both read the same status and both succeed.
- **Fix:** Replace with `computeIfPresent()` to make the check-and-update atomic per key.
- **Test:** Concurrent cancel and complete on the same booking — only one succeeds.
- **Validation:** `BookingService.transition()` migrated to atomic `ConcurrentHashMap.compute(...)`; regression coverage via booking/payment integration tests.

### SEC-010: Banned Users Can Refresh Tokens

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/auth/AuthService.java:134-159`
- **Violated:** REQ-ADMIN-03
- **Description:** `refreshToken()` does not check user status before issuing new tokens. Banned user with existing refresh token gets new access tokens. The refresh endpoint bypasses the JWT filter (it's in PUBLIC_PATHS).
- **Fix:** Add status check before `issueSession()`:
  ```java
  if ("BANNED".equals(user.status()) || "SUSPENDED".equals(user.status())) {
      return Optional.empty();
  }
  ```
- **Test:** Banned user's refresh request returns 401.
- **Validation:** `mn.tasky.OtpAuthIntegrationTests` (`...TOKEN-REFRESH-BANNED`)

### SEC-011: No Refund on Cancellation of PAID Bookings

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/booking/BookingController.java:99-158`
- **File:** `src/main/java/mn/tasky/booking/BookingService.java:95-127`
- **Violated:** REQ-BOOK-04, REQ-BOOK-06
- **Description:** When a PAID booking is cancelled, the status transitions to CANCELLED but no refund is issued. For tasker cancellation, PRD requires "full refund to Customer" but only a strike is added. Cancellation fee is recorded but never collected or credited.
- **Fix:**
  1. Customer cancellation of PAID booking: credit `(price - fee)` to customer wallet, credit `fee` to tasker wallet via `WalletService`.
  2. Tasker cancellation of PAID booking: credit full `price` to customer wallet.
  3. Record all refund transactions as `REFUND` type ledger entries.
- **Test:** After tasker cancels a PAID booking, customer wallet balance increases by full price. After customer late-cancels, fee goes to tasker and remainder to customer.
- **Validation:** `mn.tasky.BookingIntegrationTests` (`...TASKER-CANCEL-REFUND`, `...CUSTOMER-CANCEL-FEE`)

### SEC-012: OTP Not Invalidated After Failed Attempts

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/auth/AuthService.java:92-111`
- **Violated:** REQ-AUTH-01
- **Description:** Failed OTP verification returns empty but does not invalidate the challenge or track attempt count. OTP remains valid for 300s.
- **Fix:**
  1. Add an `attempts` counter to `OtpChallenge`.
  2. Increment on each failed verification.
  3. Invalidate (remove) the challenge after 3 failed attempts.
- **Test:** After 3 wrong codes, the correct code is rejected (challenge invalidated).
- **Validation:** `mn.tasky.OtpAuthIntegrationTests` (`...OTP-VERIFY-ATTEMPTS`)

### SEC-013: Blind Index Uses Unsalted SHA-256

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/common/security/CryptoService.java:65-74`
- **Violated:** NFR-SEC-01
- **Description:** `blindIndex()` uses plain SHA-256 without salt or HMAC key. Phone numbers have low entropy (~8 variable digits), making hashes trivially reversible via rainbow table.
- **Fix:**
  1. Add a config property `tasky.security.blind-index-key: ${TASKY_BLIND_INDEX_KEY}`.
  2. Replace `MessageDigest.getInstance("SHA-256")` with `Mac.getInstance("HmacSHA256")` using the secret key.
  3. Add the key to `.env.example`.
- **Test:** Same input with different keys produces different blind indexes. Index is deterministic with same key.
- **Validation:** Crypto path migrated to HMAC-SHA256 with mandatory key wiring (`tasky.security.blind-index-key`).

### SEC-014: No Rate Limiting on Token Refresh Endpoint

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/auth/TokenController.java:29-48`
- **Violated:** AGENTS.md 6
- **Description:** Token refresh has no rate limiting. Attacker with stolen refresh token can flood the endpoint.
- **Fix:** Apply the existing `OtpRateLimitService` pattern (or a shared rate limiter) to the refresh endpoint — e.g., 10 refreshes per user per minute.
- **Test:** 11th refresh request within 1 minute returns 429.
- **Validation:** Refresh endpoint now enforced through `OtpRateLimitService.assertRefreshAllowed(...)`.

### SEC-015: WebSocket Allows All Origins

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/common/config/WebSocketConfig.java:21`
- **Violated:** AGENTS.md 6
- **Description:** `setAllowedOriginPatterns("*")` enables cross-site WebSocket hijacking.
- **Fix:** Replace `"*"` with a config property `tasky.websocket.allowed-origins` defaulting to `http://localhost:5173` for dev. Production sets actual domains.
- **Test:** WebSocket connection from unlisted origin is rejected.
- **Validation:** WebSocket endpoint now configured with `tasky.websocket.allowed-origins`.

### SEC-016: Admin Payout Has No Method-Level Auth or Audit Trail

- **Status:** Open
- **File:** `src/main/java/mn/tasky/admin/AdminPayoutController.java:20,44`
- **Violated:** REQ-PAY-05
- **Description:** No `@PreAuthorize` defense-in-depth. No `@AuthenticationPrincipal` injection — no record of which admin processed a payout.
- **Fix:**
  1. Add `@PreAuthorize("hasRole('ADMIN')")` on the controller class.
  2. Inject `@AuthenticationPrincipal JwtPrincipal` in `processPayout()`.
  3. Pass admin userId to `WalletService.processPayout()` and record it in the ledger entry.
- **Test:** Non-admin user gets 403. Admin payout creates ledger entry with admin userId.

### SEC-017: All Financial Data In-Memory Only

- **Status:** Open
- **File:** `src/main/java/mn/tasky/wallet/WalletService.java:15-18`
- **File:** `src/main/java/mn/tasky/payment/PaymentService.java:22`
- **File:** `src/main/java/mn/tasky/booking/BookingService.java:18`
- **Violated:** REQ-PAY-02, REQ-PAY-04, NFR-RELI-01
- **Description:** Wallet balances, ledger entries, payout requests, payment mappings, and booking state are all in `ConcurrentHashMap`/`CopyOnWriteArrayList`. Any restart loses all financial records.
- **Fix:** This is a known architectural limitation for the current phase. When JDBI DAOs and Flyway migrations are implemented, migrate all financial data stores to PostgreSQL with ACID transactions. Flag as accepted risk for dev/test environments only.
- **Note:** This is tracked as a known limitation, not a bug. Production deployment is blocked until persistence is implemented.

### SEC-018: Missing Input Validation on Dispute Raise

- **Status:** Open
- **File:** `src/main/java/mn/tasky/dispute/DisputeController.java:30,58`
- **Violated:** REQ-SAFE-03
- **Description:** No `@Valid` on `@RequestBody`. `DisputeRequest` has no `@NotBlank` or `@Size` constraints. Allows null bookingId, null/unbounded reason.
- **Fix:**
  1. Add `@Valid` to `@RequestBody` parameter.
  2. Add `@NotBlank` to `bookingId` and `reason`.
  3. Add `@Size(max = 2000)` to `reason`.
  4. Add `@Validated` to the controller class.
- **Test:** Null reason returns 400. Reason exceeding 2000 chars returns 400.

### SEC-019: Missing Input Validation on Review Submission + XSS

- **Status:** Open
- **File:** `src/main/java/mn/tasky/review/ReviewController.java:31,89-93`
- **Violated:** REQ-SAFE-02
- **Description:** No `@Valid`, no constraints on `ReviewRequest`. Comment field is unbounded and returned verbatim (stored XSS risk).
- **Fix:**
  1. Add `@Valid` to `@RequestBody`.
  2. Add `@NotBlank` to `bookingId`, `@Min(1) @Max(5)` to `rating`, `@NotBlank @Size(max = 2000)` to `comment`.
  3. Strip HTML tags from comment before storage.
  4. Add `@Validated` to the controller class.
- **Test:** Rating of 0 or 6 returns 400. Comment with `<script>` tags has tags stripped.

### SEC-020: Missing Input Validation on Messaging + XSS

- **Status:** Open
- **File:** `src/main/java/mn/tasky/messaging/MessagingController.java:35,83,106`
- **Violated:** REQ-MSG-01
- **Description:** Both REST and WebSocket message handlers accept `MessageRequest` without `@Valid`. `content` has no constraints. Stored XSS risk.
- **Fix:**
  1. Add `@Valid` to both REST and WebSocket handler `@RequestBody`/parameter.
  2. Add `@NotBlank @Size(max = 5000)` to `content` in `MessageRequest`.
  3. Strip HTML tags from content before storage/delivery.
  4. Add `@Validated` to the controller class.
- **Test:** Empty content returns 400. Content over 5000 chars returns 400.

### SEC-021: Stored XSS Across All User-Generated Content

- **Status:** Open
- **Files:**
  - `src/main/java/mn/tasky/task/TaskController.java:413` (task description)
  - `src/main/java/mn/tasky/review/ReviewController.java:84` (review comment)
  - `src/main/java/mn/tasky/messaging/MessagingController.java:101` (message content)
  - `src/main/java/mn/tasky/task/TaskController.java:372` (application message)
- **Violated:** AGENTS.md 6 (OWASP Top 10)
- **Description:** All user text fields stored and returned verbatim. If any client renders as HTML, scripts execute.
- **Fix:**
  1. Create a shared `TextSanitizer` utility that strips HTML tags using a simple regex or a library like OWASP Java HTML Sanitizer.
  2. Apply sanitization at the service layer before storing any user-generated text.
  3. Document in API spec that all text fields are plain text, never HTML.
- **Test:** Input `<script>alert(1)</script>` is stored/returned as `alert(1)` (tags stripped).

### SEC-022: Exact Location in Private Task Response Without Booking Check

- **Status:** Open
- **File:** `src/main/java/mn/tasky/task/TaskController.java:427-443`
- **Violated:** REQ-TASK-03
- **Description:** `toTaskResponse` returns exact location. Currently only used for task owner responses (acceptable), but no guard prevents misuse.
- **Fix:** Add a comment documenting that `toTaskResponse` must only be used for task owner or confirmed-booking tasker. Consider renaming to `toOwnerTaskResponse` to make the contract explicit.
- **Test:** Verify no endpoint returns `toTaskResponse` to unauthorized users.

---

## MEDIUM (21)

### SEC-023: SUSPENDED Users Not Blocked by JWT Filter

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/common/security/JwtAuthenticationFilter.java:85-94`
- **Violated:** REQ-BOOK-06
- **Description:** Filter only checks `"BANNED"`, not `"SUSPENDED"`. Suspended taskers (3 cancellations in 30 days) can continue using the platform.
- **Fix:** Add `"SUSPENDED".equals(effectiveStatus)` check. Optionally check `suspension_end_at` for time-limited suspensions.
- **Test:** Suspended user's API request returns 403 with appropriate error code.
- **Validation:** JWT filter now blocks both `BANNED` and `SUSPENDED`.

### SEC-024: WebSocket CONNECT Skips Ban/Suspended Check

- **Status:** Open
- **File:** `src/main/java/mn/tasky/common/config/ChannelInterceptorConfig.java:49-60`
- **Violated:** REQ-ADMIN-03
- **Fix:** After JWT parse, call `authService.currentUserStatus()` and reject CONNECT if BANNED or SUSPENDED.
- **Test:** Banned user's WebSocket CONNECT is rejected.

### SEC-025: No CORS Configuration

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/common/config/SecurityConfig.java` (absent)
- **Violated:** AGENTS.md 4
- **Fix:** Add a `@Bean CorsConfigurationSource` with allowed origins from config property `tasky.cors.allowed-origins`, defaulting to `http://localhost:5173`. Enable in security chain via `.cors(Customizer.withDefaults())`.
- **Test:** Cross-origin request from allowed origin succeeds. Unlisted origin is rejected.
- **Validation:** Added `CorsConfigurationSource` and enabled `.cors(Customizer.withDefaults())`.

### SEC-026: X-Forwarded-For Trusted Without Proxy Validation

- **Status:** Open
- **File:** `src/main/java/mn/tasky/auth/OtpController.java:65-71`
- **Violated:** AGENTS.md 6
- **Fix:** Use the rightmost non-private IP from the header, or configure Spring's `ForwardedHeaderFilter` with trusted proxy IPs.
- **Test:** Spoofed X-Forwarded-For does not bypass rate limiting.

### SEC-027: Rate Limit State Not Shared Across Instances

- **Status:** Open
- **File:** `src/main/java/mn/tasky/auth/OtpRateLimitService.java:20`
- **Violated:** AGENTS.md 6
- **Fix:** Accept as known limitation for single-instance MVP. Document that production requires Redis-backed rate limiting.
- **Note:** Track as accepted risk for current phase.

### SEC-028: All Auth State In-Memory

- **Status:** Open
- **File:** `src/main/java/mn/tasky/auth/AuthService.java:46-54`
- **Violated:** AGENTS.md 4
- **Fix:** Same as SEC-017 — migrate to PostgreSQL when persistence is implemented.
- **Note:** Track as accepted risk for current phase.

### SEC-029: Stale JWT Status Fallback

- **Status:** Open
- **File:** `src/main/java/mn/tasky/common/security/JwtAuthenticationFilter.java:81-84`
- **Violated:** REQ-ADMIN-03
- **Fix:** When user not found in backing store, reject the token instead of falling back to JWT claim: replace `.orElse(principal.status())` with `.orElseThrow()` or return 401.
- **Test:** After server restart (simulated by clearing in-memory store), old JWT is rejected.

### SEC-030: Access and Refresh Tokens Share Signing Key

- **Status:** Open
- **File:** `src/main/java/mn/tasky/common/security/JwtTokenService.java:91-98`
- **Violated:** REQ-AUTH-03
- **Fix:** Consider using opaque refresh tokens (random UUIDs stored server-side) instead of signed JWTs. This simplifies revocation and eliminates forgery risk for refresh tokens.
- **Note:** Lower priority — the `token_type` claim provides differentiation.

### SEC-031: No Idempotency Key on Payment Initiation

- **Status:** Open
- **File:** `src/main/java/mn/tasky/payment/PaymentController.java:37-72`
- **Violated:** NFR-RELI-01
- **Fix:** Track active paymentId per bookingId. If payment already initiated, return existing URL. Accept optional `Idempotency-Key` header.
- **Test:** Two initiation calls for same booking return the same paymentId.

### SEC-032: Cancel-with-Fee Non-Atomic

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/booking/BookingService.java:115-126`
- **Violated:** REQ-BOOK-04
- **Fix:** Incorporate fee calculation into the atomic `compute()` operation rather than a separate `put()` after transition.
- **Test:** Fee is always present on cancelled booking record.
- **Validation:** Cancellation fee now written inside atomic booking transition.

### SEC-033: Platform Fee Hardcoded in Controller

- **Status:** Open
- **File:** `src/main/java/mn/tasky/booking/BookingController.java:174`
- **Violated:** REQ-PAY-03 ("configurable Platform Fee")
- **Fix:** Add config property `tasky.platform.fee-percent: ${TASKY_PLATFORM_FEE:0.10}`. Inject in service layer, not controller.
- **Test:** Changing config value changes the fee deducted.

### SEC-034: Ledger/Balance Inconsistency in Payout Flow

- **Status:** Open
- **File:** `src/main/java/mn/tasky/wallet/WalletService.java:112-141`
- **Violated:** REQ-PAY-04
- **Fix:** Create a `PAYOUT_HOLD` ledger entry in `requestPayout()` when balance is deducted. In `processPayout()`, create `PAYOUT_COMPLETED`. Ensure ledger sums equal balance at all times.
- **Test:** After payout request, ledger sum matches wallet balance.

### SEC-035: QPay Callback No Rate Limiting

- **Status:** Open
- **File:** `src/main/java/mn/tasky/payment/PaymentController.java:74-96`
- **Violated:** NFR-RELI-01
- **Fix:** Add rate limiting to the callback endpoint (e.g., 60 requests per minute per IP). Log distinct failure reasons server-side.
- **Test:** Excessive callback requests from same IP get throttled.

### SEC-036: Notification Validation Missing

- **Status:** Open
- **File:** `src/main/java/mn/tasky/notification/NotificationController.java:23,34`
- **Violated:** REQ-NOTIF-01
- **Fix:** Add `@Valid`, `@NotBlank @Size(max = 500)` to `token`, `@Pattern(regexp = "IOS|ANDROID|WEB")` to `platform`.
- **Test:** Empty token or invalid platform returns 400.

### SEC-037: Admin Dispute Resolution Validation Missing

- **Status:** Open
- **File:** `src/main/java/mn/tasky/admin/AdminDisputeController.java:42,64`
- **Violated:** REQ-ADMIN-02
- **Fix:** Add `@Valid`, `@NotBlank` on `outcome`, `@NotBlank @Size(max = 2000)` on `notes`. Add `@Validated` to controller.
- **Test:** Null outcome returns 400 (not NPE).

### SEC-038: Admin Ban/Unban Validation Missing

- **Status:** Open
- **File:** `src/main/java/mn/tasky/admin/AdminUserController.java:37,47,53`
- **Violated:** REQ-ADMIN-03
- **Fix:** Add `@Valid`, `@NotBlank @Size(max = 1000)` to `reason`. Add `@Validated` to controller.
- **Test:** Empty reason returns 400.

### SEC-039: WebSocket Shared Topics (Eavesdropping Risk)

- **Status:** Open
- **File:** `src/main/java/mn/tasky/common/config/ChannelInterceptorConfig.java:63-77`
- **File:** `src/main/java/mn/tasky/messaging/MessagingService.java:75`
- **Violated:** REQ-MSG-01
- **Fix:** Migrate from `/topic/conversations/{id}` to user-specific destinations (`/user/queue/conversations/{id}`). Use Spring's `SimpMessagingTemplate.convertAndSendToUser()`.
- **Test:** User not in conversation cannot receive messages even if they know the conversation ID.

### SEC-040: Presigned Upload URLs Lack Cryptographic Signature

- **Status:** Open
- **File:** `src/main/java/mn/tasky/task/TaskService.java:430-447`
- **File:** `src/main/java/mn/tasky/auth/AuthService.java:505-522`
- **Violated:** REQ-TASK-04, REQ-SAFE-01
- **Fix:** Add an HMAC signature parameter covering all query params and a timestamp. Validate on upload acceptance. When using real S3/MinIO, leverage the native presigned URL mechanism which includes signatures.
- **Note:** Lower priority if moving to real S3 presigned URLs soon (they have built-in signatures).

### SEC-041: Photo/Verification Keys Not Validated Against Issued Keys

- **Status:** Open
- **File:** `src/main/java/mn/tasky/task/TaskService.java:69-108`
- **File:** `src/main/java/mn/tasky/auth/AuthService.java:241-266`
- **Violated:** REQ-TASK-04, REQ-SAFE-01
- **Fix:** Track issued storage keys per user. Validate submitted keys match issued keys. Add `@Pattern` to validate key format prefix.
- **Test:** Submitting an arbitrary key not issued to the user returns 400.

### SEC-042: Admin Phone Search Decrypts All Records

- **Status:** Open
- **File:** `src/main/java/mn/tasky/auth/AuthService.java:395-399`
- **File:** `src/main/java/mn/tasky/admin/AdminUserController.java:28-30`
- **Violated:** NFR-SEC-01, REQ-ADMIN-01
- **Fix:** Use blind index for exact phone match. For prefix/substring search, implement encrypted prefix indexing or accept exact-match only for MVP. Add audit logging for admin searches.
- **Test:** Admin search does not decrypt phones that don't match the query.

### SEC-043: CSRF Disabled (Acceptable) but Payment Callback Needs Validation

- **Status:** Open
- **File:** `src/main/java/mn/tasky/common/config/SecurityConfig.java:34`
- **Violated:** NFR-RELI-01
- **Fix:** Covered by SEC-004 (HMAC verification). Document CSRF-disable rationale in an ADR.
- **Note:** Informational — no separate action needed beyond SEC-004.

---

## LOW (17)

### SEC-044: Cancellation Fee Can Exceed Booking Price

- **File:** `src/main/java/mn/tasky/booking/BookingService.java:111`
- **Fix:** Cap fee: `Math.min(booking.price(), Math.max(5000, (int)(booking.price() * 0.1)))`.

### SEC-045: Payout Day Check Uses Server Timezone

- **File:** `src/main/java/mn/tasky/admin/AdminPayoutController.java:46`
- **Fix:** Use `LocalDate.now(ZoneId.of("Asia/Ulaanbaatar"))`.

### SEC-046: Disclaimer Acceptance Return Value Ignored

- **File:** `src/main/java/mn/tasky/payment/PaymentController.java:57-58`
- **Fix:** Check return value of `recordDisclaimerAcceptance()` and fail if empty.

### SEC-047: Actuator Endpoints Publicly Exposed

- **File:** `src/main/java/mn/tasky/common/config/SecurityConfig.java:44-48`
- **Fix:** Restrict `/actuator/prometheus` and `/actuator/metrics` to authenticated or internal-only access. Keep `/actuator/health` public.

### SEC-048: OTP Rate Limit Memory Leak

- **File:** `src/main/java/mn/tasky/auth/OtpRateLimitService.java:58`
- **Fix:** Use a Caffeine cache with TTL instead of raw `ConcurrentHashMap`, or add periodic cleanup of empty deques.

### SEC-049: OTP Comparison Not Constant-Time

- **Status:** FIXED (2026-02-14)
- **File:** `src/main/java/mn/tasky/auth/AuthService.java:104`
- **Fix:** Replace `challenge.code().equals(code)` with `MessageDigest.isEqual(challenge.code().getBytes(), code.getBytes())`.
- **Validation:** `AuthService` now uses constant-time comparison during OTP verification.

### SEC-050: TraceErrorAttributes May Leak Stack Traces

- **File:** `src/main/java/mn/tasky/common/observability/TraceErrorAttributes.java:15-29`
- **Fix:** Remove `message`, `exception`, and `trace` keys from returned map. Ensure `server.error.include-stacktrace=never` in production config.

### SEC-051: Notification Service Logs Device Tokens in Plaintext

- **File:** `src/main/java/mn/tasky/notification/NotificationService.java:26,35,50`
- **Fix:** Log only truncated tokens and non-sensitive metadata.

### SEC-052: Geo-Inference via Binary Search on Radius Filter

- **File:** `src/main/java/mn/tasky/task/TaskService.java:207-225`
- **Fix:** After fixing SEC-006, apply fuzzing to coordinates used in distance filtering, or use grid-based filtering.

### SEC-053: Review Pagination No Max Limit

- **File:** `src/main/java/mn/tasky/review/ReviewController.java:58`
- **Fix:** Add `@Min(1) @Max(100)` to `limit` parameter.

### SEC-054: Message Pagination No Max Limit

- **File:** `src/main/java/mn/tasky/messaging/MessagingController.java:63`
- **Fix:** Add `@Min(1) @Max(100)` to `limit` parameter.

### SEC-055–SEC-061: Missing `@Validated` on 7 Controllers

- **Files:** DisputeController, ReviewController, MessagingController, NotificationController, AdminDisputeController, AdminUserController, AdminPayoutController
- **Fix:** Add `@Validated` class annotation to each. (Partially covered by SEC-018 through SEC-038 fixes.)

---

## INFO (4)

### SEC-062: `.env` and `.env.example` Contain Identical Credentials

- **Status:** FIXED (2026-02-14)
- **Fix:** Differentiate them. Add `TASKY_JWT_SECRET`, `TASKY_ENCRYPTION_KEY`, `TASKY_BLIND_INDEX_KEY`, `TASKY_QPAY_WEBHOOK_SECRET` to `.env.example` with placeholder values and generation instructions.
- **Validation:** `.env.example` now contains placeholders/instructions; `.env` now contains generated local development secrets.

### SEC-063: Payment Callback Endpoint Publicly Accessible (By Design)

- **Note:** `/api/v1/payments/qpay/callback` being `permitAll()` is correct for a webhook. Security relies on HMAC verification (SEC-004).

### SEC-064: Static OTP in Dev (Duplicate of SEC-001)

- **Note:** Covered by SEC-001.

### SEC-065: Task Feed Auth Is Correct (Informational)

- **Note:** `GET /api/v1/tasks` requires authentication but no role restriction. This is correct per REQ-TASK-03.

---

## Implementation Order (Recommended)

### Phase 1: Merge Blockers (SEC-001 through SEC-006)

These are required by AGENTS.md before any merge to main. They address secrets in code, placeholder auth, and direct financial/privacy exploits.

### Phase 2: Direct Exploits (SEC-007 through SEC-011)

Negative payout, double-credit, missing refunds, and banned user bypass. Each is a concrete attack path.

### Phase 3: Input Validation Sweep (SEC-018 through SEC-021, SEC-036 through SEC-038, SEC-053 through SEC-061)

Systematic pass to add `@Valid`, `@Validated`, size constraints, and XSS sanitization across all controllers.

### Phase 4: Access Control Hardening (SEC-023, SEC-024, SEC-029, SEC-039)

Suspended user blocking, WebSocket ban checks, stale JWT handling, user-specific WebSocket destinations.

### Phase 5: Configuration & Operational Security (SEC-025, SEC-026, SEC-031 through SEC-035, SEC-044 through SEC-052)

CORS, rate limiting, idempotency, fee configuration, timezone, actuator restrictions, logging hygiene.

### Phase 6: Architectural (SEC-017, SEC-027, SEC-028, SEC-030, SEC-040 through SEC-042)

Persistence migration, shared rate limiting, presigned URL signatures, key validation. These are larger efforts tied to the JDBI/PostgreSQL migration.
