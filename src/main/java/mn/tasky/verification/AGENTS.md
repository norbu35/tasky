# Feature: verification

Tasker identity (KYC) verification flow — presigned URL upload and submission.

## Purpose

Allows Taskers to upload government ID images and submit them for admin review.
A Tasker must be approved before they can apply to tasks.

## API Endpoints

| Method | Path                              | Auth | Role              | Notes                                                                                                     |
|--------|-----------------------------------|------|-------------------|-----------------------------------------------------------------------------------------------------------|
| `POST` | `/api/v1/verification/upload-url` | JWT  | Any authenticated | Get presigned URL for an ID image upload                                                                  |
| `POST` | `/api/v1/verification/submit`     | JWT  | Any authenticated | Submit verification using previously uploaded storage keys (returns `NOT_TASKER` when role is not TASKER) |
| `GET`  | `/api/v1/verification/status`     | JWT  | Any authenticated | Get current verification status for the caller                                                            |

## Request / Response Shapes

### `POST /api/v1/verification/upload-url`

```json
// Request
{ "content_type": "image/jpeg|image/png" }

// Response 200
{ "upload_url": "https://s3.presigned.url/...", "storage_key": "uploads/verification/..." }
// Response 400 — INVALID_CONTENT_TYPE
```

### `POST /api/v1/verification/submit`

```json
// Request
{ "id_card_front_key": "uploads/...", "id_card_back_key": "uploads/..." }

// Response 200 — VerificationStatusApiResponse
{
  "status": "PENDING",
  "admin_notes": null,
  "submitted_at": "ISO-8601",
  "reviewed_at": null
}
// Response 409 — VERIFICATION_ALREADY_SUBMITTED
// Response 400 — NOT_TASKER
```

### `GET /api/v1/verification/status` — Response 200

```json
{
  "status": "NOT_SUBMITTED|PENDING|APPROVED|REJECTED",
  "admin_notes": "string|null",
  "submitted_at": "ISO-8601|null",
  "reviewed_at": "ISO-8601|null"
}
```

## Error Codes

| Code                             | HTTP | Trigger                                                                                                              |
|----------------------------------|------|----------------------------------------------------------------------------------------------------------------------|
| `VALIDATION_ERROR`               | 400  | DTO validation failed (including unsupported `content_type`)                                                         |
| `INVALID_CONTENT_TYPE`           | 400  | Upload URL request rejected by controller fallback when `AuthService.createVerificationUploadUrl(...)` returns empty |
| `NOT_TASKER`                     | 400  | Caller has not activated the TASKER role yet                                                                         |
| `VERIFICATION_ALREADY_SUBMITTED` | 409  | Verification is already PENDING or APPROVED                                                                          |
| `USER_NOT_FOUND`                 | 401  | Authenticated principal has no matching user record                                                                  |

## Upload Pattern

1. Call `POST /api/v1/verification/upload-url` to obtain a presigned URL and a `storage_key`.
2. Upload the file directly to S3/MinIO using the presigned URL.
3. Repeat for the back side of the ID card.
4. Call `POST /api/v1/verification/submit` with both `storage_key` values.
5. Admin reviews via `AdminVerificationController` and approves or rejects.

## Security Constraints

- ID images are stored in a **private** S3 bucket. No public URLs are ever returned.
- Admin viewing uses short-lived presigned GET URLs generated at read time (see `admin` module).
- `Content-Type` is enforced in the S3 presigned URL signature.

## Cross-Module Dependencies

- Delegates to `AuthService` (auth module application layer) for all business logic.
- Admin approval/rejection is handled by the `admin` module (`AdminVerificationController`).

## Invariants & Guards

- Only users with role `TASKER` may submit verification.
- Re-submission is blocked while a verification is already PENDING or APPROVED.
- Approval transitions the user's status to `VERIFIED`, enabling task applications.
