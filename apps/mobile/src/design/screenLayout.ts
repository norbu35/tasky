import { Platform } from 'react-native';

import { mobileTheme } from './theme';

const { spacing } = mobileTheme;

export const screenLayout = {
  /** Horizontal padding for all screen content */
  insetX: spacing.lg,

  header: {
    /** Minimum height for screen header rows */
    minHeight: 56,
    /** Top of screen to first element */
    topInset: spacing['2xl'],
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
    tabBarHeight: Platform.OS === 'ios' ? 64 : 58,
    /** Tab bar fixed gap above safe area zone (components add insets.bottom on top) */
    tabBarBottom: 8,
    /** Tab icon size */
    tabIconSize: 24,
    /** Tab button pill height */
    tabButtonHeight: 72,
    /** Tab button pill radius */
    tabButtonRadius: 20,
    /** Tab button horizontal margin */
    tabButtonInsetX: spacing.md,
    /** Tab bar horizontal padding */
    tabBarInsetX: spacing.sm,
    /** Tab bar top/bottom padding before safe-area adjustment */
    tabBarInsetY: spacing.xs,
    /** Tab bar frosted surface tint */
    tabBarSurfaceOpacity: 0.92,
    /** FAB diameter */
    fabSize: 52,
    /** FAB icon size */
    fabIconSize: 24,
    /** FAB distance from right edge */
    fabInsetRight: spacing.lg,
    /** FAB distance from top edge */
    fabInsetTop: spacing.md,
    /** FAB bottom position — derived from tab bar geometry */
    get fabBottom() {
      return this.tabBarHeight + this.tabBarBottom + spacing.sm;
    },
    /**
     * Minimum clearance for scrollable content — clears the tab bar.
     *
     * This value does NOT include the device's system navigation bar inset
     * (useSafeAreaInsets().bottom). Callers inside a tab navigator should add
     * that inset themselves so content scrolls fully above the tab bar on
     * Android button-nav devices.
     */
    get contentBottomClearance() {
      return this.tabBarHeight + this.tabBarBottom + spacing.md;
    },
  },

  wizard: {
    /** Progress bar segment gap */
    stepIndicatorGap: spacing.xs,
  },
} as const;
