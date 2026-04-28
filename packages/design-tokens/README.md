# @tasky/design-tokens

Cross-platform design tokens for the Tasky brand system ("Tengger / Sky" palette).

## Purpose

Runtime implementation of the canonical design system documented in `docs/design`.
The package contains code consumed by web and mobile clients. Pure design
documentation, handoff CSS, previews, and UI kits stay under `docs/design/**`.

## Token Layers

### 1. Core Tokens (`src/core/`)

- Raw palette values (`hex` + `hsl`)
- Base spacing/radius scales
- Font families, weights, line-height, and letter-spacing metadata
- Shadow definitions
- Motion durations and easing
- System additions for interaction states, overlays, icon sizes, elevation layers, typography variants, density, animation presets, opacity colors, and content rules

### 2. Semantic Tokens (`src/core/semantic.ts`)

- Product-facing aliases like `primary`, `statusAssigned`, `body`, `label`
- Cross-platform meaning shared by web and mobile
- Typography recipes for Mongolian Cyrillic-friendly text styles

### 3. Platform Outputs (`src/platform/*.ts`)

- `nativeTokens` for React Native / NativeWind consumers
- `webTokens` for CSS variables / Tailwind consumers
- Both outputs are derived from the same semantic graph

### 4. Compatibility Exports (`src/compat/*.ts`)

- Legacy aggregate exports used by existing tests and older callers
- New code should prefer `semanticTokens`, `webTokens`, or `nativeTokens`

### 5. Runtime CSS (`src/styles/tokens.css`)

- CSS custom properties consumed through `@tasky/design-tokens/tokens.css`
- The runtime CSS is the only active CSS token artifact; design docs describe the contract in prose

## Public API

```ts
import {
  animationPresetTokens,
  colorOpacityTokens,
  contentRuleTokens,
  densityTokens,
  elevationTokens,
  iconSizeTokens,
  interactionTokens,
  overlayTokens,
  primitiveTokens,
  semanticTokens,
  nativeTokens,
  typographyVariantTokens,
  webTokens,
  motionTokens,
} from '@tasky/design-tokens';
```

Compatibility exports remain available from the root package export:

- `designTokens`
- `colors`
- `spacing`
- `radius`
- `typography`

## Usage

### In web

```ts
import { webTokens } from '@tasky/design-tokens';

webTokens.cssVariableSections.semanticAliases['--color-primary'];
webTokens.typography.fontFamily.sans;
webTokens.interaction.pressed.opacity;
webTokens.elevation.modal.zIndex;
```

### In mobile

```ts
import { nativeTokens } from '@tasky/design-tokens';

nativeTokens.colors.primary;
nativeTokens.typography.styles.body;
nativeTokens.typographyVariants.pageHeading;
nativeTokens.animationPresets.sheetOpen;
```

## Build

```bash
pnpm --filter @tasky/design-tokens build
```

## Verification

```bash
pnpm --filter @tasky/design-tokens test
pnpm --filter @tasky/design-tokens lint
```
