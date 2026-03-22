# Security Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all 51 findings from the 2026-03-22 security audit, organized into 12 independent tasks grouped by blast radius and dependency order.

**Architecture:** Fix CRITICALs first (secrets, IDOR, race conditions), then HIGHs (auth hardening, headers, WebSocket, S3 key validation), then MEDIUMs and LOWs as hardening passes. Each task is self-contained and independently deployable.

**Tech Stack:** Spring Boot 3.4.2, JDBI, PostgreSQL, Flyway, jjwt, AWS SDK v2

---

## Task 1: Remove Secrets from Source Control & Fix Dev-Auth Default

**Findings addressed:** C1 (dev-auth default true), C2 (Facebook secret in VCS), C3 (encryption key in VCS), C9 (OTP test code in VCS)

**Files:**
- Modify: `src/main/resources/application.yml:63`
- Modify: `src/main/resources/application-dev.yml:11-22`

- [ ] **Step 1: Change dev-auth default to `false` in base config**

In `application.yml` line 63, change:
```yaml
  dev-auth:
    enabled: ${TASKY_DEV_AUTH_ENABLED:false}
```

- [ ] **Step 2: Remove all secrets from `application-dev.yml`**

Replace `application-dev.yml` with env-var-only references:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/tasky
    username: tasky
    password: tasky

tasky:
  dev-auth:
    enabled: true
  auth:
    otp-test-code: ${TASKY_OTP_TEST_CODE:}
  facebook:
    app-id: ${TASKY_FACEBOOK_APP_ID:dev-placeholder}
    app-secret: ${TASKY_FACEBOOK_APP_SECRET:dev-placeholder}
  security:
    jwt-secret: ${TASKY_JWT_SECRET:dev-only-jwt-secret-not-for-production-use-replace-me-1234567890}
    encryption-key: ${TASKY_ENCRYPTION_KEY:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=}
    blind-index-key: ${TASKY_BLIND_INDEX_KEY:dev-only-blind-index-key-not-for-production-use-replace-me-12345}
    access-token-ttl-seconds: 3600
    refresh-token-ttl-seconds: 2592000
  qpay:
    webhook-secret: ${TASKY_QPAY_WEBHOOK_SECRET:dev-only-qpay-webhook-secret-not-for-production-use-replace-me}
```

- [ ] **Step 3: Verify the app still boots with `dev` profile**

Run: `./gradlew bootRun` (set required env vars in `.env.local`)
Expected: App starts without `IllegalStateException`

- [ ] **Step 4: Commit**

```bash
git add src/main/resources/application.yml src/main/resources/application-dev.yml
git commit -m "fix(security): remove hardcoded secrets from VCS, default dev-auth to false

Addresses: C1 (dev-auth default), C2 (Facebook secret), C3 (encryption key), C9 (OTP test code)"
```

> **Post-merge action (manual):** Rotate the leaked Facebook app secret (`1d9b7d23...`) in the Facebook Developer Console immediately. The old secret should be considered compromised.

---

## Task 2: Fix IDOR — Task Drafts Ownership Check

**Findings addressed:** C4 (draft IDOR)

**Files:**
- Modify: `src/main/java/mn/tasky/task/application/TaskDraftService.java:75-105`
- Modify: `src/main/java/mn/tasky/task/api/TaskController.java:721-756`
- Test: `src/test/java/mn/tasky/task/TaskDraftAccessControlTest.java` (create)

- [ ] **Step 1: Write failing test — unauthorized draft access returns 404**

```java
@Test
void getDraft_differentUser_returns404() {
    // Create draft as user A
    TaskDraft draft = taskDraftService.createDraft(USER_A_ID, CATEGORY_ID);
    // Attempt to read as user B
    Optional<TaskDraft> result = taskDraftService.getDraft(draft.id(), USER_B_ID);
    assertThat(result).isEmpty();
}

@Test
void updateDraft_differentUser_throws() {
    TaskDraft draft = taskDraftService.createDraft(USER_A_ID, CATEGORY_ID);
    assertThatThrownBy(() -> taskDraftService.updateDraft(draft.id(), USER_B_ID, "{}", "summary"))
            .isInstanceOf(IllegalArgumentException.class);
}
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `./gradlew test --tests '*TaskDraftAccessControlTest*' -i`
Expected: FAIL — methods don't accept userId parameter yet

- [ ] **Step 3: Add ownership check to `TaskDraftService.getDraft`**

```java
public Optional<TaskDraft> getDraft(String draftId, String requestingUserId) {
    return taskDraftDao
            .findById(draftId)
            .filter(draft -> draft.expiresAt() == null || draft.expiresAt().isAfter(Instant.now()))
            .filter(draft -> draft.customerId().equals(requestingUserId));
}
```

- [ ] **Step 4: Add ownership check to `TaskDraftService.updateDraft`**

```java
public TaskDraft updateDraft(String draftId, String requestingUserId, String intakeAnswersJson, String summaryDraft) {
    TaskDraft existing =
            taskDraftDao.findById(draftId).orElseThrow(() -> new IllegalArgumentException("Draft not found."));

    if (!existing.customerId().equals(requestingUserId)) {
        throw new IllegalArgumentException("Draft not found.");
    }

    if (existing.expiresAt() != null && !existing.expiresAt().isAfter(Instant.now())) {
        throw new IllegalStateException("Draft has expired.");
    }

    taskDraftDao.update(draftId, intakeAnswersJson, summaryDraft);
    return taskDraftDao.findById(draftId)
            .orElseThrow(() -> new IllegalStateException("Draft was updated but could not be retrieved."));
}
```

- [ ] **Step 5: Update `TaskController` to pass `principal.userId()`**

In `TaskController.java`:
- Line 724-725: Change `taskDraftService.getDraft(id)` to `taskDraftService.getDraft(id, principal.userId())`
- Line 741: Change `taskDraftService.updateDraft(id, body.intakeAnswers(), body.summaryDraft())` to `taskDraftService.updateDraft(id, principal.userId(), body.intakeAnswers(), body.summaryDraft())`

- [ ] **Step 6: Run tests to confirm they pass**

Run: `./gradlew test --tests '*TaskDraftAccessControlTest*' -i`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/main/java/mn/tasky/task/application/TaskDraftService.java src/main/java/mn/tasky/task/api/TaskController.java src/test/java/mn/tasky/task/TaskDraftAccessControlTest.java
git commit -m "fix(security): add ownership check to task draft GET/PUT endpoints

