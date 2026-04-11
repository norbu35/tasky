import type { Config } from 'tailwindcss';
import { webTokens } from '@tasky/design-tokens';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        'primary-deep': 'hsl(var(--primary-deep))',
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        trust: {
          DEFAULT: 'hsl(var(--trust))',
          foreground: 'hsl(var(--trust-foreground))',
          muted: 'hsl(var(--trust-muted))',
        },
        status: {
          open: 'hsl(var(--status-open))',
          'open-foreground': 'hsl(var(--status-open-foreground))',
          assigned: 'hsl(var(--status-assigned))',
          'assigned-foreground': 'hsl(var(--status-assigned-foreground))',
        },
        verified: 'hsl(var(--verified))',
        'subtle-violet': 'hsl(var(--subtle-violet))',
        'chip-inactive': 'hsl(var(--chip-inactive))',
        'text-secondary': 'hsl(var(--text-secondary))',
        'text-tertiary': 'hsl(var(--text-tertiary))',
        'nav-inactive': 'hsl(var(--nav-inactive))',
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
