import { Platform } from 'react-native';
import { mobileTheme } from './tokenAdapter';

const { spacing, typography } = mobileTheme;

export const screenLayout = {
  /** Horizontal padding for all screen content */
  insetX: spacing.lg,

  header: {
    /** Top of screen to first element */
    topInset: spacing.xl,
    /** Greeting label to screen title */
    greetingGap: spacing.xs,
    /** Screen title to subtitle or first body content */
    titleGap: spacing.sm,
    /** Entire header block to body content below */
    bottomGap: spacing.xl,
  },

  body: {
    /** Between major sections (stats -> info -> trust banner) */
    sectionGap: spacing.xl,
    /** Between sibling elements within a section */
    blockGap: spacing.lg,
    /** Between tightly related items (card rows, form fields) */
    itemGap: spacing.md,
    /** Micro spacing (chip padding, icon-to-label) */
    microGap: spacing.xs,
    /** Standard card internal padding */
    cardPadding: spacing.lg,
  },

  actions: {
    /** Sticky action bar internal padding */
    barPadding: spacing.md,
    /** Gap between stacked buttons in an action bar */
    buttonGap: spacing.sm,
  },

  chrome: {
    /** Tab bar total height */
    tabBarHeight: Platform.OS === 'ios' ? 88 : 64,
    /** Tab bar bottom offset from screen edge */
    tabBarBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
    /** FAB diameter */
    fabSize: 60,
    /** FAB distance from right edge */
    fabInsetRight: spacing.lg,
    /** FAB bottom position — derived from tab bar geometry */
    get fabBottom() {
      return this.tabBarHeight + this.tabBarBottom + spacing.sm;
    },
    /** Minimum clearance for scrollable content — clears tab bar */
    get contentBottomClearance() {
      return this.tabBarHeight + this.tabBarBottom + spacing.md;
    },
  },

  wizard: {
    /** Progress bar segment gap */
    stepIndicatorGap: spacing.xs,
  },
} as const;

export const screenTypography = {
  greeting: {
    fontSize: typography.caption,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  screenTitle: {
    fontSize: typography.heroTitle,
    fontWeight: '900' as const,
  },
  sectionTitle: {
    fontSize: typography.heading,
    fontWeight: '800' as const,
    lineHeight: Math.round(typography.heading * 1.25),
  },
  cardTitle: {
    fontSize: typography.body,
    fontWeight: '700' as const,
    lineHeight: Math.round(typography.body * 1.35),
  },
} as const;
