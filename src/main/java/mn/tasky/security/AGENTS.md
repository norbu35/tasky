# Feature: security

Role-scoped health-check ping endpoints. Development and integration testing utility.

## Purpose

Provides lightweight, role-authenticated `GET` endpoints to verify that Spring Security
role filters are correctly applied for each principal type.
Not intended for production client use; serves as a security smoke-test surface.

## API Endpoints

| Method | Path                             | Auth | Required Role |
|--------|----------------------------------|------|---------------|
| `GET`  | `/api/v1/security/customer/ping` | JWT  | CUSTOMER      |
| `GET`  | `/api/v1/security/tasker/ping`   | JWT  | TASKER        |
| `GET`  | `/api/v1/security/admin/ping`    | JWT  | ADMIN         |

## Response Shape

All three endpoints return 200 with a role label on success:

```json
// GET /api/v1/security/customer/ping
{ "scope": "customer" }

// GET /api/v1/security/tasker/ping
{ "scope": "tasker" }

// GET /api/v1/security/admin/ping
{ "scope": "admin" }
```

Wrong role → `403 Forbidden` (Spring Security denies before the handler is reached).

## Invariants & Guards

- Role enforcement is handled entirely by the Spring Security filter chain (not in controller logic).
- These endpoints carry no side effects.
