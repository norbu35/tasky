import { motionTokens } from './motion';
import { nativeTokens } from './platform/native';
import { semanticTokens } from './semantic';

export const designTokens = {
  colors: semanticTokens.colors,
  radius: semanticTokens.radius,
  spacing: semanticTokens.spacing,
  typography: nativeTokens.typography.scale,
  shadows: semanticTokens.shadows,
  motion: motionTokens,
} as const;

export type DesignTokens = typeof designTokens;
