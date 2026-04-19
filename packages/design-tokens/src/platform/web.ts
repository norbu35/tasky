import { semanticTokens } from '../semantic';

const px = (value: number) => `${value}px`;
const em = (value: number) => `${value}em`;

const webSpacing = {
  xs: px(semanticTokens.spacing.xs),
  sm: px(semanticTokens.spacing.sm),
  md: px(semanticTokens.spacing.md),
  lg: px(semanticTokens.spacing.lg),
  xl: px(semanticTokens.spacing.xl),
  '2xl': px(semanticTokens.spacing['2xl']),
  '3xl': px(semanticTokens.spacing['3xl']),
} as const;

const webRadius = {
  xs: px(semanticTokens.radius.xs),
  sm: px(semanticTokens.radius.sm),
  md: px(semanticTokens.radius.md),
  lg: px(semanticTokens.radius.lg),
  full: px(semanticTokens.radius.full),
} as const;

const webTypography = {
  fontFamily: {
    sans: semanticTokens.typography.families.sans.web,
    display: semanticTokens.typography.families.display.web,
  },
  fontSize: {
    heroTitle: px(semanticTokens.typography.fontSizes.heroTitle),
    heading: px(semanticTokens.typography.fontSizes.heading),
    title: px(semanticTokens.typography.fontSizes.title),
    subtitle: px(semanticTokens.typography.fontSizes.subtitle),
    body: px(semanticTokens.typography.fontSizes.body),
    label: px(semanticTokens.typography.fontSizes.label),
    caption: px(semanticTokens.typography.fontSizes.caption),
    micro: px(semanticTokens.typography.fontSizes.micro),
    navLabel: px(semanticTokens.typography.fontSizes.navLabel),
  },
  fontWeight: semanticTokens.typography.weights,
  lineHeight: {
    tight: `${semanticTokens.typography.lineHeights.tight}`,
    normal: `${semanticTokens.typography.lineHeights.normal}`,
    loose: `${semanticTokens.typography.lineHeights.loose}`,
  },
  letterSpacing: {
    tight: em(semanticTokens.typography.letterSpacing.tight),
    normal: em(semanticTokens.typography.letterSpacing.normal),
  },
  minBodySize: px(semanticTokens.typography.minBodySize),
} as const;

const cssVariables = {
  '--color-background': semanticTokens.colors.background.hsl,
  '--color-foreground': semanticTokens.colors.foreground.hsl,
  '--color-card': semanticTokens.colors.card.hsl,
  '--color-card-fg': semanticTokens.colors.cardForeground.hsl,
  '--color-popover': semanticTokens.colors.popover.hsl,
  '--color-popover-fg': semanticTokens.colors.popoverForeground.hsl,
  '--color-primary': semanticTokens.colors.primary.hsl,
  '--color-primary-fg': semanticTokens.colors.primaryForeground.hsl,
  '--color-primary-deep': semanticTokens.colors.primaryDeep.hsl,
  '--color-secondary': semanticTokens.colors.secondary.hsl,
  '--color-secondary-fg': semanticTokens.colors.secondaryForeground.hsl,
  '--color-muted': semanticTokens.colors.muted.hsl,
  '--color-muted-fg': semanticTokens.colors.mutedForeground.hsl,
  '--color-accent': semanticTokens.colors.accent.hsl,
  '--color-accent-fg': semanticTokens.colors.accentForeground.hsl,
  '--color-border': semanticTokens.colors.border.hsl,
  '--color-input': semanticTokens.colors.input.hsl,
  '--color-ring': semanticTokens.colors.ring.hsl,
  '--color-destructive': semanticTokens.colors.destructive.hsl,
  '--color-destructive-fg': semanticTokens.colors.destructiveForeground.hsl,
  '--color-trust': semanticTokens.colors.trust.hsl,
  '--color-trust-fg': semanticTokens.colors.trustForeground.hsl,
  '--color-trust-muted': semanticTokens.colors.trustMuted.hsl,
  '--color-status-open': semanticTokens.colors.statusOpen.hsl,
  '--color-status-open-fg': semanticTokens.colors.statusOpenForeground.hsl,
  '--color-status-assigned': semanticTokens.colors.statusAssigned.hsl,
  '--color-status-assigned-fg': semanticTokens.colors.statusAssignedForeground.hsl,
  '--color-status-completed': semanticTokens.colors.statusCompleted.hsl,
  '--color-status-completed-fg': semanticTokens.colors.statusCompletedForeground.hsl,
  '--color-status-cancelled': semanticTokens.colors.statusCancelled.hsl,
  '--color-status-cancelled-fg': semanticTokens.colors.statusCancelledForeground.hsl,
  '--color-verified': semanticTokens.colors.verified.hsl,
  '--color-subtle-violet': semanticTokens.colors.subtleViolet.hsl,
  '--color-chip-inactive': semanticTokens.colors.chipInactive.hsl,
  '--color-text-secondary': semanticTokens.colors.textSecondary.hsl,
  '--color-text-tertiary': semanticTokens.colors.textTertiary.hsl,
  '--color-nav-inactive': semanticTokens.colors.navInactive.hsl,
  '--color-sun-light': semanticTokens.colors.sunLight.hsl,
  '--color-sun-wash': semanticTokens.colors.sunWash.hsl,
  '--color-sky-soft': semanticTokens.colors.skySoft.hsl,
  '--radius': webRadius.md,
  '--font-family-sans': webTypography.fontFamily.sans,
  '--font-family-display': webTypography.fontFamily.display,
  '--font-size-body': webTypography.fontSize.body,
} as const;

export const webTokens = {
  colors: semanticTokens.colors,
  spacing: webSpacing,
  radius: webRadius,
  typography: webTypography,
  cssVariables,
} as const;

export type WebTokens = typeof webTokens;
