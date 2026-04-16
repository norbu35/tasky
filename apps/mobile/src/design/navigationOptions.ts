import { mobileTheme } from './theme';

export const defaultStackScreenOptions = {
  headerStyle: {
    backgroundColor: mobileTheme.colors.background,
  },
  headerTintColor: mobileTheme.colors.primary,
  headerTitleStyle: {
    fontWeight: '700' as const,
    fontSize: mobileTheme.typography.subtitle,
  },
  headerShadowVisible: false,
};

/**
 * Use for screens presented as slides-up/modal sheets.
 * Inherits the same visual tokens, but swaps the dismiss gesture
 * style so iOS renders a "Close" label-less × instead of a back chevron.
 */
export const modalStackScreenOptions = {
  ...defaultStackScreenOptions,
  presentation: 'modal' as const,
};
