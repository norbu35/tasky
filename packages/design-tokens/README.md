# @tasky/design-tokens

Cross-platform design tokens for the Tasky brand system ("Tengger / Sky" palette).

## Purpose

Single source of truth for colors, spacing, typography, border radii, shadows, and motion values used by both web and mobile clients. The package is layered so restyling happens by changing tokens rather than rewriting components.

## Token Layers

### 1. Primitives (`src/primitives.ts`)

- Raw palette values (`hex` + `hsl`)
- Base spacing/radius scales
- Font families, weights, line-height, and letter-spacing metadata
- Shadow definitions

### 2. Semantic Tokens (`src/semantic.ts`)

- Product-facing aliases like `primary`, `statusAssigned`, `body`, `label`
- Cross-platform meaning shared by web and mobile
- Typography recipes for Mongolian Cyrillic-friendly text styles

### 3. Platform Outputs (`src/platform/*.ts`)

- `nativeTokens` for React Native / NativeWind consumers
- `webTokens` for CSS variables / Tailwind consumers
- Both outputs are derived from the same semantic graph

## Public API

```ts
import {
  primitiveTokens,
  semanticTokens,
  nativeTokens,
  webTokens,
  motionTokens,
} from '@tasky/design-tokens';
```

Compatibility exports remain available during migration:
- `designTokens`
- `colors`
- `spacing`
- `radius`
- `typography`

## Usage

### In web

```ts
import { webTokens } from '@tasky/design-tokens';

webTokens.cssVariables['--tasky-color-primary'];
webTokens.typography.fontFamily.sans;
```

### In mobile

```ts
import { nativeTokens } from '@tasky/design-tokens';

nativeTokens.colors.primary;
nativeTokens.typography.styles.body;
```

## Build

```bash
pnpm --filter @tasky/design-tokens build
```
