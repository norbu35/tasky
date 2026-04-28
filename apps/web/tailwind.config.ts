import type { Config } from 'tailwindcss';

import { webTokens } from '@tasky/design-tokens';

const config: Config = {
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
        verified: {
          DEFAULT: 'hsl(var(--color-verified))',
          foreground: 'hsl(var(--color-verified-fg))',
        },
        'subtle-violet': 'hsl(var(--color-subtle-violet))',
        'chip-inactive': 'hsl(var(--color-chip-inactive))',
        'text-secondary': 'hsl(var(--color-text-secondary))',
        'text-tertiary': 'hsl(var(--color-text-tertiary))',
        'nav-inactive': 'hsl(var(--color-nav-inactive))',
        'sun-light': 'hsl(var(--color-sun-light))',
        'sun-wash': 'hsl(var(--color-sun-wash))',
        'sky-soft': 'hsl(var(--color-sky-soft))',
        'primary-10': 'var(--color-primary-10)',
        'secondary-10': 'var(--color-secondary-10)',
        'accent-10': 'var(--color-accent-10)',
        'trust-10': 'var(--color-trust-10)',
        'verified-10': 'var(--color-verified-10)',
        'danger-10': 'var(--color-danger-10)',
      },
      borderRadius: {
        xs: webTokens.radius.xs,
        sm: webTokens.radius.sm,
        md: webTokens.radius.md,
        lg: webTokens.radius.lg,
        xl: webTokens.radius.lg,
        '2xl': webTokens.radius.lg,
        full: webTokens.radius.full,
      },
      fontFamily: {
        sans: [webTokens.typography.fontFamily.sans],
        display: [webTokens.typography.fontFamily.display],
      },
      fontSize: {
        'display-xl': ['var(--font-size-display-xl)', { lineHeight: 'var(--line-height-tight)' }],
        'display-lg': ['var(--font-size-display-lg)', { lineHeight: 'var(--line-height-tight)' }],
        'heading-1': ['var(--font-size-heading-1)', { lineHeight: 'var(--line-height-tight)' }],
        'heading-2': ['var(--font-size-heading-2)', { lineHeight: 'var(--line-height-tight)' }],
        'heading-3': ['var(--font-size-heading-3)', { lineHeight: 'var(--line-height-tight)' }],
        'body-lg': ['var(--font-size-body-lg)', { lineHeight: 'var(--line-height-normal)' }],
        body: ['var(--font-size-body)', { lineHeight: 'var(--line-height-normal)' }],
        'body-sm': ['var(--font-size-body-sm)', { lineHeight: 'var(--line-height-normal)' }],
        label: ['var(--font-size-label)', { lineHeight: 'var(--line-height-tight)' }],
        ui: ['var(--font-size-label-ui)', { lineHeight: '1' }],
        nav: ['var(--font-size-nav)', { lineHeight: '1' }],
        overline: [
          'var(--font-size-overline)',
          { lineHeight: 'var(--line-height-tight)', letterSpacing: 'var(--letter-spacing-caps)' },
        ],
        'hero-title': [
          'var(--typography-hero-title-font-size)',
          {
            lineHeight: 'var(--typography-hero-title-line-height)',
            letterSpacing: 'var(--typography-hero-title-letter-spacing)',
          },
        ],
        'page-heading': [
          'var(--typography-page-heading-font-size)',
          {
            lineHeight: 'var(--typography-page-heading-line-height)',
            letterSpacing: 'var(--typography-page-heading-letter-spacing)',
          },
        ],
        'card-title': [
          'var(--typography-card-title-font-size)',
          {
            lineHeight: 'var(--typography-card-title-line-height)',
            letterSpacing: 'var(--typography-card-title-letter-spacing)',
          },
        ],
        'section-heading': [
          'var(--typography-section-heading-font-size)',
          {
            lineHeight: 'var(--typography-section-heading-line-height)',
            letterSpacing: 'var(--typography-section-heading-letter-spacing)',
          },
        ],
        'body-default': [
          'var(--typography-body-default-font-size)',
          {
            lineHeight: 'var(--typography-body-default-line-height)',
            letterSpacing: 'var(--typography-body-default-letter-spacing)',
          },
        ],
        'body-emphasis': [
          'var(--typography-body-emphasis-font-size)',
          {
            lineHeight: 'var(--typography-body-emphasis-line-height)',
            letterSpacing: 'var(--typography-body-emphasis-letter-spacing)',
          },
        ],
        'button-label': [
          'var(--typography-button-label-font-size)',
          {
            lineHeight: 'var(--typography-button-label-line-height)',
            letterSpacing: 'var(--typography-button-label-letter-spacing)',
          },
        ],
        'nav-label': [
          'var(--typography-nav-label-font-size)',
          {
            lineHeight: 'var(--typography-nav-label-line-height)',
            letterSpacing: 'var(--typography-nav-label-letter-spacing)',
          },
        ],
        'badge-text': [
          'var(--typography-badge-text-font-size)',
          {
            lineHeight: 'var(--typography-badge-text-line-height)',
            letterSpacing: 'var(--typography-badge-text-letter-spacing)',
          },
        ],
        'price-display': [
          'var(--typography-price-display-font-size)',
          {
            lineHeight: 'var(--typography-price-display-line-height)',
            letterSpacing: 'var(--typography-price-display-letter-spacing)',
          },
        ],
        caption: [
          'var(--typography-caption-font-size)',
          {
            lineHeight: 'var(--typography-caption-line-height)',
            letterSpacing: 'var(--typography-caption-letter-spacing)',
          },
        ],
      },
      letterSpacing: {
        normal: 'var(--letter-spacing-normal)',
        caps: 'var(--letter-spacing-caps)',
        'page-heading': 'var(--typography-page-heading-letter-spacing)',
        'section-heading': 'var(--typography-section-heading-letter-spacing)',
        'card-title': 'var(--typography-card-title-letter-spacing)',
      },
      opacity: {
        pressed: 'var(--interaction-pressed-opacity)',
        hover: 'var(--interaction-hover-opacity)',
        disabled: 'var(--interaction-disabled-opacity)',
      },
      scale: {
        pressed: 'var(--interaction-pressed-scale)',
      },
      zIndex: {
        base: 'var(--z-base)',
        sticky: 'var(--z-sticky)',
        dropdown: 'var(--z-dropdown)',
        sheet: 'var(--z-sheet)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
        system: 'var(--z-system)',
      },
      spacing: {
        'icon-xs': webTokens.iconSizes.xs,
        'icon-sm': webTokens.iconSizes.sm,
        'icon-md': webTokens.iconSizes.md,
        'icon-lg': webTokens.iconSizes.lg,
        'icon-xl': webTokens.iconSizes.xl,
        navigation: webTokens.iconSizes.semantic.navigation,
        'tab-bar': webTokens.iconSizes.semantic.tabBar,
        'avatar-badge': webTokens.iconSizes.semantic.avatarBadge,
        'input-icon': webTokens.iconSizes.semantic.inputIcon,
        fab: webTokens.iconSizes.semantic.fab,
        'status-icon': webTokens.iconSizes.semantic.status,
        'touch-target-min': webTokens.iconSizes.touchTargetMin,
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        fab: 'var(--shadow-fab)',
        nav: 'var(--shadow-nav)',
        deep: 'var(--shadow-deep)',
        modal: webTokens.elevation.modal.shadow,
        sheet: webTokens.elevation.sheet.shadow,
      },
      transitionDuration: {
        'card-expand': 'var(--animation-card-expand-duration)',
        'sheet-open': 'var(--animation-sheet-open-duration)',
        'sheet-close': 'var(--animation-sheet-close-duration)',
        'badge-pop': 'var(--animation-badge-pop-duration)',
        'toast-slide-in': 'var(--animation-toast-slide-in-duration)',
        'toast-slide-out': 'var(--animation-toast-slide-out-duration)',
        'skeleton-pulse': 'var(--animation-skeleton-pulse-duration)',
      },
      transitionTimingFunction: {
        'card-expand': 'var(--animation-card-expand-easing)',
        'sheet-open': 'var(--animation-sheet-open-easing)',
        'sheet-close': 'var(--animation-sheet-close-easing)',
        'badge-pop': 'var(--animation-badge-pop-easing)',
        'toast-slide-in': 'var(--animation-toast-slide-in-easing)',
        'toast-slide-out': 'var(--animation-toast-slide-out-easing)',
        'skeleton-pulse': 'var(--animation-skeleton-pulse-easing)',
      },
    },
  },
  plugins: [],
};

export default config;
