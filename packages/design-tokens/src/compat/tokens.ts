import { motionTokens } from '../core/motion';
import { semanticTokens } from '../core/semantic';
import { nativeTokens } from '../platform/native';

export const designTokens = {
  colors: semanticTokens.colors,
  radius: semanticTokens.radius,
  spacing: semanticTokens.spacing,
  typography: nativeTokens.typography.scale,
  shadows: semanticTokens.shadows,
  motion: motionTokens,
} as const;

export type DesignTokens = typeof designTokens;
