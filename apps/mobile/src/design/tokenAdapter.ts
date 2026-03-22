import { designTokens } from "../../../../packages/design-tokens/tokens";
import { motionTokens } from "../../../../packages/design-tokens/src/motion";

export const mobileTheme = {
    colors: {
        background: designTokens.colors.background.hex,
        foreground: designTokens.colors.foreground.hex,
        card: designTokens.colors.card.hex,
        cardForeground: designTokens.colors.cardForeground.hex,
        primary: designTokens.colors.primary.hex,
        primaryForeground: designTokens.colors.primaryForeground.hex,
        primaryDeep: designTokens.colors.primaryDeep.hex,
        secondary: designTokens.colors.secondary.hex,
        secondaryForeground: designTokens.colors.secondaryForeground.hex,
        muted: designTokens.colors.muted.hex,
        mutedForeground: designTokens.colors.mutedForeground.hex,
        border: designTokens.colors.border.hex,
        input: designTokens.colors.input.hex,
        accent: designTokens.colors.accent.hex,
        accentForeground: designTokens.colors.accentForeground.hex,
        danger: designTokens.colors.danger.hex,
        dangerForeground: designTokens.colors.dangerForeground.hex,
        // Trust system
        trust: designTokens.colors.trust.hex,
        trustForeground: designTokens.colors.trustForeground.hex,
        trustMuted: designTokens.colors.trustMuted.hex,
        // Status
        statusOpen: designTokens.colors.statusOpen.hex,
        statusOpenForeground: designTokens.colors.statusOpenForeground.hex,
        statusAssigned: designTokens.colors.statusAssigned.hex,
        statusAssignedForeground: designTokens.colors.statusAssignedForeground.hex,
        // Verification
        verified: designTokens.colors.verified.hex,
        verifiedForeground: designTokens.colors.verifiedForeground.hex,
        // UI elements
        subtleViolet: designTokens.colors.subtleViolet.hex,
        chipInactive: designTokens.colors.chipInactive.hex,
        textSecondary: designTokens.colors.textSecondary.hex,
        textTertiary: designTokens.colors.textTertiary.hex,
        navInactive: designTokens.colors.navInactive.hex,
    },
    radius: designTokens.radius,
    spacing: designTokens.spacing,
    typography: designTokens.typography,
    shadows: designTokens.shadows,
    motion: motionTokens,
} as const;

export type MobileTheme = typeof mobileTheme;
