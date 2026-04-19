const palette = {
  canvas: { hsl: '40 25% 97%', hex: '#F9F8F5' },
  ink: { hsl: '211.5 48% 23.3%', hex: '#1B3A5C' },
  surface: { hsl: '0 0% 100%', hex: '#FFFFFF' },
  inkDeep: { hsl: '212 55% 14%', hex: '#102638' },
  sun: { hsl: '42.9 74.8% 31.2%', hex: '#8B6914' },
  sky: { hsl: '199.6 38.9% 58.2%', hex: '#6BA3BE' },
  line: { hsl: '210 18% 82%', hex: '#C7D0D9' },
  field: { hsl: '210 15% 88%', hex: '#DBE0E5' },
  danger: { hsl: '0 84% 60%', hex: '#EF4444' },
  trust: { hsl: '211 50% 42%', hex: '#3568A1' },
  trustMuted: { hsl: '211 30% 78%', hex: '#B3C4D6' },
  subtle: { hsl: '40 20% 94%', hex: '#F3F1EC' },
  mutedText: { hsl: '211 15% 40%', hex: '#576473' },
  statusOpen: { hsl: '40 18% 91%', hex: '#EDE9E2' },
  statusOpenForeground: { hsl: '211 12% 45%', hex: '#657381' },
  statusAssigned: { hsl: '211.5 48% 23.3%', hex: '#1B3A5C' },
  statusAssignedForeground: { hsl: '0 0% 100%', hex: '#FFFFFF' },
  verified: { hsl: '160 35% 42%', hex: '#469178' },
  chipInactive: { hsl: '210 14% 87%', hex: '#D8DDE2' },
  textSecondary: { hsl: '211 12% 42%', hex: '#5E6B78' },
  textTertiary: { hsl: '210 10% 55%', hex: '#808D99' },
  navInactive: { hsl: '210 12% 48%', hex: '#6C7B89' },
  sunLight: { hsl: '38 52% 50%', hex: '#C49A3C' },
  sunWash: { hsl: '42 97% 71%', hex: '#FDCE6A' },
  skySoft: { hsl: '205 51% 80%', hex: '#ABD1E8' },
  statusCompleted: { hsl: '160 34% 42%', hex: '#469178' },
  statusCompletedForeground: { hsl: '0 0% 100%', hex: '#FFFFFF' },
  statusCancelled: { hsl: '36 20% 94%', hex: '#F3F1EC' },
  statusCancelledForeground: { hsl: '210 13% 39%', hex: '#576473' },
} as const;

const spacingScale = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

const radiusScale = {
  none: 0,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

const typography = {
  families: {
    sans: {
      web: "'Plus Jakarta Sans', Roboto, system-ui, -apple-system, sans-serif",
      native: 'PlusJakartaSans_400Regular',
    },
    sansMedium: {
      web: "'Plus Jakarta Sans', Roboto, system-ui, -apple-system, sans-serif",
      native: 'PlusJakartaSans_500Medium',
    },
    sansSemibold: {
      web: "'Plus Jakarta Sans', Roboto, system-ui, -apple-system, sans-serif",
      native: 'PlusJakartaSans_600SemiBold',
    },
    sansBold: {
      web: "'Plus Jakarta Sans', Roboto, system-ui, -apple-system, sans-serif",
      native: 'PlusJakartaSans_700Bold',
    },
    display: {
      web: "'Manrope', Roboto, system-ui, -apple-system, sans-serif",
      native: 'Manrope_600SemiBold',
    },
    displayBold: {
      web: "'Manrope', Roboto, system-ui, -apple-system, sans-serif",
      native: 'Manrope_700Bold',
    },
  },
  fontSizes: {
    heroTitle: 30,
    heading: 24,
    title: 20,
    subtitle: 18,
    body: 16,
    label: 14,
    caption: 12,
    micro: 10,
    navLabel: 11,
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    tight: 1.3,
    normal: 1.6,
    loose: 1.8,
  },
  letterSpacing: {
    tight: -0.01,
    normal: 0,
  },
  minBodySize: 16,
} as const;

const shadows = {
  card: {
    color: '#000000',
    offset: { width: 0, height: 1 },
    opacity: 0.05,
    radius: 2,
    elevation: 1,
  },
  elevated: {
    color: '#000000',
    offset: { width: 0, height: 4 },
    opacity: 0.1,
    radius: 6,
    elevation: 3,
  },
  navBar: {
    color: '#1A1C1C',
    offset: { width: 0, height: -4 },
    opacity: 0.04,
    radius: 24,
    elevation: 4,
  },
  fab: {
    color: '#000000',
    offset: { width: 0, height: 4 },
    opacity: 0.1,
    radius: 6,
    elevation: 4,
  },
  deep: {
    color: '#000000',
    offset: { width: 0, height: 25 },
    opacity: 0.25,
    radius: 50,
    elevation: 24,
  },
} as const;

export const primitiveTokens = {
  palette,
  spacingScale,
  radiusScale,
  typography,
  shadows,
} as const;

export type PrimitiveTokens = typeof primitiveTokens;
