// apps/mobile/src/design/tailwind-screen-typography.ts
import plugin from 'tailwindcss/plugin';

import { nativeTokens } from '@tasky/design-tokens';

const typographyVariants = nativeTokens.typographyVariants;

const px = (value: number) => `${value}px`;

export const screenTypographyPlugin = plugin(function ({ addUtilities }) {
  addUtilities({
    '.font-screen-greeting': {
      fontSize: px(typographyVariants.badgeText.fontSize),
      fontFamily: typographyVariants.badgeText.fontFamily,
      fontWeight: typographyVariants.badgeText.fontWeight,
      lineHeight: px(typographyVariants.badgeText.lineHeight),
      letterSpacing: px(typographyVariants.badgeText.letterSpacing),
      textTransform: 'uppercase',
    },
    '.tracking-badge': {
      letterSpacing: px(typographyVariants.badgeText.letterSpacing),
    },
    '.font-screen-title': {
      fontSize: px(typographyVariants.pageHeading.fontSize),
      fontFamily: typographyVariants.pageHeading.fontFamily,
      fontWeight: typographyVariants.pageHeading.fontWeight,
      lineHeight: px(typographyVariants.pageHeading.lineHeight),
      letterSpacing: px(typographyVariants.pageHeading.letterSpacing),
    },
    '.font-screen-section': {
      fontSize: px(typographyVariants.sectionHeading.fontSize),
      fontFamily: typographyVariants.sectionHeading.fontFamily,
      fontWeight: typographyVariants.sectionHeading.fontWeight,
      lineHeight: px(typographyVariants.sectionHeading.lineHeight),
      letterSpacing: px(typographyVariants.sectionHeading.letterSpacing),
    },
    '.font-screen-card-title': {
      fontSize: px(typographyVariants.cardTitle.fontSize),
      fontFamily: typographyVariants.cardTitle.fontFamily,
      fontWeight: typographyVariants.cardTitle.fontWeight,
      lineHeight: px(typographyVariants.cardTitle.lineHeight),
      letterSpacing: px(typographyVariants.cardTitle.letterSpacing),
    },
    '.font-screen-subtitle': {
      fontSize: px(typographyVariants.bodyEmphasis.fontSize),
      fontFamily: typographyVariants.bodyEmphasis.fontFamily,
      fontWeight: typographyVariants.bodyEmphasis.fontWeight,
      lineHeight: px(typographyVariants.bodyEmphasis.lineHeight),
      letterSpacing: px(typographyVariants.bodyEmphasis.letterSpacing),
    },
    '.font-screen-label': {
      fontSize: px(typographyVariants.label.fontSize),
      fontFamily: typographyVariants.label.fontFamily,
      fontWeight: typographyVariants.label.fontWeight,
      lineHeight: px(typographyVariants.label.lineHeight),
      letterSpacing: px(typographyVariants.label.letterSpacing),
    },
  });
});
