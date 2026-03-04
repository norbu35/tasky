# Feature: auth

Authentication, session issuance/refresh, and shared user-account application logic.

## Public API Endpoints

| Method | Path                         | Availability                            |
|--------|------------------------------|-----------------------------------------|
| `POST` | `/api/v1/auth/facebook`      | Always enabled                          |
| `POST` | `/api/v1/auth/otp/request`   | Only when `tasky.otp.enabled=true`      |
| `POST` | `/api/v1/auth/otp/verify`    | Only when `tasky.otp.enabled=true`      |
| `POST` | `/api/v1/auth/token/refresh` | Always enabled                          |
| `POST` | `/api/v1/auth/dev/login`     | Only when `tasky.dev-auth.enabled=true` |

## Session and Identity Behavior

- Access/refresh tokens are issued by `JwtTokenService`.
- Refresh token rotation is server-validated through `refresh_sessions`.
- User phone is encrypted at rest; decrypted only for responses.
- Login/refresh blocks suspended or banned accounts.
- Suspended accounts can auto-unsuspend based on moderation policy and suspension end time.

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
- `tasky.auth.rate-limit.*`
- `tasky.auth.otp-ttl-seconds`
- `tasky.storage.upload-signing-secret` (required for signed upload URLs)
