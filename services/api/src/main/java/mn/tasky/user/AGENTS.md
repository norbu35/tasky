# Feature: user

Authenticated self-profile API, tasker role activation, and avatar upload URL issuance.

## Implemented API

| Method | Path                                 | Notes                                                  |
|--------|--------------------------------------|--------------------------------------------------------|
| `GET`  | `/api/v1/users/me`                   | Current user profile                                   |
| `PUT`  | `/api/v1/users/me`                   | Update `full_name` and/or `avatar_url`                 |
| `POST` | `/api/v1/users/me/role/tasker`       | Promote `CUSTOMER -> TASKER`; returns fresh token pair |
| `POST` | `/api/v1/users/me/avatar/upload-url` | Signed avatar upload URL                               |

## Behavior

- All operations delegate to `AuthService`.
- Role activation fails with conflict when already `TASKER` or `ADMIN`.
- Avatar URL request supports `image/jpeg|image/png|image/webp`.
- Profile update validates avatar URL against allowed pattern (`cdn.tasky.mn`, `cdn.tasky.local`, or `uploads/...`).

## Typical Error Codes

- `USER_NOT_FOUND` (401)
- `ROLE_ALREADY_ASSIGNED` (409)
- `VALIDATION_ERROR` (400) from DTO constraints
