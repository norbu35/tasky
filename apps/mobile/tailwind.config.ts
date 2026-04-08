// apps/mobile/tailwind.config.ts
import type { Config } from 'tailwindcss';
import { nativeTokens } from '@tasky/design-tokens';
import { screenLayout } from './src/design/screenLayout';
import { screenTypographyPlugin } from './src/design/tailwind-screen-typography';

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
      colors: nativeTokens.colors,
      spacing: {
        ...nativeTokens.spacing,
        'screen-x': String(screenLayout.insetX),
        'header-top': String(screenLayout.header.topInset),
        'header-greeting': String(screenLayout.header.greetingGap),
        'header-title': String(screenLayout.header.titleGap),
        'header-bottom': String(screenLayout.header.bottomGap),
        section: String(screenLayout.body.sectionGap),
        block: String(screenLayout.body.blockGap),
        item: String(screenLayout.body.itemGap),
        micro: String(screenLayout.body.microGap),
        card: String(screenLayout.body.cardPadding),
        'action-bar': String(screenLayout.actions.barPadding),
        'action-buttons': String(screenLayout.actions.buttonGap),
        'wizard-step': String(screenLayout.wizard.stepIndicatorGap),
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
