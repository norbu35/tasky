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
import { motionTokens } from '../core/motion';
import { primitiveTokens } from '../core/primitives';
import { semanticTokens } from '../core/semantic';

const px = (value: number) => `${value}px`;
const em = (value: number) => `${value}em`;
const ms = (value: number) => `${value}ms`;
const cssVar = (name: string) => `var(${name})`;
const toKebab = (value: string) => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
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
    displayXl: px(semanticTokens.typography.fontSizes.displayXl),
    displayLg: px(semanticTokens.typography.fontSizes.displayLg),
    heading1: px(semanticTokens.typography.fontSizes.heading1),
    heading2: px(semanticTokens.typography.fontSizes.heading2),
    heading3: px(semanticTokens.typography.fontSizes.heading3),
    heroTitle: px(semanticTokens.typography.fontSizes.heroTitle),
    heading: px(semanticTokens.typography.fontSizes.heading),
    title: px(semanticTokens.typography.fontSizes.title),
    subtitle: px(semanticTokens.typography.fontSizes.subtitle),
    bodyLg: px(semanticTokens.typography.fontSizes.bodyLg),
    body: px(semanticTokens.typography.fontSizes.body),
    bodySm: px(semanticTokens.typography.fontSizes.bodySm),
    label: px(semanticTokens.typography.fontSizes.label),
    labelUi: px(semanticTokens.typography.fontSizes.labelUi),
    caption: px(semanticTokens.typography.fontSizes.caption),
    overline: px(semanticTokens.typography.fontSizes.overline),
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
    caps: em(semanticTokens.typography.letterSpacing.caps),
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

const webShadows = {
  card: '0 1px 2px rgba(0, 0, 0, 0.05)',
  elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
  fab: '0 4px 6px -4px rgba(0, 0, 0, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  nav: '0 -4px 24px rgba(26, 28, 26, 0.04)',
  deep: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
} as const;

const typographyVariantCssVariables = Object.fromEntries(
  Object.entries(webTypographyVariants).flatMap(([variantName, variant]) => {
    const variablePrefix = `--typography-${toKebab(variantName)}`;

    return [
      [`${variablePrefix}-font-size`, variant.fontSize],
      [`${variablePrefix}-font-weight`, variant.fontWeight],
      [`${variablePrefix}-line-height`, variant.lineHeight],
      [`${variablePrefix}-letter-spacing`, variant.letterSpacing],
    ];
  }),
) as Record<string, string>;

const opacityScaleCssVariables = <Scale extends Record<PropertyKey, string>>(
  colorName: string,
  scale: Scale,
) =>
  Object.fromEntries(
    Object.entries(scale).map(([step, value]) => [`--color-${colorName}-${step}`, value]),
  ) as Record<string, string>;

const palette = primitiveTokens.palette;