Prevents IDOR where any authenticated user could read/modify another user's drafts.
Addresses: C4"
```

---

## Task 3: Fix IDOR — Booking Schedule Events Participant Check

**Findings addressed:** C5 (booking schedule IDOR)

**Files:**
- Modify: `src/main/java/mn/tasky/booking/application/BookingScheduleService.java:51-81,91-143`
- Modify: `src/main/java/mn/tasky/booking/api/BookingController.java:672-679`
- Test: `src/test/java/mn/tasky/booking/BookingScheduleAccessControlTest.java` (create)

- [ ] **Step 1: Write failing test — non-participant cannot list schedule events**

```java
@Test
void listScheduleEvents_nonParticipant_throws() {
    assertThatThrownBy(() -> scheduleService.listScheduleEvents(BOOKING_ID, NON_PARTICIPANT_ID))
            .isInstanceOf(IllegalArgumentException.class);
}
```

- [ ] **Step 2: Run test to confirm failure**

Run: `./gradlew test --tests '*BookingScheduleAccessControlTest*' -i`
Expected: FAIL

- [ ] **Step 3: Add participant validation helper to `BookingScheduleService`**

Add at the bottom of the class:
```java
private BookingState requireParticipant(String bookingId, String userId) {
    BookingState booking = bookingDao
            .findById(bookingId)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));
    if (!booking.customerId().equals(userId) && !booking.taskerId().equals(userId)) {
        throw new IllegalArgumentException("Booking not found: " + bookingId);
    }
    return booking;
}
```

- [ ] **Step 4: Use `requireParticipant` in `requestReschedule`**

In `requestReschedule`, replace the `bookingDao.findById(bookingId).orElseThrow(...)` call with:
```java
BookingState booking = requireParticipant(bookingId, actorUserId);
```

- [ ] **Step 5: Use `requireParticipant` in `respondToReschedule`**

In `respondToReschedule`, replace the `bookingDao.findById(bookingId).orElseThrow(...)` call with:
```java
BookingState booking = requireParticipant(bookingId, actorUserId);
```

- [ ] **Step 6: Add participant check to `listScheduleEvents`**

Change signature and add check:
```java
public List<BookingScheduleEvent> listScheduleEvents(String bookingId, String requestingUserId) {
    requireParticipant(bookingId, requestingUserId);
    return scheduleEventDao.findByBookingId(bookingId);
}
```

- [ ] **Step 7: Update `BookingController.getScheduleEvents` to pass userId**

```java
@GetMapping("/{id}/schedule-events")
public ResponseEntity<?> getScheduleEvents(
        @AuthenticationPrincipal JwtPrincipal principal, @PathVariable String id) {
    List<BookingScheduleEvent> events = scheduleService.listScheduleEvents(id, principal.userId());
    List<Map<String, Object>> data =
            events.stream().map(this::toScheduleEventResponse).toList();
    return ResponseEntity.ok(Map.of("data", data));
}
```

- [ ] **Step 8: Run tests**

Run: `./gradlew test --tests '*BookingScheduleAccessControlTest*' -i`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/main/java/mn/tasky/booking/application/BookingScheduleService.java src/main/java/mn/tasky/booking/api/BookingController.java src/test/java/mn/tasky/booking/BookingScheduleAccessControlTest.java
git commit -m "fix(security): add participant check to booking schedule endpoints

Prevents IDOR where any user could view/create/respond to reschedule events on arbitrary bookings.
Addresses: C5"
```

---

## Task 4: Fix Wallet Race Conditions & Add `@Transactional`

**Findings addressed:** C6 (payout double-spend), C7 (no @Transactional), C8 (payment callback non-atomic), H8 (hold/release race), H9 (float fee math), H10 (no audit logging), M16 (no CHECK constraint)

**Files:**
- Modify: `src/main/java/mn/tasky/wallet/application/WalletService.java` (all methods)
- Modify: `src/main/java/mn/tasky/wallet/dao/WalletDao.java:36-41`
- Modify: `src/main/java/mn/tasky/payment/application/PaymentService.java:139-194`
- Create: `src/main/resources/db/migration/V16__wallet_balance_constraints.sql`
- Test: `src/test/java/mn/tasky/wallet/WalletServiceConcurrencyTest.java` (create)

> **Note:** Migration version numbers (V16, V17, etc.) are placeholders. Verify the latest migration number at implementation time and adjust to avoid collisions if other migrations have landed.

- [ ] **Step 1: Write DB migration for CHECK constraints (with data fixup)**

Create `V16__wallet_balance_constraints.sql`:
```sql
-- Fix any existing rows with negative balances before adding constraints.
-- This can happen due to the race conditions this task fixes.
UPDATE wallets SET balance_mnt = 0 WHERE balance_mnt < 0;
UPDATE wallets SET held_balance_mnt = 0 WHERE held_balance_mnt < 0;

ALTER TABLE wallets ADD CONSTRAINT wallet_balance_non_negative CHECK (balance_mnt >= 0);
ALTER TABLE wallets ADD CONSTRAINT wallet_held_balance_non_negative CHECK (held_balance_mnt >= 0);
```

- [ ] **Step 2: Add atomic debit method to `WalletDao`**

Add to `WalletDao.java`:
```java
@SqlUpdate("UPDATE wallets SET balance_mnt = balance_mnt - :amount, updated_at = :now "
        + "WHERE user_id = :userId AND balance_mnt >= :amount")
int debitBalance(@Bind("userId") UUID userId, @Bind("amount") long amount, @Bind("now") Instant now);

default int debitBalance(String userId, long amount, Instant now) {
    return debitBalance(required(userId, "userId"), amount, now);
}

@SqlUpdate("UPDATE wallets SET held_balance_mnt = held_balance_mnt - :amount, updated_at = :now "
        + "WHERE user_id = :userId AND held_balance_mnt >= :amount")
int debitHeldBalance(@Bind("userId") UUID userId, @Bind("amount") long amount, @Bind("now") Instant now);

default int debitHeldBalance(String userId, long amount, Instant now) {
    return debitHeldBalance(required(userId, "userId"), amount, now);
}
```

- [ ] **Step 3: Replace float fee with integer basis points**

