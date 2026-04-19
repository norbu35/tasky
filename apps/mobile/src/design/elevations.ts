import { Platform, type ViewStyle } from 'react-native';

import { nativeTokens, semanticTokens } from '@tasky/design-tokens';

const { shadows } = nativeTokens;
const primaryDeep = semanticTokens.colors.primaryDeep.hex;

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(2)})`;
};

export const elevations = {
  none: {},
  soft: {
    shadowColor: '#1a1c1a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    ...(Platform.OS === 'android' && { elevation: 2 }),
  },
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
  fab: {
    shadowColor: shadows.fab.color,
    shadowOffset: shadows.fab.offset,
    shadowOpacity: shadows.fab.opacity,
    shadowRadius: shadows.fab.radius,
    ...(Platform.OS === 'android' && { elevation: shadows.fab.elevation }),
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
  modal: hexToRgba(primaryDeep, 0.5),
  sheet: hexToRgba(primaryDeep, 0.35),
  toast: hexToRgba(primaryDeep, 0.2),
} as const;
