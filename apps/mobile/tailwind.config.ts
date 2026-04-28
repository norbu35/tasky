// apps/mobile/tailwind.config.ts
import type { Config } from 'tailwindcss';
import { nativeTokens } from '@tasky/design-tokens';
import { screenTypographyPlugin } from './src/design/tailwind-screen-typography';

function camelToKebab(str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

const colorsWithKebab = Object.fromEntries(
  Object.entries(nativeTokens.colors).map(([key, value]) => [camelToKebab(key), value]),
);

const typographyScaleWithKebab = Object.fromEntries(
  Object.entries(nativeTokens.typography.scale).map(([key, value]) => [camelToKebab(key), value]),
);

const typographyVariantScaleWithKebab = Object.fromEntries(
  Object.entries(nativeTokens.typographyVariants).map(([key, value]) => [
    camelToKebab(key),
    value.fontSize,
  ]),
);

const radiusWithAliases = {
  ...nativeTokens.radius,
  xl: nativeTokens.radius.lg,
  '2xl': nativeTokens.radius.lg,
};

const interactionClassNames = [
  'active:opacity-pressed',
  'active:scale-pressed',
  'disabled:opacity-disabled',
];

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  safelist: interactionClassNames,
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: colorsWithKebab,
      spacing: {
        ...nativeTokens.spacing,
        'screen-x': nativeTokens.spacing.lg,
        'header-top': nativeTokens.spacing['2xl'],
        'header-greeting': nativeTokens.spacing.xs,
        'header-title': nativeTokens.spacing.sm,
        'header-bottom': nativeTokens.spacing.xl,
        section: nativeTokens.spacing.xl,
        block: nativeTokens.spacing.lg,
        item: nativeTokens.spacing.md,
        micro: nativeTokens.spacing.xs,
        card: nativeTokens.spacing.lg,
        'action-bar': nativeTokens.spacing.md,
        'action-buttons': nativeTokens.spacing.sm,
        'wizard-step': nativeTokens.spacing.xs,
      },
      borderRadius: radiusWithAliases,
      fontFamily: {
        sans: [nativeTokens.typography.families.sans],
        'sans-medium': ['PlusJakartaSans_500Medium'],
        'sans-semibold': ['PlusJakartaSans_600SemiBold'],
        'sans-bold': ['PlusJakartaSans_700Bold'],
        display: [nativeTokens.typography.families.display],
        'display-bold': ['Manrope_700Bold'],
      },
      fontSize: {
        ...typographyScaleWithKebab,
        ...typographyVariantScaleWithKebab,
      },
      minHeight: {
        touch: `${nativeTokens.iconSizes.touchTargetMin}px`,
        'touch-lg': '48px',
        'touch-xl': '56px',
      },
      minWidth: {
        touch: `${nativeTokens.iconSizes.touchTargetMin}px`,
        'touch-lg': '48px',
      },
      size: {
        touch: `${nativeTokens.iconSizes.touchTargetMin}px`,
        'touch-sm': '36px',
      },
      opacity: {
        pressed: `${nativeTokens.interaction.pressed.opacity}`,
        disabled: `${nativeTokens.interaction.disabled.opacity}`,
        hover: `${nativeTokens.interaction.hover.opacity}`,
      },
      scale: {
        pressed: `${nativeTokens.interaction.pressed.scale}`,
      },
    },
  },
  plugins: [screenTypographyPlugin],
};

export default config;