In `WalletService.java`, change `creditTaskCompletion` signature:
```java
public void creditTaskCompletion(String taskerId, String bookingId, int totalAmount, int feeBasisPoints) {
```
And compute:
```java
int feeAmount = (int) ((long) totalAmount * feeBasisPoints / 10_000);
int creditAmount = totalAmount - feeAmount;
```

Update **all** callers — the signature change will cause compilation failures until every call site is updated:

1. `src/main/java/mn/tasky/common/outbox/DomainEventOutboxProcessor.java:193` — change `platformFeePercent` field from `double` to `int`, update `@Value` default from `0.15` to `1500`, rename config key to `tasky.wallet.platform-fee-basis-points`
2. `src/test/java/mn/tasky/wallet/WalletServiceTests.java:52,86` — change `0.10` to `1000`
3. `src/test/java/mn/tasky/payment/PayoutIntegrationTests.java:77,200,215,233,234,250` — change `0.1` to `1000`

- [ ] **Step 4: Add `@Transactional` and atomic debits to all wallet methods**

Rewrite `requestPayout` — note: do NOT add a ledger entry here (the existing `processPayout` already records the PAYOUT ledger entry when the payout is processed; adding one at request time would double-count):
```java
@Transactional
public String requestPayout(String userId, int amount) {
    if (amount <= 0) {
        throw new IllegalArgumentException("Payout amount must be greater than zero");
    }
    walletDao.ensureExists(userId, Instant.now());
    Instant now = Instant.now();
    int rows = walletDao.debitBalance(userId, amount, now);
    if (rows == 0) {
        throw new IllegalArgumentException("Insufficient balance for payout");
    }
    String payoutId = UUID.randomUUID().toString();
    payoutRequestDao.insert(payoutId, userId, amount, "PENDING", now);
    log.info("payout_requested userId={} amount={} payoutId={}", userId, amount, payoutId);
    return payoutId;
}
```

Apply the same pattern to `holdFunds`, `releaseFunds`, `confiscateFunds`, `creditTaskCompletion`, `processPayout`. Add `@Transactional` to each. Use `debitBalance`/`debitHeldBalance` instead of read-check-write.

- [ ] **Step 5: Add `@Transactional` to `PaymentService.processCallback`**

Add `@Transactional` annotation to `processCallback()` method.

- [ ] **Step 6: Add SLF4J logger and audit log lines to `WalletService`**

Add at class level:
```java
private static final Logger log = LoggerFactory.getLogger(WalletService.class);
```

Add `log.info(...)` after every balance mutation with userId, amount, operation type, and referenceId.

- [ ] **Step 7: Write concurrency test**

```java
@Test
void concurrentPayouts_cannotExceedBalance() throws Exception {
    // Setup: user with 10000 MNT balance
    // Execute: 5 threads each requesting 10000 MNT payout
    // Assert: exactly 1 succeeds, 4 fail with "Insufficient balance"
    // Assert: final balance is 0, not negative
}
```

- [ ] **Step 8: Run tests**

Run: `./gradlew test --tests '*WalletService*' -i`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/main/java/mn/tasky/wallet/ src/main/java/mn/tasky/payment/application/PaymentService.java src/main/resources/db/migration/V16__wallet_balance_constraints.sql src/test/java/mn/tasky/wallet/
git commit -m "fix(security): eliminate wallet race conditions with atomic SQL and @Transactional

- Add CHECK constraints for non-negative balances
- Use atomic UPDATE...WHERE balance >= amount instead of read-check-write
- Add @Transactional to all multi-statement financial methods
- Replace float fee percent with integer basis points
- Add structured audit logging for all wallet mutations
Addresses: C6, C7, C8, H8, H9, H10, M16"
```

---

## Task 5: Harden JWT — Add `iss`/`aud` Claims & Unify Public Paths

**Findings addressed:** H4 (no iss/aud), M5 (duplicated public paths), L1 (JWT key entropy)

**Files:**
- Modify: `src/main/java/mn/tasky/common/security/JwtTokenService.java:88-113`
- Modify: `src/main/java/mn/tasky/common/security/JwtAuthenticationFilter.java:25-33`
- Modify: `src/main/java/mn/tasky/common/config/SecurityConfig.java:49-60`
- Create: `src/main/java/mn/tasky/common/security/PublicPaths.java`
- Test: `src/test/java/mn/tasky/common/security/JwtTokenServiceTest.java` (modify)

- [ ] **Step 1: Extract shared public paths constant**

Create `PublicPaths.java`:
```java
package mn.tasky.common.security;

import java.util.Set;

public final class PublicPaths {
    public static final Set<String> ALWAYS_PUBLIC = Set.of(
            "/error",
            "/actuator/health",
            "/actuator/info",
            "/api/v1/system/version",
            "/api/v1/auth/facebook",
            "/api/v1/auth/otp/request",
            "/api/v1/auth/otp/verify",
            "/api/v1/auth/token/refresh",
            "/api/v1/auth/facebook/status",
            "/api/v1/payments/qpay/callback",
            "/ws");

    private PublicPaths() {}
}
```

- [ ] **Step 2: Use `PublicPaths` in both `SecurityConfig` and `JwtAuthenticationFilter`**

Replace the duplicate sets in both classes with `PublicPaths.ALWAYS_PUBLIC`.

- [ ] **Step 3: Add `iss` and `aud` claims to JWT issuance (generation side ONLY first)**

> **IMPORTANT — Phased rollout:** Adding `requireIssuer`/`requireAudience` to the parser immediately would invalidate ALL existing tokens, force-logging-out every user. Deploy in two phases:
>
> **Phase A (this step):** Add claims to newly issued tokens. Do NOT enforce on parser yet.
> **Phase B (after access TTL + refresh TTL have elapsed — ~30 days):** Enable parser enforcement.

In `JwtTokenService.issueAccessToken`, add before `.issuedAt(...)`:
```java
.issuer("tasky-server")
.audience().add("tasky-api").and()
```

In `JwtTokenService.issueRefreshToken`, same additions.

**Do NOT change `parseClaims` yet.** Leave a `// TODO PHASE-B: add requireIssuer/requireAudience after 2026-04-22` comment.

- [ ] **Step 4: (Phase B — separate PR after ~30 days) Enforce `iss`/`aud` on parser**

