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
    tabBarHeight: Platform.OS === 'ios' ? 96 : 76,
    /** Tab bar bottom offset from screen edge */
    tabBarBottom: 0,
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
