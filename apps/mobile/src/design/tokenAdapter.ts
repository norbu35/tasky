import { motionTokens, nativeTokens } from '@tasky/design-tokens';

export const mobileTheme = {
  colors: {
    ...nativeTokens.colors,
  },
  radius: nativeTokens.radius,
  spacing: nativeTokens.spacing,
  typography: nativeTokens.typography.scale,
  shadows: nativeTokens.shadows,
  motion: motionTokens,
} as const;

export type MobileTheme = typeof mobileTheme;

export { animationPresets, durations, easings, interactiveStates } from './animations';
export { elevations, overlays } from './elevations';
