# Security Audit Report — Tasky Java Backend

**Auditor:** Distinguished Security Engineer (Google)
**Date:** 2026-02-21
**Scope:** Full Java Spring Boot backend (`src/main/java/mn/tasky/`)
**Methodology:** Static code analysis, configuration review, architecture review

---

## Executive Summary

The backend demonstrates solid security fundamentals: AES-256-GCM encryption for PII, HMAC
blind-indexing, stateless JWT with rotation, constant-time OTP comparison, and a production guard
that blocks dev-mode credentials. However, **7 issues** warrant immediate remediation before a
production launch, ranging from a broken privacy guarantee to a full-service denial-of-service
attack vector.

---

## Severity Classification

| ID   | Title                                                             | Severity     | Component                          |
|------|-------------------------------------------------------------------|--------------|------------------------------------|
| S-01 | Deterministic Location Fuzzing — Privacy Guarantee Is Void       | **CRITICAL** | `TaskController.java:200`          |
| S-02 | Admin Phone Search Loads Entire User Table                        | **CRITICAL** | `AuthService.java:1002`            |
| S-03 | In-Memory Rate Limiter Bypassed in Multi-Instance Deployments    | **HIGH**     | `OtpRateLimitService.java`         |
| S-04 | QPay Webhook Replay Attack — No Timestamp or Nonce               | **HIGH**     | `PaymentService.java:173`          |
| S-05 | Unauthenticated WebSocket CONNECT Allowed                         | **HIGH**     | `ChannelInterceptorConfig.java:58` |
| S-06 | Presigned Upload URLs Carry No Cryptographic Signature            | **HIGH**     | `AuthService.java:660`             |
| S-07 | In-Memory Rate Limiter State Is Never Evicted — Heap Exhaustion  | **HIGH**     | `OtpRateLimitService.java:25`      |
| S-08 | Avatar URL Accepts Any HTTP(S) Domain — Stored URL Injection      | **MEDIUM**   | `UpdateProfileRequest.java:13`     |
| S-09 | Phone Number Not Normalized — Duplicate Accounts for Same Number | **MEDIUM**   | `AuthService.java:208`             |
| S-10 | Token `token_type` Claim Not Asserted on Absence                 | **MEDIUM**   | `JwtTokenService.java:59`          |
| S-11 | Refresh Token Rate Limiting Keyed on `hashCode()`                | **LOW**      | `OtpRateLimitService.java:88`      |
| S-12 | Dev-Auth URL Whitelisted in JWT Filter Regardless of Feature Flag | **LOW**      | `JwtAuthenticationFilter.java:33`  |
| S-13 | `TextSanitizer` Uses Regex, Not an HTML Parser                   | **LOW**      | `TextSanitizer.java:7`             |
| S-14 | Production Guard Checks Only `prod`/`production` Profile Names   | **LOW**      | `AuthService.java:169`             |

---

## Detailed Findings

### S-01 — Deterministic Location Fuzzing: Privacy Guarantee Is Void

**Severity:** CRITICAL
**File:** `TaskController.java:200-214`

```java
private double[] fuzzCoordinates(String seed, double lat, double lng) {
    Random random = new Random(seed.hashCode()); // seed = task UUID (public)
    double angle = random.nextDouble() * Math.PI * 2;
    double distanceMeters = random.nextDouble() * MAX_PUBLIC_OFFSET_METERS;
    ...
}
```

`java.util.Random` is a linear-congruential PRNG, not a CSPRNG. Seeding it with `seed.hashCode()`
(where `seed` is the public task UUID) makes the offset **fully deterministic and reproducible**.
Any caller who knows the task ID (returned in the API response) can compute the exact same `angle`
and `distanceMeters`, subtract the offset, and recover the precise GPS coordinates.

The UI response also states `"approximate_location": "Ulaanbaatar, Mongolia (Fuzzed)"`,
establishing an explicit user-facing privacy promise that this code does not fulfill.

**Fix:** Apply a random, per-request offset using `SecureRandom` — do not seed with a stable
identifier. Alternatively, apply a fixed-but-private server-side random offset stored per task at
creation time and never exposed in the API.

---

### S-02 — Admin Phone Search Loads Entire User Table Into Heap

**Severity:** CRITICAL
**File:** `AuthService.java:1002-1023`

```java
public List<UserProfile> searchUsersByPhone(String phonePart) {
    return userDao.findAll()          // SELECT * FROM users — no LIMIT
            .stream()
            .filter(u -> {
                String phone = decryptPhone(u.phone()); // AES-GCM per row
                return phone != null && phone.contains(phonePart);
            })
            ...
}
```

