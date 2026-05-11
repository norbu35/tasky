# Feature: auth

Authentication, session issuance/refresh, and shared user-account application logic.

## Module Layout

```
api/          — controllers (request routing only)
application/  — AuthService, OtpRateLimitService, ModerationService, ...
dao/          — UserDao, OtpChallengeDao, RefreshSessionDao, ...
dto/          — request/response shapes (AuthTokens, OtpChallenge, ...)
provider/     — OAuthProvider interface, FacebookOAuthProvider
scheduling/   — session cleanup, rate-limit counter purge, badge revocation, data retention, Facebook circuit-breaker probe
publicapi/    — module ports consumed by runtime composition
```

## Public API Endpoints

Endpoints are spread across five controllers in the `api/` package:
`AuthController`, `FacebookAuthController`, `OtpController`, `TokenController`, `DevAuthController`.

| Method | Path                           | Controller               | Availability                            |
| ------ | ------------------------------ | ------------------------ | --------------------------------------- |
| `POST` | `/api/v1/auth/logout`          | `AuthController`         | Always enabled                          |
| `POST` | `/api/v1/auth/facebook`        | `FacebookAuthController` | Always enabled                          |
| `GET`  | `/api/v1/auth/facebook/status` | `FacebookAuthController` | Always enabled                          |
| `POST` | `/api/v1/auth/otp/request`     | `OtpController`          | Only when `tasky.otp.enabled=true`      |
| `POST` | `/api/v1/auth/otp/verify`      | `OtpController`          | Only when `tasky.otp.enabled=true`      |
| `POST` | `/api/v1/auth/token/refresh`   | `TokenController`        | Always enabled                          |
| `POST` | `/api/v1/auth/dev/login`       | `DevAuthController`      | Only when `tasky.dev-auth.enabled=true` |

```claim endpoint
operationId: logout
method: POST
path: /api/v1/auth/logout
```

```claim endpoint
operationId: loginWithFacebook
method: POST
path: /api/v1/auth/facebook
```

```claim endpoint
operationId: getFacebookStatus
method: GET
path: /api/v1/auth/facebook/status
```

```claim endpoint
operationId: refreshToken
method: POST
path: /api/v1/auth/token/refresh
```

```claim endpoint
operationId: requestOtp
method: POST
path: /api/v1/auth/otp/request
```

```claim endpoint
operationId: verifyOtp
method: POST
path: /api/v1/auth/otp/verify
```

```claim endpoint
operationId: devLogin
method: POST
path: /api/v1/auth/dev/login
```

## Session and Identity Behavior

- Access/refresh tokens are issued by `JwtTokenService`.
- Refresh token rotation is server-validated through `refresh_sessions`.
- User phone is encrypted at rest; decrypted only for responses.
- Login/refresh blocks suspended or banned accounts.
- Suspended accounts can auto-unsuspend based on moderation policy and suspension end time.

### Token TTLs and Security Invariants

- Access token TTL: 15 minutes. Refresh token TTL: 14 days.
- Token blacklist cache TTL: 15 minutes (matches access token TTL).
- Refresh token rotation is server-validated; old refresh tokens are invalidated on use.
- `TokenBlacklistService` uses a Caffeine cache backed by `token_blacklist` table (see `V4__token_blacklist.sql`).

## Public API Ports

Four of the five controllers depend on `IdentityCommandPort` (from `mn.tasky.identity.publicapi`), not on `AuthService` or DAOs directly. The exception is `AuthController` (logout), which injects `AuthService` directly. Some controllers also use composition services in `runtime.publicapi.composition` (e.g. `OtpPublicCompositionService`) for response shaping. The `auth/publicapi/` package currently contains only a package marker; the actual ports consumed across modules live in `identity/publicapi/`.

## Key Class Responsibilities

| Class                     | Owns                                                                   |
| ------------------------- | ---------------------------------------------------------------------- |
| `AuthService`             | OTP flow, Facebook login, dev login, session issuance, refresh, logout |
| `OtpRateLimitService`     | OTP + refresh distributed rate limits                                  |
| `UserStatusResolver`      | banned/suspended/auto-unsuspend logic                                  |
| `ModerationService`       | strikes, suspensions, policy enforcement                               |
| `VerificationService`     | ID verification upload, submission, status                             |
| `BadgeEvaluationService`  | tasker badge qualification and revocation                              |
| `ReliabilityScoreService` | user reliability scoring                                               |
| `ConsentService`          | user consent recording and lookup                                      |
| `DataRetentionService`    | data retention policy enforcement                                      |
| `FacebookGraphClient`     | Facebook API calls (external boundary)                                 |
| `FacebookCircuitBreaker`  | circuit breaker for Facebook API                                       |

```claim symbol-exists
class: mn.tasky.common.security.JwtTokenService
```

## Rate Limiting

- OTP and token-refresh: distributed Postgres counters (`OtpRateLimitService`, `RateLimitCounterDao`).
- Facebook OAuth: in-memory per-IP limiter (`FacebookRateLimitService`).
- Exceeding limits throws `RateLimitExceededException` and returns `429` via global handler.

## Shared AuthService Responsibilities Used by Other Modules

- Profile read/update and tasker-role activation
- Verification upload-url generation, submission, status, and admin resolution helpers
- User search by phone, ban/unban
- Moderation policy read/update
- Strike recording and suspension logic
- Profile rating/completion aggregate updates

## Key Config Toggles

- `tasky.otp.enabled`
- `tasky.dev-auth.enabled`
- `tasky.auth.otp-migration-enforced`
- `tasky.auth.rate-limit.*`
- `tasky.auth.otp-ttl-seconds`
- `tasky.facebook.*`

```claim config-key
key: tasky.otp.enabled
```

```claim config-key
key: tasky.dev-auth.enabled
```

```claim config-key
key: tasky.auth.otp-migration-enforced
```

```claim config-key
key: tasky.auth.otp-ttl-seconds
```

## Testing

Auth scenarios: `tests/scenarios/auth.md`. Check `tests/registry.yaml` before writing tests. See `services/api/AGENTS.md` for the full testing rules.
