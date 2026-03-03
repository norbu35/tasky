# Feature: task

Task posting, browsing, and application management — the core marketplace supply/demand surface.

## Purpose

Customers create and manage tasks; Taskers browse the open feed and apply.
Implements the dual-status Task + Booking state model and enforces location privacy rules.

## API Endpoints

| Method | Path                                             | Auth | Role              | Notes                                                       |
|--------|--------------------------------------------------|------|-------------------|-------------------------------------------------------------|
| `GET`  | `/api/v1/tasks`                                  | JWT  | Any               | Open task feed; location fuzzed ±500m                       |
| `GET`  | `/api/v1/tasks/mine`                             | JWT  | Any               | Caller's tasks filtered by role/status                      |
| `GET`  | `/api/v1/tasks/{id}`                             | JWT  | Any               | Full view for owner or booked tasker; public view otherwise |
| `POST` | `/api/v1/tasks`                                  | JWT  | CUSTOMER          | Create a new task                                           |
| `PUT`  | `/api/v1/tasks/{id}`                             | JWT  | CUSTOMER          | Update task (OPEN only)                                     |
| `POST` | `/api/v1/tasks/{id}/cancel`                      | JWT  | CUSTOMER          | Cancel task                                                 |
| `POST` | `/api/v1/tasks/{id}/applications`                | JWT  | TASKER (VERIFIED) | Apply to task                                               |
| `GET`  | `/api/v1/tasks/{id}/applications`                | JWT  | CUSTOMER (owner)  | List applicants                                             |
| `POST` | `/api/v1/tasks/{id}/applications/{appId}/accept` | JWT  | CUSTOMER (owner)  | Accept applicant; creates Booking — idempotent              |
| `POST` | `/api/v1/tasks/photos/upload-url`                | JWT  | Any               | Presigned URL for photo upload (pre-create)                 |
| `POST` | `/api/v1/tasks/{id}/photos/upload-url`           | JWT  | CUSTOMER (owner)  | Presigned URL for photo upload (post-create, max 3 total)   |

## Query Parameters

### `GET /api/v1/tasks`

| Param        | Default | Constraints                    |
|--------------|---------|--------------------------------|
| `category`   | —       | Category ID filter             |
| `lat`, `lng` | —       | Center point for radius search |
| `radius_km`  | `10`    | Max `50`                       |
| `cursor`     | —       | Opaque pagination cursor       |
| `limit`      | `20`    | 1–100                          |

### `GET /api/v1/tasks/mine`

| Param    | Default    | Constraints                                  |
|----------|------------|----------------------------------------------|
| `role`   | `customer` | `customer` or `tasker`                       |
| `status` | —          | `OPEN`, `ASSIGNED`, `COMPLETED`, `CANCELLED` |
| `cursor` | —          | Opaque pagination cursor                     |
| `limit`  | `20`       | 1–100                                        |

## Request / Response Shapes

### `POST /api/v1/tasks` — Create Task

```json
// Request
{
  "category_id": "uuid",
  "description": "string (10–2000 chars)",
  "budget": 50000,             // integer MNT, minimum 5000
  "location_lat": 47.9184,
  "location_lng": 106.9177,
  "location_text": "string (5–500 chars)",
  "scheduled_at": "ISO-8601",
  "photo_keys": ["uploads/..."]  // max 3
}
// Response 201 — full TaskResponse
```

### `PUT /api/v1/tasks/{id}` — Update Task

```json
// Request — all fields optional
{
  "description": "string",
  "budget": 50000,
  "location_lat": 47.9184,
  "location_lng": 106.9177,
  "location_text": "string",
  "scheduled_at": "ISO-8601",
  "photo_keys": ["uploads/..."]  // max 3
}
// Response 200 — full TaskResponse
```

### `POST /api/v1/tasks/{id}/applications` — Apply

```json
// Request
{ "message": "string (required, 1–500 chars)" }
// Response 201 — ApplicationResponse
```

### `POST /api/v1/tasks/{id}/applications/{appId}/accept`

```json
// Request
{ "liability_disclaimer_accepted": true }
// Header: Idempotency-Key: <uuid>  (required by IdempotencyService)
// Response 200 — BookingResponse (basic)
```

### Public-style TaskResponse (feed / non-owner view)

```json
{
  "id": "uuid",
  "category": { "id": "...", "name": "...", "name_mn": "...", "icon_url": "..." },
  "customer": { "id": "...", "full_name": "...", "avatar_url": "...", "rating_avg": 4.8 },
  "description": "string",
  "budget": 50000,
  "approximate_location": "Ulaanbaatar, Mongolia (Fuzzed)",
  "approximate_lat": 47.92,
  "approximate_lng": 106.92,
  "status": "OPEN",
  "scheduled_at": "ISO-8601",
  "photo_urls": ["https://..."],
  "application_count": 3,
  "created_at": "ISO-8601"
}
```

### Full TaskResponse (owner / booked tasker)

Adds exact fields: `location_lat`, `location_lng`, `location_text`, `customer_id`, `category_id`, `photo_keys`,
`photos[]`, `updated_at`.

### ApplicationResponse

