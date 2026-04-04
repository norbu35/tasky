import { mobileTheme } from './tokenAdapter';

const { spacing, typography } = mobileTheme;

export const screenRhythm = {
  contentInsetX: spacing.lg,
  contentInsetTop: spacing.xl,
  sectionGap: spacing.xl,
  blockGap: spacing.lg,
  itemGap: spacing.md,
  microGap: spacing.xs,
  cardPadding: spacing.lg,
  stickyBarPadding: spacing.md,
  stepIndicatorGap: spacing.xs,
} as const;

export const screenTypography = {
  sectionTitleSize: typography.heading,
  sectionTitleLineHeight: Math.round(typography.heading * 1.25),
  cardTitleSize: typography.body,
  cardTitleLineHeight: Math.round(typography.body * 1.35),
} as const;
