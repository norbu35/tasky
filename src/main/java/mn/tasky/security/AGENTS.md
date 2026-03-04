# Feature: security

Role-scope ping endpoints used for auth smoke testing.

## Implemented API

| Method | Path                             | Required role |
|--------|----------------------------------|---------------|
| `GET`  | `/api/v1/security/customer/ping` | `CUSTOMER`    |
| `GET`  | `/api/v1/security/tasker/ping`   | `TASKER`      |
| `GET`  | `/api/v1/security/admin/ping`    | `ADMIN`       |

Each endpoint returns `{ "scope": "..." }` when authorization passes.
