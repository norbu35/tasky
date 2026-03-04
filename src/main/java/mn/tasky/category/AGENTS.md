# Feature: category

Service category read and admin CRUD.

## Implemented API

All endpoints require authenticated JWT.

| Method | Path                            | Role intent            |
|--------|---------------------------------|------------------------|
| `GET`  | `/api/v1/categories`            | Any authenticated user |
| `GET`  | `/api/v1/admin/categories`      | Admin surface          |
| `POST` | `/api/v1/admin/categories`      | Admin surface          |
| `PUT`  | `/api/v1/admin/categories/{id}` | Admin surface          |

`/api/v1/admin/**` is role-protected by security config (`ADMIN`).

## Behavior

- Active list uses cursor pagination (`cursor` is category id anchor).
- Admin list includes inactive categories.
- Response strings are HTML-escaped in controller.
- Update is partial; omitted fields keep existing values.

## Error Shapes

- Invalid cursor: `400` with `{code:"INVALID_CURSOR", ...}`
- Update missing category: `404` with `{code:"CATEGORY_NOT_FOUND", ...}`

## Current Data Model Coverage

- Category fields: `id`, `name`, `name_mn`, `icon_url`, `is_active`, `sort_order`
- No intake-schema/category-form definition endpoint in this module yet.
