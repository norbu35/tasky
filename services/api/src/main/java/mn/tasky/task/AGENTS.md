# Feature: task

Task feed, task management, application flow, acceptance, and task photo upload URLs.

## Implemented API

| Method | Path                                                     | Notes                                                           |
| ------ | -------------------------------------------------------- | --------------------------------------------------------------- |
| `GET`  | `/api/v1/tasks`                                          | Open feed with optional category/geo filters, cursor pagination |
| `GET`  | `/api/v1/tasks/mine`                                     | Caller tasks by role/status/cursor                              |
| `GET`  | `/api/v1/tasks/{id}`                                     | Owner/booked-tasker sees full details; others see public/fuzzed |
| `POST` | `/api/v1/tasks`                                          | Create task (customer role required)                            |
| `PUT`  | `/api/v1/tasks/{id}`                                     | Update open task                                                |
| `POST` | `/api/v1/tasks/{id}/cancel`                              | Cancel open task                                                |
| `POST` | `/api/v1/tasks/{id}/applications`                        | Verified tasker applies                                         |
| `GET`  | `/api/v1/tasks/{id}/applications`                        | Task owner lists applications                                   |
| `POST` | `/api/v1/tasks/{id}/applications/{applicationId}/accept` | Accept application and create booking; idempotent               |
| `POST` | `/api/v1/tasks/{id}/photos/upload-url`                   | Owner upload URL (post-create, max 3 photos)                    |
| `POST` | `/api/v1/tasks/photos/upload-url`                        | Upload URL before task create                                   |

## Task Statuses in Code

- `OPEN`
- `ASSIGNED`
- `COMPLETED`
- `CANCELLED`
- `NO_SHOW`

## Core Rules

- Create/update sanitize text fields and validate schedule in future.
- Max 3 photo keys per task.
- Apply requires caller role `TASKER`, non-self-application, task `OPEN`, and profile status `VERIFIED`.
- Accept requires owner, task `OPEN`, selected app `PENDING`, and liability disclaimer acceptance.

## Side Effects

- Create: analytics `TASK_POSTED` and nearby-tasker push notifications.
- Apply: conversation bootstrap, push (`TASKER_APPLIED`), analytics `APPLICATION_SUBMITTED`.
- Accept: marks selected application accepted, rejects others, creates booking, sets task to `ASSIGNED`, publishes
  outbox `TASK_APPLICATION_ACCEPTED`.

## Location Privacy

- Public/feed views return fuzzed coordinates (`~<=500m`, rounded to 2 decimals).
- Full coordinates are returned only to task owner or booked tasker.

## Idempotency

| Endpoint                                                      | Operation key             |
| ------------------------------------------------------------- | ------------------------- |
| `POST /api/v1/tasks/{id}/applications/{applicationId}/accept` | `task.accept_application` |

## Explicitly Not Implemented

- No structured intake form fields or schema-versioned intake payloads in task DTOs/entities.