`userDao.findAll()` issues an unbounded `SELECT * FROM users`. Every row is decrypted in-memory
with AES-GCM before the filter runs. At 100 k users this is a severe latency hit; at 1 M users
this causes OOM crashes. An admin (or an attacker who compromises an admin token) can trigger
repeated calls to `/api/v1/admin/users?phone=X` to DoS the service. The pagination cursor applied
afterward has no effect on the database query.

The root cause is that phone numbers are encrypted and cannot be searched in SQL — they can only
be looked up by blind index (exact match). Partial-phone search requires a different architecture.

**Fix options (in priority order):**

1. Remove partial-phone search entirely; require exact phone input and look up by blind index.
2. If partial search is a hard requirement, pre-compute and store a set of normalized, truncated
   blind indexes (e.g., last 6 digits) and accept the reduced privacy trade-off.

---

### S-03 — In-Memory Rate Limiter Bypassed in Multi-Instance Deployments

**Severity:** HIGH
**File:** `OtpRateLimitService.java`

```java
private final ConcurrentHashMap<String, Deque<Long>> attemptsByKey = new ConcurrentHashMap<>();
```

All rate-limit state lives in a single JVM's heap. In a horizontally scaled deployment (Kubernetes,
Docker Swarm, etc.) each pod has independent state. An attacker distributing requests across pods
bypasses all limits: 3 pods → 9 OTP requests per hour, effectively unbounded at scale. Rate limits
also reset silently on pod restart.

**Fix:** Move rate-limit state to Redis (using `INCR` + `EXPIRE` or a sliding-window Lua script)
or PostgreSQL. This is standard practice for stateless microservices.

---

### S-04 — QPay Webhook Replay Attack

**Severity:** HIGH
**File:** `PaymentService.java:173-187`

```java
private boolean isValidSignature(String paymentId, String status, String providedSignature) {
    String expected = computeSignature(paymentId + "|" + status);
    ...
}
```

The HMAC covers only `paymentId` and `status`. There is no timestamp, no nonce, and no
monotonicity check. A valid callback intercepted once can be replayed indefinitely — if
`paymentIntentDao.markProcessed` returns 0 on a subsequent call, `processCallback` returns `true`
(line 134: `return true; // already processed`), silently succeeding. While double-processing is
blocked, the lack of timestamp means the signature itself provides no protection against replay.

**Fix:** Include a `timestamp` field in the signed payload (signed by QPay). Reject callbacks where
`now - timestamp > 5 minutes`. If QPay does not provide timestamps, store a per-signature
idempotency record and reject any signature seen more than once.

---

### S-05 — Unauthenticated WebSocket CONNECT Is Permitted

**Severity:** HIGH
**File:** `ChannelInterceptorConfig.java:58-73`

```java
if (StompCommand.CONNECT.equals(command)) {
    String authHeader = accessor.getFirstNativeHeader("Authorization");
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        // authenticated path
        jwtTokenService.parse(token).ifPresent(principal -> { ... accessor.setUser(auth); });
    }
    // If no header: falls through silently. Connection succeeds. accessor.getUser() == null.
}
```

When no `Authorization` header is present, the `CONNECT` frame succeeds and the session's
principal is `null`. Unauthenticated clients can maintain open STOMP connections, consuming server
resources (file descriptors, broker threads, memory). SUBSCRIBE to `/topic/conversations/*` is
rejected for null principals (line 82), but the connection itself persists, enabling WebSocket-level
resource exhaustion.

**Fix:**

```java
if (StompCommand.CONNECT.equals(command)) {
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        throw new IllegalArgumentException("Unauthorized: missing token");
    }
    JwtPrincipal principal = jwtTokenService.parse(authHeader.substring(7))
        .orElseThrow(() -> new IllegalArgumentException("Unauthorized: invalid token"));
    assertUserNotRestricted(principal);
    accessor.setUser(new UsernamePasswordAuthenticationToken(
        principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + principal.role()))
    ));
}
```

---

### S-06 — Presigned Upload URLs Carry No Cryptographic Signature

**Severity:** HIGH
**File:** `AuthService.java:660-683`

```java
private String buildPresignedUploadUrl(...) {
    return normalizedBase +
            "/presigned-upload?key=" + URLEncoder.encode(storageKey, ...) +
            "&content_type=" + URLEncoder.encode(contentType, ...) +
            "&max_bytes=" + maxBytes +
            "&expires_in=" + ttlSeconds;
}
```

