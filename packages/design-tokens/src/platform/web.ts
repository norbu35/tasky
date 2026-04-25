import {
  animationPresetTokens,
  colorOpacityTokens,
  contentRuleTokens,
  densityTokens,
  elevationTokens,
  iconSizeTokens,
  interactionTokens,
  overlayTokens,
  typographyVariantTokens,
} from '../core/additions';
import { semanticTokens } from '../core/semantic';

const px = (value: number) => `${value}px`;
const em = (value: number) => `${value}em`;
const ms = (value: number) => `${value}ms`;
const toCssShadow = (shadow: {
  readonly color: string;
  readonly offset: { readonly width: number; readonly height: number };
  readonly opacity: number;
  readonly radius: number;
}) =>
  `${px(shadow.offset.width)} ${px(shadow.offset.height)} ${px(shadow.radius)} rgba(0, 0, 0, ${shadow.opacity})`;

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

const webInteraction = {
  pressed: {
    opacity: interactionTokens.pressed.opacity,
    scale: interactionTokens.pressed.scale,
  },
  focused: {
    ringWidth: px(interactionTokens.focused.ringWidth),
    ringColor: interactionTokens.focused.ringColor.hsl,
    ringOffset: px(interactionTokens.focused.ringOffset),
  },
  disabled: {
    opacity: interactionTokens.disabled.opacity,
    textColor: interactionTokens.disabled.textColor.hsl,
    backgroundColor: interactionTokens.disabled.backgroundColor.hsl,
  },
  hover: {
    opacity: interactionTokens.hover.opacity,
  },
} as const;

const webIconSizes = {
  xs: px(iconSizeTokens.xs),
  sm: px(iconSizeTokens.sm),
  md: px(iconSizeTokens.md),
  lg: px(iconSizeTokens.lg),
  xl: px(iconSizeTokens.xl),
  semantic: {
    navigation: px(iconSizeTokens.semantic.navigation),
    tabBar: px(iconSizeTokens.semantic.tabBar),
    tabBarActive: px(iconSizeTokens.semantic.tabBarActive),
    avatarBadge: px(iconSizeTokens.semantic.avatarBadge),
    inputIcon: px(iconSizeTokens.semantic.inputIcon),
    fab: px(iconSizeTokens.semantic.fab),
    status: px(iconSizeTokens.semantic.status),
  },
  touchTargetMin: px(iconSizeTokens.touchTargetMin),
} as const;

const webTypographyVariants = Object.fromEntries(
  Object.entries(typographyVariantTokens).map(([name, variant]) => [
    name,
    {
      fontFamily: variant.fontFamily.web,
      fontSize: px(variant.fontSize),
      fontWeight: variant.fontWeight,
      lineHeight: `${variant.lineHeight}`,
      letterSpacing: em(variant.letterSpacing),
    },
  ]),
) as {
  readonly [Key in keyof typeof typographyVariantTokens]: {
    readonly fontFamily: (typeof typographyVariantTokens)[Key]['fontFamily']['web'];
    readonly fontSize: string;
    readonly fontWeight: (typeof typographyVariantTokens)[Key]['fontWeight'];
    readonly lineHeight: string;
    readonly letterSpacing: string;
  };
};

const webAnimationPresets = Object.fromEntries(
  Object.entries(animationPresetTokens).map(([name, preset]) => [
    name,
    {
      duration: ms(preset.duration),
      easing: preset.easing,
      ...('loop' in preset ? { loop: preset.loop } : {}),
    },
  ]),
) as {
  readonly [Key in keyof typeof animationPresetTokens]: {
    readonly duration: string;
    readonly easing: (typeof animationPresetTokens)[Key]['easing'];
    readonly loop?: true;
  };
};

const webDensity = {
  compact: {
    multiplier: densityTokens.compact.multiplier,
    spacing: {
      xs: px(densityTokens.compact.spacing.xs),
      sm: px(densityTokens.compact.spacing.sm),
      md: px(densityTokens.compact.spacing.md),
      lg: px(densityTokens.compact.spacing.lg),
      xl: px(densityTokens.compact.spacing.xl),
    },
  },
  default: {
    multiplier: densityTokens.default.multiplier,
    spacing: webSpacing,
  },
  comfortable: {
    multiplier: densityTokens.comfortable.multiplier,
    spacing: {
      xs: px(densityTokens.comfortable.spacing.xs),
      sm: px(densityTokens.comfortable.spacing.sm),
      md: px(densityTokens.comfortable.spacing.md),
      lg: px(densityTokens.comfortable.spacing.lg),
      xl: px(densityTokens.comfortable.spacing.xl),
    },
  },
} as const;

const webElevation = {
  base: elevationTokens.base,
  sticky: elevationTokens.sticky,
  dropdown: elevationTokens.dropdown,
  sheet: {
    zIndex: elevationTokens.sheet.zIndex,
    shadow: toCssShadow(elevationTokens.sheet.shadow),
    scrim: elevationTokens.sheet.scrim,
  },
  modal: {
    zIndex: elevationTokens.modal.zIndex,
    shadow: toCssShadow(elevationTokens.modal.shadow),
    scrim: elevationTokens.modal.scrim,
  },
  toast: elevationTokens.toast,
  system: elevationTokens.system,
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
  '--interaction-pressed-opacity': `${interactionTokens.pressed.opacity}`,
  '--interaction-pressed-scale': `${interactionTokens.pressed.scale}`,
  '--interaction-focused-ring-width': px(interactionTokens.focused.ringWidth),
  '--interaction-focused-ring-offset': px(interactionTokens.focused.ringOffset),
  '--interaction-disabled-opacity': `${interactionTokens.disabled.opacity}`,
  '--interaction-hover-opacity': `${interactionTokens.hover.opacity}`,
  '--overlay-scrim-modal': overlayTokens.scrim.modal,
  '--overlay-scrim-sheet': overlayTokens.scrim.sheet,
  '--overlay-scrim-toast-backdrop': overlayTokens.scrim.toastBackdrop,
  '--icon-size-md': webIconSizes.md,
  '--z-modal': `${elevationTokens.modal.zIndex}`,
  '--animation-sheet-open-duration': webAnimationPresets.sheetOpen.duration,
  '--animation-sheet-open-easing': webAnimationPresets.sheetOpen.easing,
  '--color-primary-10': colorOpacityTokens.primary[10],
  '--typography-page-heading-letter-spacing': webTypographyVariants.pageHeading.letterSpacing,
  '--content-mongolian-min-body-size': px(contentRuleTokens.mongolianCyrillic.minBodySize),
} as const;

export const webTokens = {
  colors: semanticTokens.colors,
  spacing: webSpacing,
  radius: webRadius,
  typography: webTypography,
  interaction: webInteraction,
  overlays: overlayTokens,
  iconSizes: webIconSizes,
  elevation: webElevation,
  typographyVariants: webTypographyVariants,
  density: webDensity,
  animationPresets: webAnimationPresets,
  colorOpacity: colorOpacityTokens,
  contentRules: contentRuleTokens,
  cssVariables,
} as const;

export type WebTokens = typeof webTokens;
