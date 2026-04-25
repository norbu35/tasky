import { nativeTokens } from '@tasky/design-tokens';

export const mobileTheme = {
  colors: {
    ...nativeTokens.colors,
  },
  radius: nativeTokens.radius,
  spacing: nativeTokens.spacing,
  typography: nativeTokens.typography.scale,
  typographyVariants: nativeTokens.typographyVariants,
  interaction: nativeTokens.interaction,
  overlays: nativeTokens.overlays,
  iconSizes: nativeTokens.iconSizes,
  elevation: nativeTokens.elevation,
  density: nativeTokens.density,
  animationPresets: nativeTokens.animationPresets,
  colorOpacity: nativeTokens.colorOpacity,
  contentRules: nativeTokens.contentRules,
  shadows: nativeTokens.shadows,
  motion: nativeTokens.motion,
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
