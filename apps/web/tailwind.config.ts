import type { Config } from 'tailwindcss';

import { webTokens } from '@tasky/design-tokens';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--color-border))',
        input: 'hsl(var(--color-input))',
        ring: 'hsl(var(--color-ring))',
        background: 'hsl(var(--color-background))',
        foreground: 'hsl(var(--color-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--color-primary))',
          foreground: 'hsl(var(--color-primary-fg))',
        },
        'primary-deep': 'hsl(var(--color-primary-deep))',
        secondary: {
          DEFAULT: 'hsl(var(--color-secondary))',
          foreground: 'hsl(var(--color-secondary-fg))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--color-destructive))',
          foreground: 'hsl(var(--color-destructive-fg))',
        },
        muted: {
          DEFAULT: 'hsl(var(--color-muted))',
          foreground: 'hsl(var(--color-muted-fg))',
        },
        accent: {
          DEFAULT: 'hsl(var(--color-accent))',
          foreground: 'hsl(var(--color-accent-fg))',
        },
        card: {
          DEFAULT: 'hsl(var(--color-card))',
          foreground: 'hsl(var(--color-card-fg))',
        },
        popover: {
          DEFAULT: 'hsl(var(--color-popover))',
          foreground: 'hsl(var(--color-popover-fg))',
        },
        trust: {
          DEFAULT: 'hsl(var(--color-trust))',
          foreground: 'hsl(var(--color-trust-fg))',
          muted: 'hsl(var(--color-trust-muted))',
        },
        status: {
          open: 'hsl(var(--color-status-open))',
          'open-fg': 'hsl(var(--color-status-open-fg))',
          assigned: 'hsl(var(--color-status-assigned))',
          'assigned-fg': 'hsl(var(--color-status-assigned-fg))',
          completed: 'hsl(var(--color-status-completed))',
          'completed-fg': 'hsl(var(--color-status-completed-fg))',
          cancelled: 'hsl(var(--color-status-cancelled))',
          'cancelled-fg': 'hsl(var(--color-status-cancelled-fg))',
        },
        verified: 'hsl(var(--color-verified))',
        'subtle-violet': 'hsl(var(--color-subtle-violet))',
        'chip-inactive': 'hsl(var(--color-chip-inactive))',
        'text-secondary': 'hsl(var(--color-text-secondary))',
        'text-tertiary': 'hsl(var(--color-text-tertiary))',
        'nav-inactive': 'hsl(var(--color-nav-inactive))',
        'sun-light': 'hsl(var(--color-sun-light))',
        'sun-wash': 'hsl(var(--color-sun-wash))',
        'sky-soft': 'hsl(var(--color-sky-soft))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: webTokens.radius.md,
        '2xl': webTokens.radius.lg,
        full: webTokens.radius.full,
      },
      fontFamily: {
        sans: [webTokens.typography.fontFamily.sans],
        display: [webTokens.typography.fontFamily.display],
      },
    },
  },
  plugins: [],
};

export default config;
