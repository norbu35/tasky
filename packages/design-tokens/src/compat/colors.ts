import { semanticTokens } from '../core/semantic';

export const colors = {
  primary: {
    DEFAULT: semanticTokens.colors.primary.hex,
    foreground: semanticTokens.colors.primaryForeground.hex,
  },
  secondary: {
    DEFAULT: semanticTokens.colors.secondary.hex,
    foreground: semanticTokens.colors.secondaryForeground.hex,
  },
  destructive: {
    DEFAULT: semanticTokens.colors.danger.hex,
    foreground: semanticTokens.colors.dangerForeground.hex,
  },
  muted: {
    DEFAULT: semanticTokens.colors.muted.hex,
    foreground: semanticTokens.colors.mutedForeground.hex,
  },
  accent: {
    DEFAULT: semanticTokens.colors.accent.hex,
    foreground: semanticTokens.colors.accentForeground.hex,
  },
  background: semanticTokens.colors.background.hex,
  foreground: semanticTokens.colors.foreground.hex,
  card: {
    DEFAULT: semanticTokens.colors.card.hex,
    foreground: semanticTokens.colors.cardForeground.hex,
  },
  border: semanticTokens.colors.border.hex,
  input: semanticTokens.colors.input.hex,
  ring: semanticTokens.colors.ring.hex,
} as const;