This is not a standard presigned URL — it has no HMAC, no expiry timestamp encoded in the
signature, and no proof that the server authorized this specific key. Anyone who knows (or guesses)
a storage key path (`uploads/avatars/{uuid}/{uuid}.jpg`) can call
`https://upload.tasky.local/presigned-upload?key=...` with arbitrary content. The security depends
entirely on the upload service correctly validating all parameters, which is not verifiable from
this codebase.

**Fix:** Use the AWS SDK's `S3Presigner` (already declared in `build.gradle.kts`) to generate
cryptographically signed S3/MinIO presigned URLs, or ensure the upload service validates an
HMAC-signed token embedded in the URL before accepting any upload.

---

### S-07 — Rate Limiter Keys Are Never Evicted — Heap Exhaustion

**Severity:** HIGH
**File:** `OtpRateLimitService.java:25`, `enforce()` method

```java
private final ConcurrentHashMap<String, Deque<Long>> attemptsByKey = new ConcurrentHashMap<>();
```

The map grows monotonically. The `enforce()` method removes old *timestamps* from each deque, but
the `Deque` objects and their **keys** are never removed from the map. An attacker sending unique
phone numbers or IP addresses each time adds a permanent entry. At ~100 bytes per entry, 1 M unique
IPs ≈ 100 MB of heap consumed. An automated scanner hitting the OTP endpoint with rotating IPs can
OOM the server within minutes.

**Fix:** Replace the `ConcurrentHashMap<String, Deque<Long>>` with a time-bounded structure —
Guava `CacheBuilder` with `expireAfterAccess`, Caffeine cache, or the Redis approach from S-03.

---

### S-08 — Avatar URL Accepts Any HTTP(S) Domain

**Severity:** MEDIUM
**File:** `UpdateProfileRequest.java:13`

```java
@Pattern(regexp = "^(https?://\\S+|uploads/\\S+)$")
String avatarUrl
```

The regex allows any `https://` URL — including `https://evil.com/phishing-page`,
`https://malware.example/payload.exe`, or `http://169.254.169.254/latest/meta-data/`
(AWS IMDSv1). While this is not server-side SSRF (the server stores the string, it does not fetch
it), the URL is served to other users' clients. A malicious user can trick other users' browsers
into loading attacker-controlled content as an avatar, enabling phishing frames or
credential-stealing pages.

**Fix:** Restrict the domain allowlist in the regex to your own CDN domain:

```java
@Pattern(regexp = "^https://cdn\\.tasky\\.mn/\\S+$|^uploads/\\S+$")
String avatarUrl
```

---

### S-09 — Phone Number Not Normalized — Duplicate Accounts

**Severity:** MEDIUM
**File:** `AuthService.java:208-210`

```java
private String normalizePhone(String phone) {
    return StringUtils.trimAllWhitespace(phone);
}
```

Only whitespace is stripped. The phone `+97699112233`, `+976-99-112233`, and `+976 99 112233`
produce different blind indexes, creating separate user accounts for the same real-world phone
number. An attacker can register multiple distinct identities from a single SIM, bypassing
per-account trust limits, strike counts, and bans.

**Fix:** Apply E.164 normalization before computing the blind index:

```java
private String normalizePhone(String phone) {
    return phone.replaceAll("[^+\\d]", "");
}
```

---

### S-10 — JWT `token_type` Claim Not Asserted on Absence

**Severity:** MEDIUM
**File:** `JwtTokenService.java:59-63`

```java
String tokenType = claims.get(TOKEN_TYPE_CLAIM, String.class);
if (StringUtils.hasText(tokenType) && !ACCESS_TOKEN_TYPE.equalsIgnoreCase(tokenType)) {
    return Optional.empty();
}
```

If `token_type` is absent or `null`, `StringUtils.hasText(tokenType)` is `false`, the `if` never
fires, and the token is accepted as a valid access token. A token without any `token_type` claim
bypasses the type boundary. If signing key material were ever leaked or test tokens were reused,
this fallback weakens the separation between access and refresh tokens.

**Fix:** Assert presence and equality explicitly:

```java
if (!ACCESS_TOKEN_TYPE.equalsIgnoreCase(tokenType)) {
    return Optional.empty();
}
```

---

### S-11 — Refresh Token Rate Limiting Keyed on `hashCode()`

**Severity:** LOW
**File:** `OtpRateLimitService.java:88`

```java
String tokenKey = Integer.toHexString(refreshToken.hashCode());
```

Java `String.hashCode()` is a 32-bit polynomial hash. Two distinct refresh tokens sharing the same
32-bit hash share a rate-limit bucket — one user's refresh attempts silently throttle another
user's. The key space of only 2³² entries also makes enumeration feasible.

**Fix:** Extract and use the JWT `jti` claim (token ID) as the rate-limit key, obtained after
signature verification.

---

