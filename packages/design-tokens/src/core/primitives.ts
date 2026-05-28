const palette = {
  canvas: { hsl: '0 0% 98%', hex: '#FAFAFA' },
  ink: { hsl: '215 28% 11%', hex: '#111827' },
  surface: { hsl: '0 0% 100%', hex: '#FFFFFF' },
  inkDeep: { hsl: '224 71% 4%', hex: '#030712' },
  sun: { hsl: '25 95% 53%', hex: '#F97316' }, // Vivid Orange/Amber
  sky: { hsl: '199 89% 48%', hex: '#0EA5E9' },
  line: { hsl: '220 13% 91%', hex: '#E5E7EB' },
  field: { hsl: '210 40% 96%', hex: '#F1F5F9' },
  danger: { hsl: '348 83% 47%', hex: '#E11D48' },
  trust: { hsl: '221 83% 53%', hex: '#2563EB' }, // Trustworthy vibrant Blue
  trustMuted: { hsl: '221 83% 80%', hex: '#93C5FD' },
  subtle: { hsl: '210 40% 98%', hex: '#F8FAFC' },
  mutedText: { hsl: '215 16% 47%', hex: '#6B7280' },
  statusOpen: { hsl: '221 83% 96%', hex: '#EFF6FF' },
  statusOpenForeground: { hsl: '221 83% 45%', hex: '#1D4ED8' },
  statusAssigned: { hsl: '33 100% 94%', hex: '#FEF3C7' },
  statusAssignedForeground: { hsl: '32 95% 44%', hex: '#EA580C' },
  verified: { hsl: '158 64% 42%', hex: '#10B981' }, // Emerald
  chipInactive: { hsl: '220 13% 91%', hex: '#E5E7EB' },
  textSecondary: { hsl: '215 16% 47%', hex: '#6B7280' },
  textTertiary: { hsl: '215 20% 65%', hex: '#9CA3AF' },
  navInactive: { hsl: '215 16% 47%', hex: '#6B7280' },
  sunLight: { hsl: '32 95% 44%', hex: '#EA580C' },
  sunWash: { hsl: '33 100% 88%', hex: '#FFEDD5' },
  skySoft: { hsl: '200 98% 84%', hex: '#BAE6FD' },
  statusCompleted: { hsl: '158 64% 94%', hex: '#ECFDF5' },
  statusCompletedForeground: { hsl: '158 64% 35%', hex: '#047857' },
  statusCancelled: { hsl: '220 14% 96%', hex: '#F3F4F6' },
  statusCancelledForeground: { hsl: '215 16% 47%', hex: '#6B7280' },
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
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

const typography = {
  families: {
    sans: {
      web: "'Inter', 'Plus Jakarta Sans', Roboto, system-ui, -apple-system, sans-serif",
      native: 'PlusJakartaSans_400Regular',
    },
    sansMedium: {
      web: "'Inter', 'Plus Jakarta Sans', Roboto, system-ui, -apple-system, sans-serif",
      native: 'PlusJakartaSans_500Medium',
    },
    sansSemibold: {
      web: "'Inter', 'Plus Jakarta Sans', Roboto, system-ui, -apple-system, sans-serif",
      native: 'PlusJakartaSans_600SemiBold',
    },
    sansBold: {
      web: "'Inter', 'Plus Jakarta Sans', Roboto, system-ui, -apple-system, sans-serif",
      native: 'PlusJakartaSans_700Bold',
    },
    display: {
      web: "'Outfit', 'Manrope', Roboto, system-ui, -apple-system, sans-serif",
      native: 'Manrope_600SemiBold',
    },
    displayBold: {
      web: "'Outfit', 'Manrope', Roboto, system-ui, -apple-system, sans-serif",
      native: 'Manrope_700Bold',
    },
  },
  fontSizes: {
    displayXl: 56,
    displayLg: 48,
    heading1: 32,
    heading2: 24,
    heading3: 20,
    heroTitle: 64,
    heading: 28,
    title: 22,
    subtitle: 18,
    bodyLg: 18,
    body: 16,
    bodySm: 14,
    label: 14,
    labelUi: 13,
    caption: 12,
    overline: 11,
    micro: 10,
    navLabel: 12,
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.7,
  },
  letterSpacing: {
    tight: 0,
    normal: 0,
    caps: 0.05,
  },
  minBodySize: 16,
} as const;

const shadows = {
  card: {
    color: '#000000',
    offset: { width: 0, height: 2 },
    opacity: 0.04,
    radius: 4,
    elevation: 1,
  },
  elevated: {
    color: '#000000',
    offset: { width: 0, height: 8 },
    opacity: 0.06,
    radius: 16,
    elevation: 3,
  },
  navBar: {
    color: '#000000',
    offset: { width: 0, height: 1 },
    opacity: 0.03,
    radius: 0,
    elevation: 1,
  },
  fab: {
    color: '#000000',
    offset: { width: 0, height: 6 },
    opacity: 0.1,
    radius: 12,
    elevation: 4,
  },
  deep: {
    color: '#000000',
    offset: { width: 0, height: 20 },
    opacity: 0.12,
    radius: 40,
    elevation: 12,
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
