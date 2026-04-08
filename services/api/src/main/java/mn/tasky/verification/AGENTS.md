# Feature: verification

Tasker identity verification upload + submission flow.

## Implemented API

| Method | Path                              | Notes                             |
|--------|-----------------------------------|-----------------------------------|
| `POST` | `/api/v1/verification/upload-url` | Signed upload URL for ID images   |
| `POST` | `/api/v1/verification/submit`     | Submit front/back keys for review |
| `GET`  | `/api/v1/verification/status`     | Current verification status       |

## Rules

- Upload content type allowed: `image/jpeg` or `image/png`.
- Submit allowed only for users with role `TASKER`.
- Submission is blocked when latest verification is `PENDING` or `APPROVED`.
- Initial status after submit is `PENDING`.

## Status Model

`GET /status` returns one of:

- `NOT_SUBMITTED`
- `PENDING`
- `APPROVED`
- `REJECTED`

plus optional `admin_notes`, `submitted_at`, `reviewed_at`.

## Admin Coupling

Approval/rejection is handled by admin endpoints in `admin` module (`/api/v1/admin/verifications/*`).
