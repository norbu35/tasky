import { motionTokens } from '../motion';
import { semanticTokens } from '../semantic';

const textStyleRoles = {
  heroTitle: {
    fontFamily: semanticTokens.typography.families.displayBold.native,
    fontWeight: semanticTokens.typography.weights.bold,
    lineHeight: semanticTokens.typography.lineHeights.tight,
    letterSpacing: semanticTokens.typography.letterSpacing.tight,
  },
  heading: {
    fontFamily: semanticTokens.typography.families.displayBold.native,
    fontWeight: semanticTokens.typography.weights.bold,
    lineHeight: semanticTokens.typography.lineHeights.tight,
    letterSpacing: semanticTokens.typography.letterSpacing.tight,
  },
  title: {
    fontFamily: semanticTokens.typography.families.display.native,
    fontWeight: semanticTokens.typography.weights.semibold,
    lineHeight: semanticTokens.typography.lineHeights.tight,
    letterSpacing: semanticTokens.typography.letterSpacing.tight,
  },
  subtitle: {
    fontFamily: semanticTokens.typography.families.sansSemibold.native,
    fontWeight: semanticTokens.typography.weights.semibold,
    lineHeight: semanticTokens.typography.lineHeights.normal,
    letterSpacing: semanticTokens.typography.letterSpacing.normal,
  },
  body: {
    fontFamily: semanticTokens.typography.families.sans.native,
    fontWeight: semanticTokens.typography.weights.normal,
    lineHeight: semanticTokens.typography.lineHeights.normal,
    letterSpacing: semanticTokens.typography.letterSpacing.normal,
  },
  label: {
    fontFamily: semanticTokens.typography.families.sansMedium.native,
    fontWeight: semanticTokens.typography.weights.medium,
    lineHeight: semanticTokens.typography.lineHeights.normal,
    letterSpacing: semanticTokens.typography.letterSpacing.normal,
  },
  caption: {
    fontFamily: semanticTokens.typography.families.sansMedium.native,
    fontWeight: semanticTokens.typography.weights.medium,
    lineHeight: semanticTokens.typography.lineHeights.normal,
    letterSpacing: semanticTokens.typography.letterSpacing.normal,
  },
  micro: {
    fontFamily: semanticTokens.typography.families.sansSemibold.native,
    fontWeight: semanticTokens.typography.weights.semibold,
    lineHeight: semanticTokens.typography.lineHeights.tight,
    letterSpacing: semanticTokens.typography.letterSpacing.normal,
  },
  navLabel: {
    fontFamily: semanticTokens.typography.families.sansSemibold.native,
    fontWeight: semanticTokens.typography.weights.semibold,
    lineHeight: semanticTokens.typography.lineHeights.tight,
    letterSpacing: semanticTokens.typography.letterSpacing.normal,
  },
} as const;

const toNativeLetterSpacing = (fontSize: number, tracking: number) =>
  Number((fontSize * tracking).toFixed(2));

const toNativeTextStyle = <
  Role extends keyof typeof textStyleRoles & keyof typeof semanticTokens.typography.fontSizes,
>(
  role: Role,
) => {
  const fontSize = semanticTokens.typography.fontSizes[role];
  const config = textStyleRoles[role];

  return {
    fontSize,
    fontFamily: config.fontFamily,
    fontWeight: config.fontWeight,
    lineHeight: Math.round(fontSize * config.lineHeight),
    letterSpacing: toNativeLetterSpacing(fontSize, config.letterSpacing),
  };
};

export const nativeTokens = {
  colors: {
    background: semanticTokens.colors.background.hex,
    foreground: semanticTokens.colors.foreground.hex,
    card: semanticTokens.colors.card.hex,
    cardForeground: semanticTokens.colors.cardForeground.hex,
    primary: semanticTokens.colors.primary.hex,
    primaryForeground: semanticTokens.colors.primaryForeground.hex,
    primaryDeep: semanticTokens.colors.primaryDeep.hex,
    secondary: semanticTokens.colors.secondary.hex,
    secondaryForeground: semanticTokens.colors.secondaryForeground.hex,
    muted: semanticTokens.colors.muted.hex,
    mutedForeground: semanticTokens.colors.mutedForeground.hex,
    border: semanticTokens.colors.border.hex,
    input: semanticTokens.colors.input.hex,
    accent: semanticTokens.colors.accent.hex,
    accentForeground: semanticTokens.colors.accentForeground.hex,
    danger: semanticTokens.colors.danger.hex,
    dangerForeground: semanticTokens.colors.dangerForeground.hex,
    trust: semanticTokens.colors.trust.hex,
    trustForeground: semanticTokens.colors.trustForeground.hex,
    trustMuted: semanticTokens.colors.trustMuted.hex,
    statusOpen: semanticTokens.colors.statusOpen.hex,
    statusOpenForeground: semanticTokens.colors.statusOpenForeground.hex,
    statusAssigned: semanticTokens.colors.statusAssigned.hex,
    statusAssignedForeground: semanticTokens.colors.statusAssignedForeground.hex,
    verified: semanticTokens.colors.verified.hex,
    verifiedForeground: semanticTokens.colors.verifiedForeground.hex,
    subtleViolet: semanticTokens.colors.subtleViolet.hex,
    chipInactive: semanticTokens.colors.chipInactive.hex,
    textSecondary: semanticTokens.colors.textSecondary.hex,
    textTertiary: semanticTokens.colors.textTertiary.hex,
    navInactive: semanticTokens.colors.navInactive.hex,
  },
  spacing: semanticTokens.spacing,
  radius: semanticTokens.radius,
  typography: {
    families: {
      sans: semanticTokens.typography.families.sans.native,
      display: semanticTokens.typography.families.display.native,
    },
    fontSizes: semanticTokens.typography.fontSizes,
    scale: semanticTokens.typography.fontSizes,
    weights: semanticTokens.typography.weights,
    lineHeights: semanticTokens.typography.lineHeights,
    letterSpacing: semanticTokens.typography.letterSpacing,
    minBodySize: semanticTokens.typography.minBodySize,
    styles: {
      heroTitle: toNativeTextStyle('heroTitle'),
      heading: toNativeTextStyle('heading'),
      title: toNativeTextStyle('title'),
      subtitle: toNativeTextStyle('subtitle'),
      body: toNativeTextStyle('body'),
      label: toNativeTextStyle('label'),
      caption: toNativeTextStyle('caption'),
      micro: toNativeTextStyle('micro'),
      navLabel: toNativeTextStyle('navLabel'),
    },
  },
  shadows: semanticTokens.shadows,
  motion: motionTokens,
} as const;

export type NativeTokens = typeof nativeTokens;
