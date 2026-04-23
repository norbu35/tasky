# @tasky/sdk

Auto-generated TypeScript types from the Tasky OpenAPI specification.

## Purpose

This package generates TypeScript type definitions from the split OpenAPI source in `docs/openapi/**` using `openapi-typescript`. It serves as the single source of truth for API types across all frontend clients. `docs/API.yaml` remains the generated single-file compatibility artifact.

## What It Exports

```typescript
import type { components, paths, operations } from '@tasky/sdk';

// Access schema types
type User = components['schemas']['User'];
type PublicTask = components['schemas']['PublicTask'];
type Category = components['schemas']['Category'];
```

The generated types include:

- `components["schemas"]` -- all request/response DTOs
- `paths` -- endpoint path definitions with methods
- `operations` -- operation-level types with parameters and responses

## Structure

```
src/
  index.ts                  Re-exports generated types
  generated/
    api-types.ts            Auto-generated from docs/openapi/openapi.yaml
```

## Regenerating Types

When the OpenAPI spec (`docs/openapi/**`) changes:

```bash
pnpm openapi:bundle
pnpm --filter @tasky/sdk generate   # Regenerate api-types.ts from split OpenAPI source
```

This runs: `node ../../tooling/scripts/contracts/bundle-openapi.mjs && openapi-typescript ../../docs/openapi/openapi.yaml -o src/generated/api-types.ts`

## Scripts

| Script      | Purpose                            |
| ----------- | ---------------------------------- |
| `generate`  | Regenerate types from OpenAPI spec |
| `build`     | Compile TypeScript                 |
| `typecheck` | Type check without emitting        |

## Consumers

- `@tasky/core` -- imports schema types for shared hooks
- `@tasky/web` -- imports schema types for page components
- `@tasky/mobile` -- imports schema types for screens
