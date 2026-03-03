# Feature: user

User profile management, role activation, and avatar upload for the authenticated caller.

## Purpose

Provides the authenticated user's own profile view and mutation surface.
Handles Tasker role self-activation and avatar presigned URL generation.

## API Endpoints

| Method | Path                                 | Auth | Role     | Notes                                           |
|--------|--------------------------------------|------|----------|-------------------------------------------------|
| `GET`  | `/api/v1/users/me`                   | JWT  | Any      | Return caller's full profile                    |
| `PUT`  | `/api/v1/users/me`                   | JWT  | Any      | Update display name and/or avatar URL           |
| `POST` | `/api/v1/users/me/role/tasker`       | JWT  | CUSTOMER | Activate Tasker role; issues a fresh token pair |
| `POST` | `/api/v1/users/me/avatar/upload-url` | JWT  | Any      | Get presigned S3 URL to upload avatar image     |

## Request / Response Shapes

### `GET /api/v1/users/me` — Response 200

```json
{
  "id": "uuid",
  "phone": "+976...",
  "role": "CUSTOMER|TASKER|ADMIN",
  "status": "PENDING|VERIFIED|ACTIVE|BANNED|SUSPENDED",
  "full_name": "string",
  "avatar_url": "string|null",
  "rating_avg": 0.0,
  "completed_tasks": 0,
  "is_pro": false,
  "created_at": "ISO-8601"
}
```

### `PUT /api/v1/users/me`

```json
// Request — all fields optional
{
  "full_name": "string (1–100 chars)",
  "avatar_url": "https://cdn.tasky.mn/... or uploads/..."
}

// Response 200 — ProfileResponse (same as GET /me)
```

### `POST /api/v1/users/me/role/tasker` — Response 200

```json
{ "access_token": "<jwt>", "refresh_token": "<token>", "user": { AuthUser } }
// Response 409 — ROLE_ALREADY_ASSIGNED (already TASKER or ADMIN)
```

### `POST /api/v1/users/me/avatar/upload-url`

```json
// Request
{ "content_type": "image/jpeg|image/png|image/webp" }

// Response 200
{ "upload_url": "https://s3.presigned.url/...", "storage_key": "uploads/..." }
```

## Error Codes

| Code                    | HTTP | Trigger                                                                          |
|-------------------------|------|----------------------------------------------------------------------------------|
| `USER_NOT_FOUND`        | 401  | Authenticated principal has no matching user record                              |
| `ROLE_ALREADY_ASSIGNED` | 409  | User already has TASKER or ADMIN role                                            |
| `VALIDATION_ERROR`      | 400  | Request body field validation failed (including unsupported avatar content-type) |

## Cross-Module Dependencies

- Delegates entirely to `AuthService` (auth module application layer).
- Avatar URL validation enforces `cdn.tasky.mn`, `cdn.tasky.local`, or `uploads/` prefix.

## Invariants & Guards

- Role activation only allowed from `CUSTOMER` → `TASKER`.
  The new role is reflected immediately via a reissued JWT.
- Verification status remains `PENDING` after role activation; admin approval is still required before the Tasker can
  apply to tasks.
- Presigned upload URLs enforce `Content-Type` in the S3 signature (server-side).