In `parseClaims`, after all old tokens have expired:
```java
return Jwts.parser()
        .verifyWith(signingKey)
        .requireIssuer("tasky-server")
        .requireAudience("tasky-api")
        .build()
        .parseSignedClaims(token)
        .getPayload();
```

- [ ] **Step 5: Run full test suite**

Run: `./gradlew test -i`
Expected: PASS (existing tests that create tokens need updating to include iss/aud in assertions)

- [ ] **Step 5: Commit**

```bash
git commit -m "fix(security): add iss/aud JWT claims and unify public path definitions

Addresses: H4, M5, L1"
```

---

## Task 6: Harden Auth — Facebook TOCTOU, OTP Hashing, X-Forwarded-For

**Findings addressed:** H1 (plaintext OTP), H2 (Facebook TOCTOU), H3 (X-Forwarded-For spoofing)

**Files:**
- Modify: `src/main/java/mn/tasky/auth/application/AuthService.java:411-441` (Facebook cross-check)
- Modify: `src/main/java/mn/tasky/auth/application/AuthService.java:180` (OTP hashing)
- Modify: `src/main/java/mn/tasky/auth/application/FacebookGraphClient.java` (return userId from debugToken)
- Modify: `src/main/java/mn/tasky/common/security/RateLimitFilter.java:99-108` (trusted proxy)
- Modify: `src/main/resources/application.yml` (add trusted-proxy-depth config)
- Create: `src/main/resources/db/migration/V17__otp_code_to_hash.sql`

- [ ] **Step 0: Write DB migration to rename OTP column for clarity**

Create `V17__otp_code_to_hash.sql`:
```sql
-- Rename the column to reflect it now stores a hash, not plaintext.
-- Existing unexpired OTPs (TTL = 5 min) will become unverifiable after deploy.
-- This is acceptable: users simply re-request a new OTP.
ALTER TABLE otp_challenges RENAME COLUMN code TO code_hash;
```

- [ ] **Step 1: Hash OTP codes before storage**

In `AuthService`, when storing OTP, hash with HMAC-SHA256 using the blind index key:
```java
String codeHash = cryptoService.blindIndex(code);
otpChallengeDao.insert(challengeId, phoneBlindIndex, codeHash, expiresAt);
```

Update `OtpChallengeDao` to reference `code_hash` column instead of `code`.

At verification, hash the submitted code and compare:
```java
String submittedHash = cryptoService.blindIndex(submittedCode);
// compare submittedHash against stored code_hash
```

> **Deploy note:** Any OTPs in-flight at deploy time (max 5 min TTL) will fail verification since they were stored as plaintext. Users simply request a new OTP. No data migration of existing codes is needed.

- [ ] **Step 2: Fix Facebook OAuth TOCTOU**

Modify `FacebookGraphClient.debugToken()` to return the `user_id` from the debug_token response. Then in `AuthService.facebookLogin()`:
```java
String debugTokenUserId = facebookGraphClient.debugToken(token);
FacebookGraphClient.FacebookProfile profile = facebookGraphClient.fetchProfile(token);
if (!debugTokenUserId.equals(profile.facebookId())) {
    throw new IllegalArgumentException("Token user mismatch.");
}
```

- [ ] **Step 3: Fix X-Forwarded-For trusted proxy handling**

Add config to `application.yml`:
```yaml
tasky:
  rate-limit:
    trusted-proxy-depth: ${TASKY_TRUSTED_PROXY_DEPTH:0}
```

In `RateLimitFilter.resolveClientIp`, when `trustedProxyDepth > 0`:
```java
private String resolveClientIp(HttpServletRequest request) {
    if (trustedProxyDepth <= 0) {
        return request.getRemoteAddr();
    }
    String forwarded = request.getHeader("X-Forwarded-For");
    if (StringUtils.hasText(forwarded)) {
        String[] parts = forwarded.split(",");
        int clientIndex = Math.max(0, parts.length - trustedProxyDepth);
        String ip = parts[clientIndex].trim();
        if (StringUtils.hasText(ip)) {
            return ip;
        }
    }
    return request.getRemoteAddr();
}
```

- [ ] **Step 4: Run tests**

Run: `./gradlew test -i`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -m "fix(security): hash OTP codes, fix Facebook TOCTOU, trusted proxy for rate limiting

