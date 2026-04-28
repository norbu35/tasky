import { nativeTokens } from '@tasky/design-tokens';

import { mobileTheme, withAlpha } from './theme';

const { colors } = mobileTheme;
const colorOpacity = nativeTokens.colorOpacity;
const iconSizes = nativeTokens.iconSizes;
const contentRules = nativeTokens.contentRules;

export const mobileSurfaces = {
  tint: {
    primarySubtle: colorOpacity.primary[10],
    primarySoft: colorOpacity.primary[15],
    primaryStrong: colorOpacity.primary[20],
    primaryForegroundSoft: withAlpha(colors.primaryForeground, 0.1),
    primaryForegroundMuted: colorOpacity.primary[60],
    dangerSoft: colorOpacity.danger[10],
    dangerSubtle: colorOpacity.danger[10],
    dangerMedium: colorOpacity.danger[15],
    trustSoft: colorOpacity.trust[15],
    verifiedSoft: colorOpacity.verified[10],
    categoryPill: colorOpacity.primary[15],
    borderSoft: withAlpha(colors.border, 0.5),
  },
  onboarding: {
    illustrationCard: {
      width: 326,
      height: 407,
      radius: 32,
      rotation: '-3deg',
      iconSize: iconSizes.md,
      badgeOffset: 24,
    },
    pagination: {
      height: 3,
      activeWidth: 10,
      inactiveWidth: 6,
    },
    skipSpacer: {
      width: 56,
      height: 24,
    },
  },
  splash: {
    brandSize: 56,
    markBox: 64,
    markRadius: 16,
    markIcon: iconSizes.md,
    markBorder: withAlpha(colors.primaryForeground, 0.12),
    markSurface: withAlpha(colors.primaryForeground, 0.08),
    progressRailWidth: 136,
    progressRailHeight: 2,
    progressFillWidth: 42,
    progressSurface: withAlpha(colors.primaryForeground, 0.16),
    footerText: withAlpha(colors.primaryForeground, 0.72),
    footerBottom: 64,
    loaderBottom: 28,
  },
  taskDetail: {
    labelTracking: 1.05,
    sectionTracking: 0.9,
    budgetLineHeight: 40,
    pillMinWidth: 28,
    pillInsetX: 8,
    pillInsetY: 4,
    photoTileHeight: 163,
    photoTileWidth: '48%',
  },
  bookingList: {
    railHeight: 1,
    skeletonAvatar: 40,
    skeletonTitleWidth: '72%',
    skeletonSubtitleWidth: '48%',
    skeletonPillWidth: 72,
    skeletonPillHeight: 24,
    skeletonMetaWidth: '42%',
    skeletonPriceWidth: 72,
    skeletonPriceHeight: 16,
    headerIconBox: 40,
    emptyIconBox: 64,
    ctaHeight: 48,
    statusTracking: 0.6,
  },
  permissionPrimer: {
    topIllustrationSize: 128,
    sheetHandleWidth: 40,
    sheetHandleHeight: 4,
    iconPreviewSize: 96,
    badgeOffset: -8,
    badgeSize: 32,
    badgeBorder: 4,
    titleSize: 24,
    titleTracking: contentRules.mongolianCyrillic.letterSpacing,
    bodyLineHeight: 24,
    hintLineHeight: 20,
    footerLineHeight: 18,
    buttonHeight: 56,
  },
  bookingTimeline: {
    dotSize: 24,
    railWidth: 2,
    railMinHeight: 28,
    railOffset: -1,
    cardIconBox: 64,
    helpCtaHeight: 48,
    titleTracking: 0.8,
  },
  bookingConfirmed: {
    navIconBox: 40,
    heroSize: 96,
    nextStepIconBox: 40,
    providerAvatarBox: 48,
    primaryCtaHeight: 52,
    bottomGlowHeight: 80,
    bottomGlowRadius: 40,
  },
  iconButton: {
    sm: 40,
    md: iconSizes.touchTargetMin,
    lg: 44,
  },
  statusHero: {
    iconBox: 72,
  },
  paragraphLineHeight: 24,
  touchTarget: {
    ctaHeight: 48,
  },
} as const;

export type MobileSurfaces = typeof mobileSurfaces;
