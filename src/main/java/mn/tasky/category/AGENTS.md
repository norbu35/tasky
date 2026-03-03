# Feature: category

Service category management — authenticated listing and admin CRUD.

## Purpose

Categories define the service types available on the marketplace (Cleaning, Plumbing, etc.).
They are database-managed: admin can create, update, and deactivate categories.
Taskers and Customers use category IDs to tag and filter tasks.

## API Endpoints

| Method | Path                            | Auth | Role              | Notes                                  |
|--------|---------------------------------|------|-------------------|----------------------------------------|
| `GET`  | `/api/v1/categories`            | JWT  | Any authenticated | List active categories only            |
| `GET`  | `/api/v1/admin/categories`      | JWT  | ADMIN             | List all categories including inactive |
| `POST` | `/api/v1/admin/categories`      | JWT  | ADMIN             | Create a new category                  |
| `PUT`  | `/api/v1/admin/categories/{id}` | JWT  | ADMIN             | Update an existing category            |

## Query Parameters — List Endpoints

| Param    | Default | Constraints              |
|----------|---------|--------------------------|
| `cursor` | —       | Opaque pagination cursor |
| `limit`  | `20`    | 1–100                    |

## Request / Response Shapes

### `POST /api/v1/admin/categories`

```json
// Request
{
  "name": "string (max 120)",          // English name
  "name_mn": "string (max 120)",       // Mongolian name
  "icon_url": "https://... (max 512)", // Must be http(s) URL
  "sort_order": 0                      // Integer ≥ 0
}
// Response 201 — CategoryResponse
```

### `PUT /api/v1/admin/categories/{id}`

```json
// Request — all fields optional
{
  "name": "string",
  "name_mn": "string",
  "icon_url": "https://...",
  "is_active": true,
  "sort_order": 0
}
// Response 200 — CategoryResponse
// Response 404 — CATEGORY_NOT_FOUND
```

### CategoryResponse

```json
{
  "id": "uuid",
  "name": "Cleaning",
  "name_mn": "Гэр цэвэрлэгээ",
  "icon_url": "https://cdn.tasky.mn/icons/cleaning.svg",
  "is_active": true,
  "sort_order": 1
}
```

## Error Codes

| Code                 | HTTP | Trigger                             |
|----------------------|------|-------------------------------------|
| `CATEGORY_NOT_FOUND` | 404  | Category ID does not exist (update) |
| `INVALID_CURSOR`     | 400  | Cursor parameter is malformed       |

## i18n Contract

- `name` — English display name (source-of-truth locale).
- `name_mn` — Mongolian Cyrillic display name.
- Both fields are returned on every response; clients select the appropriate field based on locale.
- All output values are HTML-escaped before serialisation.

## Invariants & Guards

- Deactivating a category (`is_active: false`) does not delete it or affect existing tasks.
- Active categories are the only ones visible in the public listing (`GET /api/v1/categories`).
- `sort_order` controls display order in client UIs.
- Seed data (5 MVP categories) is loaded via Flyway migration; admin may add more at runtime.
