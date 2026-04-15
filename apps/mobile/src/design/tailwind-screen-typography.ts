// apps/mobile/src/design/tailwind-screen-typography.ts
import plugin from 'tailwindcss/plugin';

import { nativeTokens } from '@tasky/design-tokens';

const scale = nativeTokens.typography.scale;

export const screenTypographyPlugin = plugin(function ({ addUtilities }) {
  addUtilities({
    '.font-screen-greeting': {
      fontSize: `${scale.caption}px`,
      fontFamily: 'PlusJakartaSans_700Bold',
      letterSpacing: '1px',
      textTransform: 'uppercase',
    },
    '.font-screen-title': {
      fontSize: `${scale.heroTitle + 2}px`,
      fontFamily: 'Manrope_700Bold',
      letterSpacing: '-0.5px',
    },
    '.font-screen-section': {
      fontSize: `${scale.heading}px`,
      fontFamily: 'Manrope_700Bold',
      lineHeight: `${Math.round(scale.heading * 1.25)}px`,
    },
    '.font-screen-card-title': {
      fontSize: `${scale.body}px`,
      fontFamily: 'PlusJakartaSans_700Bold',
      lineHeight: `${Math.round(scale.body * 1.35)}px`,
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