### S-12 — Dev-Auth URL Whitelisted in JWT Filter Regardless of Feature Flag

**Severity:** LOW
**File:** `JwtAuthenticationFilter.java:33`

```java
private static final List<String> PUBLIC_PATHS = List.of(
    ...
    "/api/v1/auth/dev/login"  // hardcoded regardless of tasky.dev-auth.enabled
);
```

Even when `tasky.dev-auth.enabled=false` (production), this path bypasses the JWT filter. The
controller won't be registered (due to `@ConditionalOnProperty`), so the request gets a 404. But
any future code change, dependency upgrade, or misconfiguration that registers a bean on this path
would create an unauthenticated endpoint with no JWT check.

**Fix:** Make the public-path list conditional on the feature flag, or add a no-op controller that
always returns 404 and is not in the public list.

---

### S-13 — `TextSanitizer` Uses Regex HTML Stripping — Bypassable

**Severity:** LOW
**File:** `TextSanitizer.java:7`

```java
private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
```

This pattern is bypassed by broken/nested HTML: `<scr<script>ipt>alert(1)</scri<</script>pt>`.
Regex cannot reliably parse HTML. While the primary risk surface is messaging (which does sanitize
content), the sanitizer is the only XSS defense applied in the codebase.

**Fix:** Replace with a DOM-based sanitizer such as the
[OWASP Java HTML Sanitizer](https://github.com/OWASP/java-html-sanitizer) library.

---

### S-14 — Production Guard Checks Only `prod`/`production` Profile Names

**Severity:** LOW
**File:** `AuthService.java:169-172`

```java
for (String profile : environment.getActiveProfiles()) {
    if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
        productionProfile = true;
        break;
    }
}
```

If the production deployment uses a profile name like `live`, `release`, or `server`, the guard
does not fire — `devAuthEnabled=true` and `otpTestCode=123456` would both be silently accepted.

**Fix:** Invert the logic — whitelist dev/test profile names rather than checking for prod names:

```java
Set<String> devProfiles = Set.of("dev", "test", "local");
boolean isNonProd = Arrays.stream(environment.getActiveProfiles())
    .anyMatch(devProfiles::contains);
if (!isNonProd && devAuthEnabled) { throw new IllegalStateException(...); }
```

---

## Findings by OWASP Top 10 Mapping

| OWASP 2021 Category                           | Finding IDs          |
|-----------------------------------------------|----------------------|
| A01 — Broken Access Control                   | S-05                 |
| A02 — Cryptographic Failures                  | S-01, S-10           |
| A03 — Injection                               | S-13                 |
| A04 — Insecure Design                         | S-02, S-06, S-09     |
| A05 — Security Misconfiguration               | S-12, S-14           |
| A07 — Identification and Authentication Failures | S-03, S-04, S-07  |
| A08 — Software and Data Integrity Failures    | S-04, S-06           |
| A10 — Server-Side Request Forgery (partial)   | S-08                 |

---

## Positive Observations

The following implementations are done correctly and deserve recognition:

- **AES-256-GCM with random IVs** — correct algorithm, IV size, and tag length (`CryptoService.java`)
- **HMAC-SHA256 blind indexing for phone search** — correct approach for searchable encryption on encrypted PII
- **Constant-time OTP and webhook signature comparison** — `MessageDigest.isEqual()` used correctly in both `AuthService.verifyOtp` and `PaymentService.isValidSignature`, preventing timing-oracle attacks
- **Refresh token rotation with single-use enforcement** — `findAndDelete` in `RefreshSessionDao` atomically invalidates the consumed token
- **Production startup guard on dev auth and OTP test code** — `@PostConstruct` validation is the correct hook; fail-fast is the correct behavior
- **Stateless session with real-time ban enforcement** — `JwtAuthenticationFilter` hits the database on every authenticated request to enforce immediate bans, closing the stale-token window
- **Idempotency keys on all state-changing operations** — correctly implemented across booking acceptance, cancellation, completion, and payment flows
- **Input validation DTOs** — Jakarta Validation annotations applied consistently; no raw string processing at controller boundaries

---

## Remediation Priority

| Priority              | IDs                    | Rationale                                               |
|-----------------------|------------------------|---------------------------------------------------------|
| Block launch          | S-01, S-02, S-05, S-07 | Architectural flaws; broken privacy promise; DoS vector |
| Before payment go-live | S-04, S-06            | Financial security must be hardened before real money   |
| Sprint 1 post-launch  | S-03, S-08, S-09, S-10 | Distributed rate limiting; data integrity               |
| Ongoing hardening     | S-11, S-12, S-13, S-14 | Defense-in-depth; no immediate exploit path             |
