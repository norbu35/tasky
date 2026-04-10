// apps/mobile/tailwind.config.ts
import type { Config } from 'tailwindcss';
import { nativeTokens } from '@tasky/design-tokens';
import { screenTypographyPlugin } from './src/design/tailwind-screen-typography';

function camelToKebab(str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

const colorsWithKebab = Object.fromEntries(
  Object.entries(nativeTokens.colors).flatMap(([key, value]) => [
    [key, value],
    [camelToKebab(key), value],
  ])
);

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
    './src/providers/**/*.{ts,tsx}',
    './src/store/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: colorsWithKebab,
      spacing: {
        ...nativeTokens.spacing,
        'screen-x': String(nativeTokens.spacing.lg),
        'header-top': String(nativeTokens.spacing.xl),
        'header-greeting': String(nativeTokens.spacing.xs),
        'header-title': String(nativeTokens.spacing.sm),
        'header-bottom': String(nativeTokens.spacing.xl),
        section: String(nativeTokens.spacing.xl),
        block: String(nativeTokens.spacing.lg),
        item: String(nativeTokens.spacing.md),
        micro: String(nativeTokens.spacing.xs),
        card: String(nativeTokens.spacing.lg),
        'action-bar': String(nativeTokens.spacing.md),
        'action-buttons': String(nativeTokens.spacing.sm),
        'wizard-step': String(nativeTokens.spacing.xs),
      },
      borderRadius: nativeTokens.radius,
      fontFamily: {
        sans: [nativeTokens.typography.families.sans],
        'sans-medium': ['PlusJakartaSans_500Medium'],
        'sans-semibold': ['PlusJakartaSans_600SemiBold'],
        'sans-bold': ['PlusJakartaSans_700Bold'],
        display: [nativeTokens.typography.families.display],
        'display-bold': ['Manrope_700Bold'],
      },
      fontSize: nativeTokens.typography.scale,
    },
  },
  plugins: [screenTypographyPlugin],
};

export default config;
