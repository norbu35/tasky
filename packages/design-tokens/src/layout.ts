import { webTokens } from './platform/web';
import { primitiveTokens } from './primitives';
import { semanticTokens } from './semantic';

const px = (value: number) => `${value}px`;

// Legacy web-facing export. Prefer `webTokens` or `semanticTokens` in new code.
export const spacing = {
  0: px(primitiveTokens.spacingScale[0]),
  1: px(primitiveTokens.spacingScale[1]),
  2: px(primitiveTokens.spacingScale[2]),
  3: px(primitiveTokens.spacingScale[3]),
  4: px(primitiveTokens.spacingScale[4]),
  5: px(primitiveTokens.spacingScale[5]),
  6: px(primitiveTokens.spacingScale[6]),
  8: px(primitiveTokens.spacingScale[8]),
  10: px(primitiveTokens.spacingScale[10]),
  12: px(primitiveTokens.spacingScale[12]),
  16: px(primitiveTokens.spacingScale[16]),
} as const;

export const radius = {
  none: px(primitiveTokens.radiusScale.none),
  sm: px(semanticTokens.radius.xs),
  DEFAULT: px(semanticTokens.radius.sm),
  md: px(semanticTokens.radius.md),
  lg: px(semanticTokens.radius.lg),
  xl: px(semanticTokens.radius.lg),
  full: px(semanticTokens.radius.full),
} as const;

export const typography = {
  fontFamily: webTokens.typography.fontFamily,
  fontSize: {
    xs: webTokens.typography.fontSize.caption,
    sm: webTokens.typography.fontSize.label,
    base: webTokens.typography.fontSize.body,
    lg: webTokens.typography.fontSize.subtitle,
    xl: webTokens.typography.fontSize.title,
    '2xl': webTokens.typography.fontSize.heading,
    '3xl': webTokens.typography.fontSize.heroTitle,
  },
  fontWeight: webTokens.typography.fontWeight,
  lineHeight: webTokens.typography.lineHeight,
  letterSpacing: webTokens.typography.letterSpacing,
  minBodySize: webTokens.typography.minBodySize,
} as const;
