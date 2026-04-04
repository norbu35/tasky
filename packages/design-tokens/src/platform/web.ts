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
  '--tasky-color-background': semanticTokens.colors.background.hsl,
  '--tasky-color-foreground': semanticTokens.colors.foreground.hsl,
  '--tasky-color-card': semanticTokens.colors.card.hsl,
  '--tasky-color-card-foreground': semanticTokens.colors.cardForeground.hsl,
  '--tasky-color-popover': semanticTokens.colors.popover.hsl,
  '--tasky-color-popover-foreground': semanticTokens.colors.popoverForeground.hsl,
  '--tasky-color-primary': semanticTokens.colors.primary.hsl,
  '--tasky-color-primary-foreground': semanticTokens.colors.primaryForeground.hsl,
  '--tasky-color-primary-deep': semanticTokens.colors.primaryDeep.hsl,
  '--tasky-color-secondary': semanticTokens.colors.secondary.hsl,
  '--tasky-color-secondary-foreground': semanticTokens.colors.secondaryForeground.hsl,
  '--tasky-color-muted': semanticTokens.colors.muted.hsl,
  '--tasky-color-muted-foreground': semanticTokens.colors.mutedForeground.hsl,
  '--tasky-color-accent': semanticTokens.colors.accent.hsl,
  '--tasky-color-accent-foreground': semanticTokens.colors.accentForeground.hsl,
  '--tasky-color-border': semanticTokens.colors.border.hsl,
  '--tasky-color-input': semanticTokens.colors.input.hsl,
  '--tasky-color-ring': semanticTokens.colors.ring.hsl,
  '--tasky-color-destructive': semanticTokens.colors.destructive.hsl,
  '--tasky-color-destructive-foreground': semanticTokens.colors.destructiveForeground.hsl,
  '--tasky-color-trust': semanticTokens.colors.trust.hsl,
  '--tasky-color-trust-foreground': semanticTokens.colors.trustForeground.hsl,
  '--tasky-color-trust-muted': semanticTokens.colors.trustMuted.hsl,
  '--tasky-color-status-open': semanticTokens.colors.statusOpen.hsl,
  '--tasky-color-status-open-foreground': semanticTokens.colors.statusOpenForeground.hsl,
  '--tasky-color-status-assigned': semanticTokens.colors.statusAssigned.hsl,
  '--tasky-color-status-assigned-foreground': semanticTokens.colors.statusAssignedForeground.hsl,
  '--tasky-color-verified': semanticTokens.colors.verified.hsl,
  '--tasky-color-subtle-violet': semanticTokens.colors.subtleViolet.hsl,
  '--tasky-color-chip-inactive': semanticTokens.colors.chipInactive.hsl,
  '--tasky-color-nav-inactive': semanticTokens.colors.navInactive.hsl,
  '--tasky-radius': webRadius.md,
  '--tasky-font-family-sans': webTypography.fontFamily.sans,
  '--tasky-font-family-display': webTypography.fontFamily.display,
  '--tasky-font-size-body': webTypography.fontSize.body,
} as const;

export const webTokens = {
  colors: semanticTokens.colors,
  spacing: webSpacing,
  radius: webRadius,
  typography: webTypography,
  cssVariables,
} as const;

export type WebTokens = typeof webTokens;
