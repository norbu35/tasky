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

export function withAlpha(hex: string, opacity: number) {
  const normalized = Math.max(0, Math.min(1, opacity));
  const alpha = Math.round(normalized * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

  return `${hex}${alpha}`;
}

export {
  animationPresets,
  durations,
  easings,
  interactiveStates,
  springs,
  withEmphasisSpring,
  withFloatingSpring,
  withInteractiveSpring,
} from './animations';
export { elevations, overlays } from './elevations';
export { mobileSurfaces } from './surfaces';