const cssVariableSections = {
  primitives: {
    '--tenger-canvas': palette.canvas.hsl,
    '--tenger-ink': palette.ink.hsl,
    '--tenger-ink-deep': palette.inkDeep.hsl,
    '--tenger-surface': palette.surface.hsl,
    '--tenger-sun': palette.sun.hsl,
    '--tenger-sun-light': palette.sunLight.hsl,
    '--tenger-sun-wash': palette.sunWash.hsl,
    '--tenger-sky': palette.sky.hsl,
    '--tenger-sky-soft': palette.skySoft.hsl,
    '--tenger-line': palette.line.hsl,
    '--tenger-field': palette.field.hsl,
    '--tenger-subtle': palette.subtle.hsl,
    '--tenger-muted-text': palette.mutedText.hsl,
    '--tenger-text-secondary': palette.textSecondary.hsl,
    '--tenger-text-tertiary': palette.textTertiary.hsl,
    '--tenger-verified': palette.verified.hsl,
    '--tenger-trust': palette.trust.hsl,
    '--tenger-trust-muted': palette.trustMuted.hsl,
    '--tenger-danger': palette.danger.hsl,
    '--tenger-nav-inactive': palette.navInactive.hsl,
    '--tenger-chip-inactive': palette.chipInactive.hsl,
    '--tenger-status-open': palette.statusOpen.hsl,
    '--tenger-status-open-fg': palette.statusOpenForeground.hsl,
    '--tenger-status-assigned': palette.statusAssigned.hsl,
    '--tenger-status-assigned-fg': palette.statusAssignedForeground.hsl,
    '--tenger-status-completed': palette.statusCompleted.hsl,
    '--tenger-status-completed-fg': palette.statusCompletedForeground.hsl,
    '--tenger-status-cancelled': palette.statusCancelled.hsl,
    '--tenger-status-cancelled-fg': palette.statusCancelledForeground.hsl,
  },
  semanticAliases: {
    '--color-background': cssVar('--tenger-canvas'),
    '--color-foreground': cssVar('--tenger-ink'),
    '--color-foreground-deep': cssVar('--tenger-ink-deep'),
    '--color-card': cssVar('--tenger-surface'),
    '--color-card-fg': cssVar('--tenger-ink'),
    '--color-popover': cssVar('--tenger-surface'),
    '--color-popover-fg': cssVar('--tenger-ink'),
    '--color-primary': cssVar('--tenger-ink'),
    '--color-primary-fg': cssVar('--tenger-canvas'),
    '--color-primary-deep': cssVar('--tenger-ink-deep'),
    '--color-secondary': cssVar('--tenger-sun'),
    '--color-secondary-fg': cssVar('--tenger-ink'),
    '--color-muted': cssVar('--tenger-subtle'),
    '--color-muted-fg': cssVar('--tenger-muted-text'),
    '--color-accent': cssVar('--tenger-sky'),
    '--color-accent-fg': cssVar('--tenger-surface'),
    '--color-border': cssVar('--tenger-line'),
    '--color-input': cssVar('--tenger-field'),
    '--color-ring': cssVar('--tenger-ink'),
    '--color-destructive': cssVar('--tenger-danger'),
    '--color-destructive-fg': cssVar('--tenger-surface'),
    '--color-trust': cssVar('--tenger-trust'),
    '--color-trust-fg': cssVar('--tenger-surface'),
    '--color-trust-muted': cssVar('--tenger-trust-muted'),
    '--color-verified': cssVar('--tenger-verified'),
    '--color-verified-fg': cssVar('--tenger-surface'),
    '--color-status-open': cssVar('--tenger-status-open'),
    '--color-status-open-fg': cssVar('--tenger-status-open-fg'),
    '--color-status-assigned': cssVar('--tenger-status-assigned'),
    '--color-status-assigned-fg': cssVar('--tenger-status-assigned-fg'),
    '--color-status-completed': cssVar('--tenger-status-completed'),
    '--color-status-completed-fg': cssVar('--tenger-status-completed-fg'),
    '--color-status-cancelled': cssVar('--tenger-status-cancelled'),
    '--color-status-cancelled-fg': cssVar('--tenger-status-cancelled-fg'),
    '--color-chip-inactive': cssVar('--tenger-chip-inactive'),
    '--color-text-secondary': cssVar('--tenger-text-secondary'),
    '--color-text-tertiary': cssVar('--tenger-text-tertiary'),
    '--color-nav-inactive': cssVar('--tenger-nav-inactive'),
    '--color-sun-light': cssVar('--tenger-sun-light'),
    '--color-sun-wash': cssVar('--tenger-sun-wash'),
    '--color-sky-soft': cssVar('--tenger-sky-soft'),
    '--color-subtle-violet': cssVar('--tenger-subtle'),
  },
  radius: {
    '--radius': webRadius.md,
    '--radius-xs': webRadius.xs,
    '--radius-sm': webRadius.sm,
    '--radius-md': webRadius.md,
    '--radius-lg': webRadius.lg,
    '--radius-full': webRadius.full,
  },
  typography: {
    '--tenger-font-display': webTypography.fontFamily.display,
    '--tenger-font-sans': webTypography.fontFamily.sans,
    '--tenger-letter-spacing-caps': webTypography.letterSpacing.caps,
    '--font-family-sans': cssVar('--tenger-font-sans'),
    '--font-family-display': cssVar('--tenger-font-display'),
    '--font-size-display-xl': webTypography.fontSize.displayXl,
    '--font-size-display-lg': webTypography.fontSize.displayLg,
    '--font-size-heading-1': webTypography.fontSize.heading1,
    '--font-size-heading-2': webTypography.fontSize.heading2,
    '--font-size-heading-3': webTypography.fontSize.heading3,
    '--font-size-body-lg': webTypography.fontSize.bodyLg,
    '--font-size-body': webTypography.fontSize.body,
    '--font-size-body-sm': webTypography.fontSize.bodySm,
    '--font-size-label': webTypography.fontSize.label,
    '--font-size-label-ui': webTypography.fontSize.labelUi,
    '--font-size-caption': webTypography.fontSize.caption,
    '--font-size-overline': webTypography.fontSize.overline,
    '--font-size-nav': webTypography.fontSize.navLabel,
    '--font-size-micro': webTypography.fontSize.micro,
    '--font-weight-normal': webTypography.fontWeight.normal,
    '--font-weight-medium': webTypography.fontWeight.medium,
    '--font-weight-semibold': webTypography.fontWeight.semibold,
    '--font-weight-bold': webTypography.fontWeight.bold,
    '--line-height-tight': webTypography.lineHeight.tight,
    '--line-height-normal': webTypography.lineHeight.normal,
    '--line-height-loose': webTypography.lineHeight.loose,
    '--letter-spacing-tight': webTypography.letterSpacing.tight,
    '--letter-spacing-normal': webTypography.letterSpacing.normal,
    '--letter-spacing-caps': cssVar('--tenger-letter-spacing-caps'),
  },
  typographyVariants: typographyVariantCssVariables,
  motion: {
    '--tenger-duration-instant': ms(motionTokens.duration.instant),
    '--tenger-duration-fast': ms(motionTokens.duration.fast),
    '--tenger-duration-normal': ms(motionTokens.duration.normal),
    '--tenger-duration-slow': ms(motionTokens.duration.slow),
    '--tenger-duration-skeleton': ms(motionTokens.duration.skeleton),
    '--tenger-easing-standard': motionTokens.easing.standard,
    '--tenger-easing-decelerate': motionTokens.easing.decelerate,
    '--tenger-easing-accelerate': motionTokens.easing.accelerate,
    '--tenger-easing-spring': motionTokens.easing.spring,
  },
  interactionStates: {
    '--interaction-pressed-opacity': `${interactionTokens.pressed.opacity}`,
    '--interaction-pressed-scale': `${interactionTokens.pressed.scale}`,
    '--interaction-focused-ring-width': px(interactionTokens.focused.ringWidth),
    '--interaction-focused-ring-color': cssVar('--color-primary'),
    '--interaction-focused-ring-offset': px(interactionTokens.focused.ringOffset),
    '--interaction-disabled-opacity': `${interactionTokens.disabled.opacity}`,
    '--interaction-disabled-text-color': cssVar('--color-text-tertiary'),
    '--interaction-disabled-background-color': cssVar('--color-muted'),
    '--interaction-hover-opacity': `${interactionTokens.hover.opacity}`,
  },
  overlays: {
    '--overlay-scrim-modal': overlayTokens.scrim.modal,
    '--overlay-scrim-sheet': overlayTokens.scrim.sheet,
    '--overlay-scrim-toast-backdrop': overlayTokens.scrim.toastBackdrop,
    '--overlay-image-text-readability': overlayTokens.imageOverlay.textReadability,
    '--overlay-image-subtle': overlayTokens.imageOverlay.subtle,
  },
  iconSizes: {
    '--icon-size-xs': webIconSizes.xs,
    '--icon-size-sm': webIconSizes.sm,
    '--icon-size-md': webIconSizes.md,
    '--icon-size-lg': webIconSizes.lg,
    '--icon-size-xl': webIconSizes.xl,
    '--icon-size-navigation': webIconSizes.semantic.navigation,
    '--icon-size-tab-bar': webIconSizes.semantic.tabBar,
    '--icon-size-avatar-badge': webIconSizes.semantic.avatarBadge,
    '--icon-size-input': webIconSizes.semantic.inputIcon,
    '--icon-size-fab': webIconSizes.semantic.fab,
    '--icon-size-status': webIconSizes.semantic.status,
    '--icon-touch-target-min': webIconSizes.touchTargetMin,
  },
  elevationLayers: {
    '--z-base': `${elevationTokens.base.zIndex}`,
    '--z-sticky': `${elevationTokens.sticky.zIndex}`,
    '--z-dropdown': `${elevationTokens.dropdown.zIndex}`,
    '--z-sheet': `${elevationTokens.sheet.zIndex}`,
    '--z-modal': `${elevationTokens.modal.zIndex}`,
    '--z-toast': `${elevationTokens.toast.zIndex}`,
    '--z-system': `${elevationTokens.system.zIndex}`,
  },
  shadows: {
    '--tenger-shadow-card': webShadows.card,
    '--tenger-shadow-elevated': webShadows.elevated,
    '--tenger-shadow-fab': webShadows.fab,
    '--tenger-shadow-nav': webShadows.nav,
    '--tenger-shadow-deep': webShadows.deep,
  },
  animationPresets: {
    '--animation-card-expand-duration': webAnimationPresets.cardExpand.duration,
    '--animation-card-expand-easing': webAnimationPresets.cardExpand.easing,
    '--animation-sheet-open-duration': webAnimationPresets.sheetOpen.duration,
    '--animation-sheet-open-easing': webAnimationPresets.sheetOpen.easing,
    '--animation-sheet-close-duration': webAnimationPresets.sheetClose.duration,
    '--animation-sheet-close-easing': webAnimationPresets.sheetClose.easing,
    '--animation-page-enter-duration': webAnimationPresets.pageEnter.duration,
    '--animation-page-enter-easing': webAnimationPresets.pageEnter.easing,
    '--animation-page-exit-duration': webAnimationPresets.pageExit.duration,
    '--animation-page-exit-easing': webAnimationPresets.pageExit.easing,
    '--animation-fab-appear-duration': webAnimationPresets.fabAppear.duration,
    '--animation-fab-appear-easing': webAnimationPresets.fabAppear.easing,
    '--animation-fab-disappear-duration': webAnimationPresets.fabDisappear.duration,
    '--animation-fab-disappear-easing': webAnimationPresets.fabDisappear.easing,
    '--animation-success-checkmark-duration': webAnimationPresets.successCheckmark.duration,
    '--animation-success-checkmark-easing': webAnimationPresets.successCheckmark.easing,
    '--animation-skeleton-pulse-duration': webAnimationPresets.skeletonPulse.duration,
    '--animation-skeleton-pulse-easing': webAnimationPresets.skeletonPulse.easing,
    '--animation-badge-pop-duration': webAnimationPresets.badgePop.duration,
    '--animation-badge-pop-easing': webAnimationPresets.badgePop.easing,
    '--animation-toast-slide-in-duration': webAnimationPresets.toastSlideIn.duration,
    '--animation-toast-slide-in-easing': webAnimationPresets.toastSlideIn.easing,
    '--animation-toast-slide-out-duration': webAnimationPresets.toastSlideOut.duration,
    '--animation-toast-slide-out-easing': webAnimationPresets.toastSlideOut.easing,
    '--animation-pull-to-refresh-duration': webAnimationPresets.pullToRefresh.duration,
    '--animation-pull-to-refresh-easing': webAnimationPresets.pullToRefresh.easing,
  },
  opacityColorSteps: {
    ...opacityScaleCssVariables('primary', colorOpacityTokens.primary),
    ...opacityScaleCssVariables('secondary', colorOpacityTokens.secondary),
    ...opacityScaleCssVariables('accent', colorOpacityTokens.accent),
    ...opacityScaleCssVariables('trust', colorOpacityTokens.trust),
    ...opacityScaleCssVariables('verified', colorOpacityTokens.verified),
    ...opacityScaleCssVariables('danger', colorOpacityTokens.danger),
  },
  density: {
    '--density-compact-multiplier': `${densityTokens.compact.multiplier}`,
    '--density-compact-spacing-xs': px(densityTokens.compact.spacing.xs),
    '--density-compact-spacing-sm': px(densityTokens.compact.spacing.sm),
    '--density-compact-spacing-md': px(densityTokens.compact.spacing.md),
    '--density-compact-spacing-lg': px(densityTokens.compact.spacing.lg),
    '--density-compact-spacing-xl': px(densityTokens.compact.spacing.xl),
    '--density-default-multiplier': `${densityTokens.default.multiplier}`,
    '--density-comfortable-multiplier': `${densityTokens.comfortable.multiplier}`,
    '--density-comfortable-spacing-xs': px(densityTokens.comfortable.spacing.xs),
    '--density-comfortable-spacing-sm': px(densityTokens.comfortable.spacing.sm),
    '--density-comfortable-spacing-md': px(densityTokens.comfortable.spacing.md),
    '--density-comfortable-spacing-lg': px(densityTokens.comfortable.spacing.lg),
    '--density-comfortable-spacing-xl': px(densityTokens.comfortable.spacing.xl),
  },
  contentRules: {
    '--content-mongolian-expansion-factor': `${contentRuleTokens.mongolianCyrillic.expansionFactor}`,
    '--content-mongolian-min-body-size': px(contentRuleTokens.mongolianCyrillic.minBodySize),
    '--content-mongolian-min-secondary-size': px(
      contentRuleTokens.mongolianCyrillic.minSecondarySize,
    ),
    '--content-mongolian-min-nav-size': px(contentRuleTokens.mongolianCyrillic.minNavSize),
    '--content-mongolian-line-height-body': `${contentRuleTokens.mongolianCyrillic.lineHeightBody}`,
    '--content-card-title-max-length': `${contentRuleTokens.maxLengths.cardTitle}`,
    '--content-button-label-max-length': `${contentRuleTokens.maxLengths.buttonLabel}`,
    '--content-card-description-lines': `${contentRuleTokens.truncation.linesCardDescription}`,
  },
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
  shadows: webShadows,
  typographyVariants: webTypographyVariants,
  density: webDensity,
  animationPresets: webAnimationPresets,
  colorOpacity: colorOpacityTokens,
  contentRules: contentRuleTokens,
  cssVariableSections,
} as const;

export type WebTokens = typeof webTokens;
