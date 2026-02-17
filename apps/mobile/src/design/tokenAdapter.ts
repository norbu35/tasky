import {designTokens} from "../../../../packages/design-tokens/tokens";

export const mobileTheme = {
    colors: {
        background: designTokens.colors.background.hex,
        foreground: designTokens.colors.foreground.hex,
        card: designTokens.colors.card.hex,
        cardForeground: designTokens.colors.cardForeground.hex,
        primary: designTokens.colors.primary.hex,
        primaryForeground: designTokens.colors.primaryForeground.hex,
        secondary: designTokens.colors.secondary.hex,
        secondaryForeground: designTokens.colors.secondaryForeground.hex,
        muted: designTokens.colors.muted.hex,
        mutedForeground: designTokens.colors.mutedForeground.hex,
        border: designTokens.colors.border.hex,
        input: designTokens.colors.input.hex,
        accent: designTokens.colors.accent.hex,
        accentForeground: designTokens.colors.accentForeground.hex,
        danger: designTokens.colors.danger.hex,
        dangerForeground: designTokens.colors.dangerForeground.hex
    },
    radius: designTokens.radius,
    spacing: designTokens.spacing,
    typography: designTokens.typography
} as const;

export type MobileTheme = typeof mobileTheme;
