// apps/mobile/src/design/tailwind-screen-typography.ts
import plugin from 'tailwindcss/plugin';
import { nativeTokens } from '@tasky/design-tokens';

const scale = nativeTokens.typography.scale;

export const screenTypographyPlugin = plugin(function ({ addUtilities }) {
  addUtilities({
    '.font-screen-greeting': {
      fontSize: String(scale.caption),
      fontFamily: 'PlusJakartaSans_600SemiBold',
      letterSpacing: '0.8',
      textTransform: 'uppercase',
    },
    '.font-screen-title': {
      fontSize: String(scale.heroTitle),
      fontFamily: 'Manrope_700Bold',
    },
    '.font-screen-section': {
      fontSize: String(scale.heading),
      fontFamily: 'Manrope_700Bold',
      lineHeight: String(Math.round(scale.heading * 1.25)),
    },
    '.font-screen-card-title': {
      fontSize: String(scale.body),
      fontFamily: 'PlusJakartaSans_700Bold',
      lineHeight: String(Math.round(scale.body * 1.35)),
    },
    '.font-screen-subtitle': {
      fontSize: String(scale.subtitle),
      fontFamily: 'PlusJakartaSans_600SemiBold',
      lineHeight: String(Math.round(scale.subtitle * 1.35)),
    },
    '.font-screen-label': {
      fontSize: String(scale.label),
      fontFamily: 'PlusJakartaSans_500Medium',
      lineHeight: String(Math.round(scale.label * 1.3)),
    },
  });
});
