export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
};

export const radius = {
  none: '0px',
  sm: '2px',
  DEFAULT: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
};

export const typography = {
  fontFamily: {
    sans: "'Plus Jakarta Sans', Roboto, system-ui, -apple-system, sans-serif",
    display: "'Manrope', Roboto, system-ui, -apple-system, sans-serif",
    // Roboto is listed as fallback for full Mongolian Cyrillic glyph support (Ү/Ө)
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  // Cyrillic-optimized spacing — more generous than Latin defaults
  lineHeight: {
    tight: '1.3',
    normal: '1.6',   // body text; prevents Cyrillic "fence" letterforms from colliding
    loose: '1.8',
  },
  letterSpacing: {
    tight: '-0.01em',
    normal: '0em',
    // never use wide tracking on Cyrillic body text
  },
  minBodySize: '16px',  // strict accessibility floor per research
};
