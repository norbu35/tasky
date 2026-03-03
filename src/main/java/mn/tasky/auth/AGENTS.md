# Feature: auth

Authentication and session management for the Tasky platform.

## Purpose

Issues and refreshes JWT sessions via Facebook OAuth (primary) or OTP/phone (feature-flagged).
Manages the lifecycle of access and refresh tokens.

## API Endpoints

| Method | Path                         | Auth   | Notes                                                            |
|--------|------------------------------|--------|------------------------------------------------------------------|
| `POST` | `/api/v1/auth/facebook`      | Public | Facebook OAuth login — rate-limited per IP                       |
| `POST` | `/api/v1/auth/otp/request`   | Public | Request SMS OTP — requires `tasky.otp.enabled=true` feature flag |
| `POST` | `/api/v1/auth/otp/verify`    | Public | Verify OTP and issue session — requires `tasky.otp.enabled=true` |
| `POST` | `/api/v1/auth/token/refresh` | Public | Refresh access token using a valid refresh token                 |
| `POST` | `/api/v1/auth/dev/login`     | Public | Dev-only bypass login — requires `tasky.dev-auth.enabled=true`   |

## Request / Response Shapes

### `POST /api/v1/auth/facebook`

```json
// Request
{ "access_token": "<fb-access-token>" }

// Response 200
{ "access_token": "<jwt>", "refresh_token": "<token>", "user": { AuthUser } }
```

### `POST /api/v1/auth/otp/request`

```json
// Request
{ "phone": "+97699123456" }   // E.164 format

// Response 200
{ "message": "OTP sent to +976****3456" }
```

### `POST /api/v1/auth/otp/verify`

```json
// Request
{ "phone": "+97699123456", "code": "123456" }

// Response 200
{ "access_token": "<jwt>", "refresh_token": "<token>", "user": { AuthUser } }
// Response 401 — OTP_INVALID
```

### `POST /api/v1/auth/token/refresh`

```json
// Request
{ "refresh_token": "<token>" }

// Response 200
{ "access_token": "<jwt>", "refresh_token": "<token>" }
// Response 401 — REFRESH_TOKEN_INVALID
```

### AuthUser shape

```json
{ "id": "uuid", "phone": "+976...", "facebook_id": "...", "role": "CUSTOMER|TASKER|ADMIN", "status": "PENDING|VERIFIED|ACTIVE|BANNED|SUSPENDED", "created_at": "ISO-8601" }
```

## Error Codes

| Code                         | HTTP | Trigger                                              |
|------------------------------|------|------------------------------------------------------|
| `OTP_INVALID`                | 401  | OTP code is wrong or expired                         |
| `REFRESH_TOKEN_INVALID`      | 401  | Refresh token is invalid or expired                  |
| `OTP_REQUEST_RATE_LIMITED`   | 429  | OTP request rate limit exceeded                      |
| `OTP_VERIFY_RATE_LIMITED`    | 429  | OTP verify rate limit exceeded                       |
| `TOKEN_REFRESH_RATE_LIMITED` | 429  | Refresh rate limit exceeded                          |
| `OAUTH_RATE_LIMITED`         | 429  | Facebook OAuth rate limit exceeded                   |
| `FACEBOOK_TOKEN_INVALID`     | 401  | Facebook token invalid/configuration/lookup failure  |
| `FACEBOOK_TOKEN_MISMATCH`    | 401  | Token is valid but does not belong to configured app |
| `ACCOUNT_RESTRICTED`         | 403  | User is BANNED or SUSPENDED                          |

## Token Lifecycle

All tokens are signed **HS256** using `tasky.security.jwt-secret` (minimum 32 bytes).

| Token         | Default TTL           | Config override                            |
|---------------|-----------------------|--------------------------------------------|
| Access token  | 900 s (15 min)        | `tasky.security.access-token-ttl-seconds`  |
| Refresh token | 1 209 600 s (14 days) | `tasky.security.refresh-token-ttl-seconds` |
| OTP code      | 300 s (5 min)         | `tasky.auth.otp-ttl-seconds`               |

Access tokens embed `userId`, `role`, and `status` claims.
Refresh tokens carry a `tokenId` (UUID) stored in `refresh_sessions` for server-side revocation.

> **Phone storage**: `users.phone` is stored encrypted (AES-256-GCM). The plain value in the
> `AuthUser` response is decrypted at read time. See `common/AGENTS.md` § Field-Level Encryption.

## Rate Limiting

OTP and token-refresh limits are enforced by a **Postgres-backed distributed counter**
(`rate_limit_counters` table), making them effective across multiple app instances.

| Flow           | Dimension            | Limit | Window                                                         |
|----------------|----------------------|-------|----------------------------------------------------------------|
| OTP request    | per phone number     | 3     | 1 hour                                                         |
| OTP request    | per client IP        | 10    | 1 hour                                                         |
| OTP verify     | per phone number     | 5     | 15 min                                                         |
| OTP verify     | per client IP        | 20    | 15 min                                                         |
| Token refresh  | per refresh token ID | 10    | 1 min                                                          |
| Token refresh  | per client IP        | 30    | 1 min                                                          |
| Facebook OAuth | per client IP        | 10    | 1 hour (in-memory, single-instance `FacebookRateLimitService`) |

All limits are configurable via `tasky.auth.rate-limit.*` properties.

Rate limit error codes (HTTP 429):

| Code                         | Flow                    |
|------------------------------|-------------------------|
| `OTP_REQUEST_RATE_LIMITED`   | OTP request exceeded    |
| `OTP_VERIFY_RATE_LIMITED`    | OTP verify exceeded     |
| `TOKEN_REFRESH_RATE_LIMITED` | Token refresh exceeded  |
| `OAUTH_RATE_LIMITED`         | Facebook OAuth exceeded |

> **Architectural note:** ARCHITECTURE.md §5.3 specifies a general API token-bucket limit
> (100 req/min) for all endpoints. This is **not yet implemented** in the codebase and
> represents an open infrastructure task.

## Cross-Module Dependencies

- Depends on `AuthService` (application layer) for all business logic.
- `AuthService` is the shared internal service used by `user`, `verification`, and `admin` modules.

## Invariants & Guards

- Duplicate Facebook accounts (`facebook_id`) are rejected.
- Banned / Suspended users are rejected on every request by the Security Filter (not just at login).
- OTP flow is gated behind `tasky.otp.enabled` feature flag (deferred for MVP).
- Dev login is gated behind `tasky.dev-auth.enabled` feature flag (never enabled in production).
