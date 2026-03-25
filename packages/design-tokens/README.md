# @tasky/design-tokens

Cross-platform design tokens for the Tasky brand system ("Tengger / Sky" palette).

## Purpose

Single source of truth for colors, spacing, typography, border radii, and motion values used by both web (Tailwind CSS) and mobile (React Native) clients.

## Token Categories

### Colors (`src/colors.ts`)

The "Tengger" (Sky) palette -- Mongolian-inspired color system:

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#1B3A5C` (Deep Sky Blue) | Primary actions, headings |
| `secondary` | `#8B6914` (Dark Steppe Gold) | Accents, highlights |
| `accent` | `#6BA3BE` (Open Sky) | Secondary actions |
| `background` | `#F9F8F5` (Clean Off-White) | Page background |
| `destructive` | `#EF4444` | Error states, destructive actions |
| `muted` | `#F3F1EC` / `#576473` | Subdued backgrounds / text |
| `border` | `#C7D0D9` (Soft Blue-Grey) | Borders, dividers |

### Layout (`src/layout.ts`)

- **Spacing** -- 4px base scale (0-64px)
- **Border radius** -- `none` through `full` (9999px)
- **Typography** -- font families (Plus Jakarta Sans / Manrope with Roboto fallback for Mongolian Cyrillic), sizes (12-30px), weights, line heights (Cyrillic-optimized), letter spacing, 16px minimum body size

### Motion (`src/motion.ts`)

Animation timing tuned for Mongolia's mobile network conditions:

| Token | Duration | Usage |
|-------|----------|-------|
| `instant` | 80ms | Micro-feedback (button press) |
| `fast` | 150ms | Hover states, badge pop |
| `normal` | 250ms | Panel slides, card expand |
| `slow` | 400ms | Page transitions, modal open |
| `skeleton` | 1500ms | Skeleton pulse loop |

Four easing curves: `standard`, `decelerate`, `accelerate`, `spring`.

## Usage

### In web (Tailwind)

Tokens are integrated via `tailwind.config.ts`:

```typescript
import { colors, spacing, radius, typography } from "@tasky/design-tokens";
```

### In mobile (React Native)

Import TypeScript constants directly:

```typescript
import { colors, spacing, motionTokens } from "@tasky/design-tokens";
```

## Build

```bash
pnpm --filter @tasky/design-tokens build   # Compile to dist/
```

Output: `dist/` with `.js` and `.d.ts` files.
