import { Platform, type ViewStyle } from 'react-native';
import { designTokens } from '@tasky/design-tokens';

const { shadows } = designTokens;

export const elevations = {
  none: {},
  card: {
    shadowColor: shadows.card.color,
    shadowOffset: shadows.card.offset,
    shadowOpacity: shadows.card.opacity,
    shadowRadius: shadows.card.radius,
    ...(Platform.OS === 'android' && { elevation: shadows.card.elevation }),
  },
  elevated: {
    shadowColor: shadows.elevated.color,
    shadowOffset: shadows.elevated.offset,
    shadowOpacity: shadows.elevated.opacity,
    shadowRadius: shadows.elevated.radius,
    ...(Platform.OS === 'android' && { elevation: shadows.elevated.elevation }),
  },
  navBar: {
    shadowColor: shadows.navBar.color,
    shadowOffset: shadows.navBar.offset,
    shadowOpacity: shadows.navBar.opacity,
    shadowRadius: shadows.navBar.radius,
    ...(Platform.OS === 'android' && { elevation: shadows.navBar.elevation }),
  },
} as const satisfies Record<string, ViewStyle>;

// Overlay scrims from design-system-additions.yaml — branded primaryDeep, not generic black
export const overlays = {
  modal: 'rgba(16, 38, 56, 0.50)',
  sheet: 'rgba(16, 38, 56, 0.35)',
  toast: 'rgba(16, 38, 56, 0.20)',
} as const;
