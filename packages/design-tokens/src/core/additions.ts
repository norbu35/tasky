import { motionTokens } from './motion';
import { semanticTokens } from './semantic';

const toRgba = (hex: string, opacity: number) => {
  const normalized = hex.replace('#', '');
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity.toFixed(2)})`;
};

const primaryOpacityScale = (hex: string) =>
  ({
    5: toRgba(hex, 0.05),
    10: toRgba(hex, 0.1),
    15: toRgba(hex, 0.15),
    20: toRgba(hex, 0.2),
    30: toRgba(hex, 0.3),
    40: toRgba(hex, 0.4),
    50: toRgba(hex, 0.5),
    60: toRgba(hex, 0.6),
    80: toRgba(hex, 0.8),
  }) as const;

const softOpacityScale = (hex: string) =>
  ({
    5: toRgba(hex, 0.05),
    10: toRgba(hex, 0.1),
    15: toRgba(hex, 0.15),
    20: toRgba(hex, 0.2),
  }) as const;

const dangerOpacityScale = (hex: string) =>
  ({
    5: toRgba(hex, 0.05),
    10: toRgba(hex, 0.1),
    15: toRgba(hex, 0.15),
  }) as const;

const primaryDeep = semanticTokens.colors.primaryDeep.hex;

export const interactionTokens = {
  pressed: {
    opacity: 0.85,
    scale: 0.98,
  },
  focused: {
    ringWidth: 2,
    ringColor: semanticTokens.colors.primary,
    ringOffset: 2,
  },
  disabled: {
    opacity: 0.4,
    textColor: semanticTokens.colors.textTertiary,
    backgroundColor: semanticTokens.colors.muted,
  },
  hover: {
    opacity: 0.92,
  },
} as const;

export const overlayTokens = {
  scrim: {
    modal: toRgba(primaryDeep, 0.5),
    sheet: toRgba(primaryDeep, 0.35),
    toastBackdrop: toRgba(primaryDeep, 0.2),
  },
  imageOverlay: {
    textReadability: `linear-gradient(transparent 0%, ${toRgba(primaryDeep, 0.7)} 100%)`,
    subtle: `linear-gradient(transparent 0%, ${toRgba(primaryDeep, 0.4)} 100%)`,
  },
} as const;

export const iconSizeTokens = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  semantic: {
    navigation: 24,
    tabBar: 24,
    tabBarActive: 24,
    avatarBadge: 16,
    inputIcon: 20,
    fab: 24,
    status: 16,
  },
  touchTargetMin: 44,
} as const;

export const elevationTokens = {
  base: {
    zIndex: 0,
  },
  sticky: {
    zIndex: 10,
  },
  dropdown: {
    zIndex: 20,
  },
  sheet: {
    zIndex: 30,
    shadow: semanticTokens.shadows.elevated,
    scrim: overlayTokens.scrim.sheet,
  },
  modal: {
    zIndex: 40,
    shadow: semanticTokens.shadows.elevated,
    scrim: overlayTokens.scrim.modal,
  },
  toast: {
    zIndex: 50,
  },
  system: {
    zIndex: 60,
  },
} as const;

const family = semanticTokens.typography.families;
const fontSize = semanticTokens.typography.fontSizes;
const fontWeight = semanticTokens.typography.weights;
const lineHeight = semanticTokens.typography.lineHeights;
const letterSpacing = semanticTokens.typography.letterSpacing.normal;

export const typographyVariantTokens = {
  heroTitle: {
    fontFamily: family.displayBold,
    fontSize: fontSize.heroTitle,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing,
  },
  pageHeading: {
    fontFamily: family.displayBold,
    fontSize: fontSize.heading,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing,
  },
  sectionHeading: {
    fontFamily: family.display,
    fontSize: fontSize.title,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    letterSpacing,
  },
  cardTitle: {
    fontFamily: family.sansSemibold,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    letterSpacing,
  },
  bodyDefault: {
    fontFamily: family.sans,
    fontSize: fontSize.body,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    letterSpacing,
  },
  bodyEmphasis: {
    fontFamily: family.sansSemibold,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
    letterSpacing,
  },
  label: {
    fontFamily: family.sansMedium,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.tight,
    letterSpacing,
  },
  caption: {
    fontFamily: family.sans,
    fontSize: fontSize.label,
    fontWeight: fontWeight.normal,
    lineHeight: 1.4,
    letterSpacing,
  },
  buttonLabel: {
    fontFamily: family.sansSemibold,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    lineHeight: 1,
    letterSpacing,
  },
  navLabel: {
    fontFamily: family.sansMedium,
    fontSize: fontSize.navLabel,
    fontWeight: fontWeight.medium,
    lineHeight: 1,
    letterSpacing,
  },
  priceDisplay: {
    fontFamily: family.displayBold,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    lineHeight: 1,
    letterSpacing,
  },
  badgeText: {
    fontFamily: family.sansSemibold,
    fontSize: fontSize.navLabel,
    fontWeight: fontWeight.semibold,
    lineHeight: 1,
    letterSpacing,
  },
} as const;

export const densityTokens = {
  compact: {
    multiplier: 0.75,
    spacing: {
      xs: 3,
      sm: 6,
      md: 9,
      lg: 12,
      xl: 18,
    },
  },
  default: {
    multiplier: 1,
    spacing: semanticTokens.spacing,
  },
  comfortable: {
    multiplier: 1.5,
    spacing: {
      xs: 6,
      sm: 12,
      md: 18,
      lg: 24,
      xl: 36,
    },
  },
} as const;

export const animationPresetTokens = {
  cardExpand: {
    duration: motionTokens.duration.normal,
    easing: motionTokens.easing.standard,
  },
  sheetOpen: {
    duration: motionTokens.duration.slow,
    easing: motionTokens.easing.decelerate,
  },
  sheetClose: {
    duration: motionTokens.duration.normal,
    easing: motionTokens.easing.accelerate,
  },
  pageEnter: {
    duration: motionTokens.duration.normal,
    easing: motionTokens.easing.decelerate,
  },
  pageExit: {
    duration: motionTokens.duration.normal,
    easing: motionTokens.easing.accelerate,
  },
  fabAppear: {
    duration: motionTokens.duration.fast,
    easing: motionTokens.easing.spring,
  },
  fabDisappear: {
    duration: motionTokens.duration.fast,
    easing: motionTokens.easing.accelerate,
  },
  successCheckmark: {
    duration: motionTokens.duration.slow,
    easing: motionTokens.easing.spring,
  },
  skeletonPulse: {
    duration: motionTokens.duration.skeleton,
    easing: motionTokens.easing.standard,
    loop: true,
  },
  badgePop: {
    duration: motionTokens.duration.fast,
    easing: motionTokens.easing.spring,
  },
  toastSlideIn: {
    duration: motionTokens.duration.normal,
    easing: motionTokens.easing.decelerate,
  },
  toastSlideOut: {
    duration: motionTokens.duration.fast,
    easing: motionTokens.easing.accelerate,
  },
  pullToRefresh: {
    duration: motionTokens.duration.normal,
    easing: motionTokens.easing.decelerate,
  },
} as const;

export const colorOpacityTokens = {
  primary: primaryOpacityScale(semanticTokens.colors.primary.hex),
  secondary: softOpacityScale(semanticTokens.colors.sunLight.hex),
  accent: softOpacityScale(semanticTokens.colors.accent.hex),
  trust: softOpacityScale(semanticTokens.colors.trust.hex),
  verified: softOpacityScale(semanticTokens.colors.verified.hex),
  danger: dangerOpacityScale(semanticTokens.colors.danger.hex),
} as const;

export const contentRuleTokens = {
  mongolianCyrillic: {
    expansionFactor: 1.2,
    minBodySize: 16,
    minSecondarySize: 14,
    minNavSize: 11,
    lineHeightBody: 1.6,
    letterSpacing: 0,
    textAlignment: 'left',
    hyphenation: false,
  },
  maxLengths: {
    pageTitle: 30,
    cardTitle: 40,
    buttonLabel: 20,
    badgeText: 15,
    helperText: 80,
    description: 200,
    chatPreview: 50,
  },
  truncation: {
    method: 'word-boundary',
    indicator: '...',
    linesCardDescription: 2,
    linesChatPreview: 1,
  },
  currency: {
    format: '₮{amount}',
    thousandSeparator: ',',
    minimum: 1001,
    position: 'prefix',
  },
  dateFormat: {
    display: 'YYYY.MM.DD',
    relative: true,
    relativeThresholdHours: 24,
  },
} as const;

export type InteractionTokens = typeof interactionTokens;
export type OverlayTokens = typeof overlayTokens;
export type IconSizeTokens = typeof iconSizeTokens;
export type ElevationTokens = typeof elevationTokens;
export type TypographyVariantTokens = typeof typographyVariantTokens;
export type DensityTokens = typeof densityTokens;
export type AnimationPresetTokens = typeof animationPresetTokens;
export type ColorOpacityTokens = typeof colorOpacityTokens;
export type ContentRuleTokens = typeof contentRuleTokens;
