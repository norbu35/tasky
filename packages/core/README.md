# @tasky/core

Shared business logic, schemas, and React Query hooks used by both the web and mobile clients.

## Purpose

This package provides platform-agnostic domain logic so that web (`@tasky/web`) and mobile (`@tasky/mobile`) apps share the same validation rules, type definitions, and data-fetching hooks.

## Exports

### Task Schema (`tasks/taskSchema.ts`)

Zod validation schema for task creation:

```typescript
import { createTaskSchema, type CreateTaskFormValues } from '@tasky/core';
```

Validates: `category_id`, `description` (10-2000 chars), `budget` (5,000-10,000,000 MNT), `scheduled_at`, `location_text`, `location_lat`, `location_lng`, `photo_keys` (max 3).

### Task Query Hook (`tasks/useTasks.ts`)

```typescript
import { useTasksQuery, type PublicTask, type TaskFilters } from '@tasky/core';
```

- `useTasksQuery(apiClient, accessToken, filters?)` -- React Query hook for fetching paginated tasks
- `TaskFilters` -- filter by `categoryId`, `lat`/`lng`/`radiusKm`
- `CursorPage<T>` -- cursor-based pagination wrapper

### Category Query Hook (`tasks/useCategories.ts`)

```typescript
import { useCategoriesQuery, type Category } from '@tasky/core';
```

- `useCategoriesQuery(apiClient, accessToken)` -- React Query hook for fetching categories

## Dependencies

- `zod` -- schema validation
- `@tanstack/react-query` -- server state management
- `@tasky/sdk` -- OpenAPI-generated types
- `react` (peer) -- React 19+

## Scripts

```bash
pnpm --filter @tasky/core build      # Compile TypeScript
pnpm --filter @tasky/core typecheck  # Type check without emitting
```