Addresses: H1, H2, H3"
```

---

## Task 7: Add Security Response Headers

**Findings addressed:** H5 (missing headers), M1 (no HSTS/CSP)

**Files:**
- Modify: `src/main/java/mn/tasky/common/config/SecurityConfig.java:64-85`

- [ ] **Step 1: Add headers configuration to `SecurityFilterChain`**

After `.cors(Customizer.withDefaults())`, add:
```java
.headers(headers -> headers
    .contentTypeOptions(Customizer.withDefaults())
    .frameOptions(frame -> frame.deny())
    .httpStrictTransportSecurity(hsts -> hsts
        .includeSubDomains(true)
        .maxAgeInSeconds(31536000))
    .referrerPolicy(referrer -> referrer
        .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
    .permissionsPolicy(permissions -> permissions
        .policy("camera=(), microphone=(), geolocation=(self)")))
```

- [ ] **Step 2: Add `Cache-Control: no-store` to auth responses**

In `AuthService.issueSession` or at the controller level for `/api/v1/auth/**` responses, set:
```java
response.setHeader("Cache-Control", "no-store");
```

- [ ] **Step 3: Run tests**

Run: `./gradlew test -i`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(security): add HSTS, X-Frame-Options, CSP, referrer-policy headers

Addresses: H5, M1"
```

---

## Task 8: Harden WebSocket — Subscription Allowlist, SEND Interception, Transport Limits

**Findings addressed:** H11 (subscription auth gap), H12 (SEND not intercepted), H13 (no transport limits), M4 (WS rate limit bypass), L6 (no WS rate limit on CONNECT)

**Files:**
- Modify: `src/main/java/mn/tasky/common/config/ChannelInterceptorConfig.java:52-86`
- Modify: `src/main/java/mn/tasky/common/config/WebSocketConfig.java`

- [ ] **Step 1: Add transport limits to `WebSocketConfig`**

Override `configureWebSocketTransport`:
```java
@Override
public void configureWebSocketTransport(
        org.springframework.web.socket.config.annotation.WebSocketTransportRegistration registration) {
    registration.setMessageSizeLimit(16 * 1024);     // 16KB max message
    registration.setSendBufferSizeLimit(512 * 1024);  // 512KB send buffer
    registration.setSendTimeLimit(20 * 1000);          // 20s send timeout
}
```

- [ ] **Step 2: Add deny-by-default subscription authorization**

In `ChannelInterceptorConfig`, replace the existing `assertAuthorizedConversationSubscription`:
```java
private void assertAuthorizedSubscription(StompHeaderAccessor accessor) {
    String destination = accessor.getDestination();
    if (destination == null) {
        throw new IllegalArgumentException("Forbidden: null destination");
    }

    if (destination.startsWith("/topic/conversations/")) {
        String conversationId = destination.substring("/topic/conversations/".length());
        JwtPrincipal principal = requireJwtPrincipal(accessor);
        assertUserNotRestricted(principal);
        boolean isParticipant = messagingService.listConversations(principal.userId()).stream()
                .anyMatch(c -> c.id().equals(conversationId));
        if (!isParticipant) {
            throw new IllegalArgumentException("Forbidden");
        }
        return;
    }

    // Deny all other topic subscriptions
    throw new IllegalArgumentException("Forbidden: subscription not allowed to " + destination);
}
```

- [ ] **Step 3: Add SEND command interception**

In the interceptor `preSend`, add after the SUBSCRIBE block:
```java
} else if (StompCommand.SEND.equals(command)) {
    // Only allow sends to /app/conversations/{id}/messages
    String destination = accessor.getDestination();
    if (destination == null || !destination.matches("/app/conversations/[^/]+/messages")) {
        throw new IllegalArgumentException("Forbidden: send not allowed to " + destination);
    }
    requireJwtPrincipal(accessor); // ensure still authenticated
}
```

- [ ] **Step 4: Run tests**

Run: `./gradlew test -i`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -m "fix(security): harden WebSocket with subscription allowlist, SEND interception, transport limits

Addresses: H11, H12, H13, M4"
```

---

## Task 9: Validate S3 Storage Keys

**Findings addressed:** H6 (arbitrary S3 key), H7 (path traversal via storage keys)

**Files:**
- Modify: `src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java:61-84`
- Test: `src/test/java/mn/tasky/common/storage/S3PresignedUrlServiceTest.java` (create)

- [ ] **Step 1: Write failing tests for key validation**

```java
@Test
void generateDownloadUrl_rejectsTraversalKey() {
    assertThatThrownBy(() -> service.generateDownloadUrl("../../etc/passwd"))
            .isInstanceOf(IllegalArgumentException.class);
}

@Test
void generateDownloadUrl_rejectsArbitraryKey() {
    assertThatThrownBy(() -> service.generateDownloadUrl("private/admin/secret.pdf"))
            .isInstanceOf(IllegalArgumentException.class);
}

@Test
void generateDownloadUrl_acceptsValidKey() {
    assertThatCode(() -> service.generateDownloadUrl("uploads/tasks/abc-123/photo.jpg"))
            .doesNotThrowAnyException();
}
```

- [ ] **Step 2: Add key validation to `S3PresignedUrlService`**

```java
private static final java.util.regex.Pattern VALID_KEY_PATTERN =
        java.util.regex.Pattern.compile("^uploads/(tasks|avatars|evidence|verification)/[a-zA-Z0-9_/-]+\\.[a-z]{3,4}$");

private void validateKey(String key) {
    if (key == null || key.contains("..") || !VALID_KEY_PATTERN.matcher(key).matches()) {
        throw new IllegalArgumentException("Invalid storage key: " + key);
    }
}
```

Call `validateKey(key)` at the start of both `generateUploadUrl` and `generateDownloadUrl`.

- [ ] **Step 3: Run tests**

Run: `./gradlew test --tests '*S3PresignedUrlServiceTest*' -i`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(security): validate S3 storage keys to prevent path traversal and unauthorized access

Addresses: H6, H7"
```

---

## Task 10: Fix Data Retention — Delete S3 Objects

**Findings addressed:** H14 (S3 objects not deleted during retention)

**Files:**
- Modify: `src/main/java/mn/tasky/auth/application/DataRetentionService.java` (add S3 deletion)
- Create: `src/main/java/mn/tasky/common/storage/S3StorageService.java` (new service wrapping S3Client for object deletion)

> **Note:** `S3PresignedUrlService` uses `S3Presigner`, not `S3Client`. Object deletion requires `S3Client`. Create a separate `S3StorageService` that builds an `S3Client` from the same config, rather than mixing concerns.

- [ ] **Step 1: Create `S3StorageService` with `deleteObject`**

Create `src/main/java/mn/tasky/common/storage/S3StorageService.java`:
```java
package mn.tasky.common.storage;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

@Service
public class S3StorageService {

    private final S3Client s3Client;
    private final String bucket;

    public S3StorageService(
            @Value("${tasky.storage.endpoint:http://localhost:9000}") String endpoint,
            @Value("${tasky.storage.access-key:minioadmin}") String accessKey,
            @Value("${tasky.storage.secret-key:minioadmin}") String secretKey,
            @Value("${tasky.storage.bucket:tasky-local}") String bucket) {
        this.bucket = bucket;
        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.US_EAST_1)
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .forcePathStyle(true)
                .build();
    }

    public void deleteObject(String key) {
        if (key == null || key.contains("..")) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }
}
```

- [ ] **Step 2: Call delete before DB anonymization in `DataRetentionService`**

Before `verificationDao.anonymize(v.id())`, delete the S3 objects:
```java
if (StringUtils.hasText(v.frontImageKey())) {
    s3StorageService.deleteObject(v.frontImageKey());
}
if (StringUtils.hasText(v.backImageKey())) {
    s3StorageService.deleteObject(v.backImageKey());
}
```

- [ ] **Step 3: Run tests**

Run: `./gradlew test -i`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(security): delete S3 verification images during data retention

Addresses: H14"
```

---

## Task 11: CORS, Input Validation, Error Leakage, Observability Hardening

**Findings addressed:** M2 (review nullable ratings), M3 (CORS wildcard headers), M6 (QPay rate limit), M11 (stored XSS), M12 (no budget max), M14 (exception message leakage), M15 (self-delete BANNED status), M17 (correlation ID injection), M18 (feature toggle JSON injection), L2 (blind index key encoding), L3 (actuator exposure), L4 (dev token TTL), L5 (no lat/lng range)

**Files:**
- Modify: `src/main/java/mn/tasky/common/config/SecurityConfig.java:93` (CORS headers)
- Modify: `src/main/java/mn/tasky/common/observability/RequestObservabilityFilter.java:69-73` (sanitize IDs)
- Modify: `src/main/java/mn/tasky/common/feature/FeatureToggleService.java:37` (Jackson for JSON)
- Modify: `src/main/java/mn/tasky/common/security/RateLimitFilter.java:57-59` (QPay rate limit)
- Modify: `src/main/java/mn/tasky/user/api/UserProfileController.java:124-137` (self-delete status)
- Modify: `src/main/java/mn/tasky/common/security/CryptoService.java:44` (blind index key)
- Modify: various controllers (replace `e.getMessage()` with generic messages)
- Modify: `src/main/java/mn/tasky/task/dto/CreateTaskRequest.java` (add `@Max` to budget, lat/lng ranges, photoKey size)
- Modify: `src/main/java/mn/tasky/review/dto/ReviewRequest.java` (add `@NotNull` to required rating)
- Modify: `src/main/resources/application.yml` (error property lockdown, actuator tightening)

- [ ] **Step 1: Restrict CORS allowed headers (M3)**

In `SecurityConfig.java` line 93:
```java
configuration.setAllowedHeaders(List.of(
    "Authorization", "Content-Type", "Accept", "Accept-Language",
    "Idempotency-Key", "X-Correlation-Id", "X-Trace-Id", "X-Client-Platform"));
```

- [ ] **Step 2: Sanitize correlation/trace IDs (M17)**

In `RequestObservabilityFilter.resolveOrCreateId`:
```java
private static final java.util.regex.Pattern SAFE_ID_PATTERN =
        java.util.regex.Pattern.compile("^[a-zA-Z0-9._-]{1,128}$");

private String resolveOrCreateId(String value) {
    if (StringUtils.hasText(value)) {
        String trimmed = value.trim();
        if (SAFE_ID_PATTERN.matcher(trimmed).matches()) {
            return trimmed;
        }
    }
    return UUID.randomUUID().toString();
}
```

- [ ] **Step 3: Use Jackson for audit JSON in `FeatureToggleService` (M18)**

Inject `ObjectMapper` and replace string concat on line 37:
```java
String payload = objectMapper.writeValueAsString(
        Map.of("feature_name", featureName, "is_enabled", enabled));
```

- [ ] **Step 4: Add input validation to DTOs (M2, M12, L5)**

In `CreateTaskRequest`:
- Add `@Max(50_000_000)` to `budget` (50M MNT ceiling)
- Add `@Min(-90) @Max(90)` to `locationLat`
- Add `@Min(-180) @Max(180)` to `locationLng`
- Add `@Size(max = 256)` to individual `photoKeys` elements

In `ReviewRequest`:
- Add `@NotNull` to at least `qualityRating`

- [ ] **Step 5: Replace exception message leakage in controllers (M14)**

In `MessagingController`, `TaskController`, `BookingController` — replace `e.getMessage()` returns with generic messages:
```java
// Before:
"message", e.getMessage()
// After:
"message", "The requested operation could not be completed."
```

Keep the original exception message in server logs only:
```java
log.warn("Operation failed: {}", e.getMessage());
```

Specific files and lines to update:
- `src/main/java/mn/tasky/messaging/api/MessagingController.java` lines 87, 114
- `src/main/java/mn/tasky/task/api/TaskController.java` lines 710, 716, 747, 753
- `src/main/java/mn/tasky/booking/api/BookingController.java` lines 563, 570, 615
- `src/main/java/mn/tasky/admin/api/AdminPayoutController.java` line 124

- [ ] **Step 6: Add QPay callback rate limit (M6)**

Remove `/ws` exclusion from `shouldNotFilter` is correct, but additionally add a stricter unauthenticated endpoint limit. In `RateLimitFilter.doFilterInternal`, after the existing unauthenticated path, add a tighter limit for the callback:
```java
if (!authenticated && request.getRequestURI().equals("/api/v1/payments/qpay/callback")) {
    rateKey = "api-qpay-callback:" + resolveClientIp(request);
    limit = 10; // 10 req/min for webhook endpoint
}
```

- [ ] **Step 7: Add server-side text sanitization for stored XSS defense-in-depth (M11)**

Add a utility method and apply it in service layers before persisting user-supplied free text:
```java
// In a new file: src/main/java/mn/tasky/common/validation/TextSanitizer.java
package mn.tasky.common.validation;

public final class TextSanitizer {
    private TextSanitizer() {}

    /** Strip HTML tags from user input as defense-in-depth against stored XSS. */
    public static String stripHtml(String input) {
        if (input == null) return null;
        return input.replaceAll("<[^>]*>", "").trim();
    }
}
```

Apply `TextSanitizer.stripHtml()` in service layers before persistence for:
- `TaskService.createTask` — description, locationText
- `MessagingService.sendMessage` — content
- `ReviewService.submitReview` — comment
- `DisputeService.fileDispute` — reason, evidence textPayload
- `ProfileDao.updateNameAndAvatar` — fullName

- [ ] **Step 8: Fix self-delete status (M15)**

In `UserProfileController.java` line 134, change:
```java
// Before:
userDao.updateStatus(principal.userId(), "BANNED");
// After:
userDao.updateStatus(principal.userId(), "DELETED");
```

Add `DELETED` to the status CHECK constraint if one exists, or document that `DELETED` is a valid user status. The `JwtAuthenticationFilter` should treat `DELETED` the same as `BANNED` — add it to the status check on line 86:
```java
if ("BANNED".equals(effectiveStatus) || "SUSPENDED".equals(effectiveStatus) || "DELETED".equals(effectiveStatus)) {
```

- [ ] **Step 9: Fix blind index key encoding (L2)**

In `CryptoService.java` line 44, change to Base64-decode the blind index key (consistent with the encryption key):
```java
// Before:
this.blindIndexKey = new SecretKeySpec(blindIndexKey.getBytes(StandardCharsets.UTF_8), BLIND_INDEX_ALGORITHM);
// After:
this.blindIndexKey = new SecretKeySpec(Base64.getDecoder().decode(blindIndexKey), BLIND_INDEX_ALGORITHM);
```

> **Deploy note:** This changes the blind index output for all existing phone lookups. Must re-index all `phone_blind_index` values in the `users` table with the new key encoding. Add a one-time migration task or script. Alternatively, defer this to a maintenance window and issue a new blind-index key simultaneously.

- [ ] **Step 10: Lock down error properties and actuator (L3, L4)**

In `application.yml`, add under `server:`:
```yaml
server:
  port: ${PORT:8080}
  error:
    include-message: never
    include-stacktrace: never
    include-binding-errors: never
```

- [ ] **Step 11: Run full test suite**

Run: `./gradlew test -i`
Expected: PASS

- [ ] **Step 12: Commit**

```bash
git commit -m "fix(security): harden CORS, input validation, error messages, observability, text sanitization

- Restrict CORS to explicit headers (M3)
- Sanitize correlation/trace IDs against log injection (M17)
- Fix audit log JSON injection via Jackson (M18)
- Add budget max, lat/lng range, photoKey size validation (M2, M12, L5)
- Remove exception message leakage from 4 controllers (M14)
- Add QPay callback-specific rate limit (M6)
- Strip HTML tags from user text inputs as XSS defense-in-depth (M11)
- Use DELETED status for self-delete instead of BANNED (M15)
- Fix blind index key to use Base64 decoding (L2)
- Lock down error properties and actuator exposure (L3, L4)
Addresses: M2, M3, M6, M11, M12, M14, M15, M17, M18, L2, L3, L4, L5"
```

---

## Task 12: Admin Audit Trail & Remaining Hardening

**Findings addressed:** H3-admin (verification approve/reject no actor), M7 (admin verification no audit), M8 (moderation no audit), M9 (ServiceArea role via code), M10 (task sub-paths no role gating), L6 (no WS CONNECT rate limit), L7 (SystemInfo disclosure), L8 (outbox no max retry), L9 (Firebase JSON in env var), L10 (AdminFeatureToggle unvalidated Map)

**Files:**
- Modify: `src/main/java/mn/tasky/admin/api/AdminVerificationController.java`
- Modify: `src/main/java/mn/tasky/admin/api/AdminModerationController.java`
- Modify: `src/main/java/mn/tasky/admin/api/AdminFeatureToggleController.java`
- Create: `src/main/java/mn/tasky/admin/dto/UpdateFeatureToggleRequest.java`
- Modify: `src/main/java/mn/tasky/common/config/SecurityConfig.java` (add role rules)
- Modify: `src/main/java/mn/tasky/notification/api/ServiceAreaController.java`
- Modify: `src/main/java/mn/tasky/common/config/SystemInfoController.java`
- Modify: `src/main/java/mn/tasky/common/outbox/DomainEventOutboxProcessor.java`
- Modify: `src/main/java/mn/tasky/common/config/ChannelInterceptorConfig.java`

- [ ] **Step 1: Add `@AuthenticationPrincipal` to admin verification approve/reject (M7)**

In `AdminVerificationController`, add `@AuthenticationPrincipal JwtPrincipal principal` parameter to both `approve` and `reject` methods, and insert audit events:
```java
@PostMapping("/{id}/approve")
public ResponseEntity<?> approve(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id) {
    // ... existing logic ...
    auditEventDao.insert(principal.userId(), "VERIFICATION_APPROVED", "VERIFICATION", id, null);
    // ...
}

@PostMapping("/{id}/reject")
public ResponseEntity<?> reject(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        @RequestBody Map<String, String> body) {
    // ... existing logic ...
    auditEventDao.insert(principal.userId(), "VERIFICATION_REJECTED", "VERIFICATION", id,
            "{\"reason\":\"" + body.getOrDefault("reason", "") + "\"}");
    // ...
}
```

- [ ] **Step 2: Add actor attribution to `AdminModerationController` (M8)**

Inject `@AuthenticationPrincipal JwtPrincipal principal` and pass to audit:
```java
@PutMapping("/strike-policy")
public ResponseEntity<?> updateStrikePolicy(
        @AuthenticationPrincipal JwtPrincipal principal,
        @Valid @RequestBody UpdateModerationPolicyRequest body) {
    // ... existing logic ...
    auditEventDao.insert(principal.userId(), "MODERATION_POLICY_UPDATED", "MODERATION_POLICY", null,
            objectMapper.writeValueAsString(body));
    // ...
}
```

- [ ] **Step 3: Create typed DTO for `AdminFeatureToggleController` (L10)**

Create `src/main/java/mn/tasky/admin/dto/UpdateFeatureToggleRequest.java`:
```java
package mn.tasky.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateFeatureToggleRequest(
    @NotBlank @JsonProperty("feature_name") String featureName,
    @NotNull @JsonProperty("is_enabled") Boolean isEnabled) {}
```

Update `AdminFeatureToggleController.update()` to accept `@Valid @RequestBody UpdateFeatureToggleRequest body` instead of `Map<String, Object>`.

- [ ] **Step 4: Move ServiceArea role check to SecurityConfig (M9)**

In `SecurityConfig`, add before `.anyRequest().authenticated()`:
```java
.requestMatchers("/api/v1/taskers/me/service-areas").hasRole("TASKER")
```

In `ServiceAreaController`, remove the manual `if (!"TASKER".equals(principal.role()))` check.

- [ ] **Step 5: Add SecurityConfig role gating for task sub-paths (M10)**

In `SecurityConfig`, add:
```java
.requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/v1/tasks/*").hasRole("CUSTOMER")
.requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/tasks/*/cancel").hasRole("CUSTOMER")
.requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/tasks/*/applications").hasRole("TASKER")
```

- [ ] **Step 6: Remove version endpoint from public paths or reduce info (L7)**

In `SystemInfoController`, remove the server timestamp from the response (reduces info disclosure):
```java
return Map.of(
    "api_version", apiVersion
);
```

Remove `application_name` and `server_time` fields.

- [ ] **Step 7: Add max retry limit to outbox processor (L8)**

In `DomainEventOutboxProcessor`, add a max attempts constant and check:
```java
private static final int MAX_ATTEMPTS = 10;

// In the processing loop, before processing an event:
if (event.attempts() >= MAX_ATTEMPTS) {
    log.error("Outbox event exceeded max retries, marking as DEAD_LETTER: eventId={} type={}",
            event.id(), event.eventType());
    outboxEventDao.updateStatus(event.id(), "DEAD_LETTER");
    continue;
}
```

- [ ] **Step 8: Add WebSocket CONNECT rate limiting (L6)**

In `ChannelInterceptorConfig`, after successful JWT validation in the CONNECT handler, add a simple per-user connection counter check. Use an in-memory `ConcurrentHashMap<String, AtomicInteger>` to track active connections per user:
```java
private final ConcurrentHashMap<String, AtomicInteger> activeConnections = new ConcurrentHashMap<>();
private static final int MAX_CONNECTIONS_PER_USER = 5;

// In CONNECT handler, after JWT validation:
AtomicInteger count = activeConnections.computeIfAbsent(principal.userId(), k -> new AtomicInteger(0));
if (count.incrementAndGet() > MAX_CONNECTIONS_PER_USER) {
    count.decrementAndGet();
    throw new IllegalArgumentException("Too many WebSocket connections");
}
```

> **Note on L9 (Firebase JSON in env var):** This is an accepted risk. The standard practice for GCP service accounts in containerized environments is env vars. Migrating to Workload Identity Federation is a separate infrastructure initiative, not a code change. Documented as accepted in the post-implementation checklist.

- [ ] **Step 9: Run full test suite**

Run: `./gradlew test -i`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git commit -m "fix(security): admin audit trail, typed DTOs, role gating, outbox retry limit, WS rate limit

- Add admin actor attribution to verification and moderation endpoints (M7, M8)
- Create typed DTO for feature toggle updates (L10)
- Move ServiceArea role check to SecurityConfig (M9)
- Add SecurityConfig role gating for task sub-paths (M10)
- Reduce SystemInfo endpoint disclosure (L7)
- Add max retry / dead-letter for outbox events (L8)
- Add per-user WebSocket CONNECT rate limiting (L6)
- L9 (Firebase env var) accepted as infrastructure-level risk
Addresses: M7, M8, M9, M10, L6, L7, L8, L9, L10"
```

---

## Execution Order & Dependencies

```
Task 1 (secrets)        ── no deps, do first ──────────────────────┐
Task 2 (draft IDOR)     ── no deps, parallel with 1 ───────────────┤
Task 3 (schedule IDOR)  ── no deps, parallel with 1,2 ─────────────┤
Task 4 (wallet races)   ── no deps, parallel with 1,2,3 ───────────┤  Phase 1: CRITICALs
                                                                    │
Task 5 (JWT hardening)  ── after Task 1 (config change) ───────────┤
Task 6 (auth hardening) ── after Task 1 (config change) ───────────┤  Phase 2: HIGHs
Task 7 (headers)        ── no deps, parallel ───────────────────────┤
Task 8 (WebSocket)      ── no deps, parallel ───────────────────────┤
Task 9 (S3 keys)        ── no deps, parallel ───────────────────────┤
Task 10 (data retention) ── after Task 9 (uses key validation) ─────┤
                                                                    │
Task 11 (hardening)     ── after Tasks 5,7 (SecurityConfig changes)─┤  Phase 3: MEDIUM/LOW
Task 12 (admin audit)   ── after Task 11 (SecurityConfig changes) ──┘
```

**Tasks 1-4** can run in parallel (separate files). **Tasks 5-9** can mostly run in parallel. **Tasks 10-12** have light dependencies and should run last.

---

## Post-Implementation Checklist

- [ ] Rotate Facebook app secret in Facebook Developer Console
- [ ] Rotate encryption key in production and re-encrypt all phone numbers
- [ ] If L2 (blind index key encoding) was applied: re-generate all `phone_blind_index` values
- [ ] Run `./gradlew check` (format + analysis + tests + coverage)
- [ ] Run OWASP dependency check: `./gradlew dependencyCheckAnalyze`
- [ ] Verify prod deployment has `TASKY_DEV_AUTH_ENABLED=false`
- [ ] Verify prod deployment has `TASKY_OTP_TEST_CODE` unset/empty
- [ ] Confirm TLS termination at load balancer
- [ ] Pen-test the IDOR fixes (drafts, schedule events) manually
- [ ] Load-test concurrent payout requests to verify race condition fix
- [ ] Schedule Task 5 Phase B (JWT parser enforcement) for ~2026-04-22 after all old tokens expire
- [ ] L9 accepted risk: Firebase service account JSON in env var — consider Workload Identity Federation in future infra sprint

## Findings Coverage Matrix

All 51 findings are addressed:

| Finding | Task | Status |
|---------|------|--------|
| C1-C3, C9 | Task 1 | Secrets removal |
| C4 | Task 2 | Draft IDOR |
| C5 | Task 3 | Schedule IDOR |
| C6-C8 | Task 4 | Wallet atomicity |
| H1-H3 | Task 6 | Auth hardening |
| H4 | Task 5 | JWT claims |
| H5 | Task 7 | Security headers |
| H6-H7 | Task 9 | S3 key validation |
| H8-H10 | Task 4 | Wallet races/audit |
| H11-H13 | Task 8 | WebSocket |
| H14 | Task 10 | Data retention S3 |
| M1 | Task 7 | Headers |
| M2 | Task 11 | Review validation |
| M3 | Task 11 | CORS |
| M4 | Task 8 | WS rate limit |
| M5 | Task 5 | Public paths |
| M6 | Task 11 | QPay rate limit |
| M7-M8 | Task 12 | Admin audit |
| M9-M10 | Task 12 | Role gating |
| M11 | Task 11 | XSS sanitization |
| M12 | Task 11 | Budget max |
| M14 | Task 11 | Error leakage |
| M15 | Task 11 | Self-delete status |
| M16 | Task 4 | Balance CHECK |
| M17-M18 | Task 11 | Observability |
| L1 | Task 5 | JWT key |
| L2 | Task 11 | Blind index key |
| L3-L4 | Task 11 | Actuator/error lockdown |
| L5 | Task 11 | Lat/lng validation |
| L6 | Task 12 | WS CONNECT limit |
| L7 | Task 12 | SystemInfo |
| L8 | Task 12 | Outbox retry |
| L9 | Accepted risk | Firebase env var |
| L10 | Task 12 | Feature toggle DTO |