```json
{
  "id": "uuid",
  "task_id": "uuid",
  "tasker": { "id": "...", "full_name": "...", "avatar_url": "...", "rating_avg": 4.8, "completed_tasks": 12, "is_pro": false },
  "message": "string",
  "status": "PENDING|ACCEPTED|REJECTED",
  "created_at": "ISO-8601"
}
```

### Photo Upload URL

```json
// Request: { "content_type": "image/jpeg|image/png" }
// Response 200: { "upload_url": "https://...", "storage_key": "uploads/..." }
```

## Error Codes

| Code                   | HTTP | Trigger                                                |
|------------------------|------|--------------------------------------------------------|
| `FORBIDDEN`            | 403  | Caller is not the task owner, or not a VERIFIED TASKER |
| `NOT_FOUND`            | 404  | Task or application does not exist                     |
| `TASK_NOT_OPEN`        | 409  | Task is not `OPEN` (apply or accept)                   |
| `ALREADY_APPLIED`      | 409  | Tasker already has a pending application               |
| `DISCLAIMER_REQUIRED`  | 400  | `liability_disclaimer_accepted` is not `true`          |
| `CONFLICT`             | 409  | Application already processed or task already assigned |
| `INVALID_STATUS`       | 409  | Task cannot be updated/cancelled in current status     |
| `TOO_MANY_PHOTOS`      | 400  | Photo count would exceed maximum of 3                  |
| `INVALID_CURSOR`       | 400  | Cursor parameter is malformed                          |
| `INVALID_ROLE`         | 400  | `role` query param is not `customer` or `tasker`       |
| `INVALID_CONTENT_TYPE` | 400  | Photo content-type not supported                       |

## Idempotency

`POST …/accept` requires `Idempotency-Key` header (operation: `task.accept_application`).
Replay returns the previously created Booking.

## Location Privacy

- **Feed / public view**: coordinates are fuzzed by a random offset of up to 500m.
  The exact address is never revealed until after booking confirmation.
- **Full view**: exact `location_lat`, `location_lng`, `location_text` are returned only to
  the task owner or the booked Tasker (status `ASSIGNED`, `PAID`, or `COMPLETED`).

## Task Status Lifecycle

```
OPEN → ASSIGNED (when Customer accepts an application)
OPEN → CANCELLED
ASSIGNED → COMPLETED (when Customer confirms completion)
ASSIGNED → OPEN (if Tasker cancels booking)
ASSIGNED → CANCELLED (if Customer cancels booking)
```

## Domain Events / Side Effects

- Applying to a task:
    - Creates (or reuses) a Conversation between Tasker and Customer.
    - Triggers push notification to Customer: "New Applicant" (`TASKER_APPLIED`).
    - Tracks analytics event `APPLICATION_SUBMITTED`.
- Accepting an application:
    - Creates a `Booking` record (status `ASSIGNED`).
    - Updates task status to `ASSIGNED`.
    - Publishes `TASK_APPLICATION_ACCEPTED` to outbox.
    - Conversation bootstrap, "You are hired!" push, and confirm analytics are processed asynchronously by
      `DomainEventOutboxProcessor`.
- Cancelling a task: transitions task to `CANCELLED`.

## Performance Contract (NFR-PERF-01)

Target: `GET /api/v1/tasks` must complete in < 1 second on a 4G network connection.

The query layer relies on the following indexes (no application-level cache):

| Index                                     | Table   | Columns                                      | Query it serves              |
|-------------------------------------------|---------|----------------------------------------------|------------------------------|
| `idx_tasks_location_point` (GiST)         | `tasks` | `location_point`                             | `ST_DWithin` radius search   |
| `idx_tasks_status_created_at_id`          | `tasks` | `(status, created_at DESC, id)`              | Feed cursor pagination       |
| `idx_tasks_customer_status_created_at_id` | `tasks` | `(customer_id, status, created_at DESC, id)` | "My tasks" cursor pagination |

`location_point` (PostGIS `GEOMETRY(Point, 4326)`) is auto-populated from `location_lat`/`location_lng`
by a DB trigger on every INSERT and UPDATE — callers never set it directly.

## Offline Access (NFR-RELI-02)

`GET /api/v1/tasks/mine` is the endpoint used by the mobile client for offline read-only caching
(AsyncStorage). No server-side cache headers are set; the client is responsible for storing and
serving previously-fetched data when offline. No offline mutations are supported.

## Cross-Module Dependencies

- `BookingService` — called to resolve booked-tasker authorization on `GET /{id}` and on accept.
- `CategoryService` — resolves category info for public task response.
- `AuthService` — resolves customer profile info for public task response.
- `IdempotencyService` — for accept-application idempotency.

## Invariants & Guards

- Only `CUSTOMER` role may create tasks.
- Only `TASKER` role with `VERIFIED` status (i.e., admin-approved) may apply.
- A task may only be updated or cancelled while `OPEN`.
- Maximum 3 photos per task (enforced at creation, update, and post-create upload).
- `liability_disclaimer_accepted` must be explicitly `true` to accept an application.
- Cursor-based pagination on all list endpoints; default limit 20, max 100.
