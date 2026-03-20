export const designTokens = {
    colors: {
        background: {hsl: "0 0% 98%", hex: "#F9F9F9"},
        foreground: {hsl: "0 0% 9%", hex: "#1A1C1C"},
        card: {hsl: "0 0% 100%", hex: "#FFFFFF"},
        cardForeground: {hsl: "0 0% 9%", hex: "#1A1C1C"},
        primary: {hsl: "263 70% 50%", hex: "#6D28D9"},
        primaryForeground: {hsl: "0 0% 100%", hex: "#FFFFFF"},
        primaryDeep: {hsl: "275 100% 36%", hex: "#5300B7"},
        secondary: {hsl: "251 91% 95%", hex: "#EDE9FE"},
        secondaryForeground: {hsl: "264 67% 35%", hex: "#4C1D95"},
        muted: {hsl: "0 0% 95%", hex: "#F3F3F3"},
        mutedForeground: {hsl: "265 8% 40%", hex: "#4A4455"},
        accent: {hsl: "38 92% 50%", hex: "#F59E0B"},
        accentForeground: {hsl: "0 0% 0%", hex: "#000000"},
        border: {hsl: "240 6% 90%", hex: "#E4E4E7"},
        input: {hsl: "240 6% 90%", hex: "#E4E4E7"},
        ring: {hsl: "263 70% 50%", hex: "#6D28D9"},
        danger: {hsl: "0 84% 60%", hex: "#EF4444"},
        dangerForeground: {hsl: "0 0% 100%", hex: "#FFFFFF"},
        // Trust system (amber)
        trust: {hsl: "33 100% 86%", hex: "#FFDDB8"},
        trustForeground: {hsl: "30 100% 8%", hex: "#2A1700"},
        trustMuted: {hsl: "30 100% 20%", hex: "#653E00"},
        // Status colors
        statusOpen: {hsl: "152 76% 90%", hex: "#D1FAE5"},
        statusOpenForeground: {hsl: "162 93% 24%", hex: "#047857"},
        statusAssigned: {hsl: "263 70% 50%", hex: "#6D28D9"},
        statusAssignedForeground: {hsl: "0 0% 100%", hex: "#FFFFFF"},
        // Verification
        verified: {hsl: "160 59% 45%", hex: "#10B981"},
        verifiedForeground: {hsl: "0 0% 100%", hex: "#FFFFFF"},
        // Subtle backgrounds
        subtleViolet: {hsl: "249 42% 92%", hex: "#E4E0F5"},
        chipInactive: {hsl: "0 0% 89%", hex: "#E2E2E2"},
        textSecondary: {hsl: "257 8% 40%", hex: "#5E5C6E"},
        textTertiary: {hsl: "260 5% 50%", hex: "#7B7486"},
        navInactive: {hsl: "220 9% 46%", hex: "#6B7280"},
    },
    radius: {
        xs: 6,
        sm: 8,
        md: 12,
        lg: 16,
        full: 9999
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        '2xl': 32,
        '3xl': 40
    },
    typography: {
        heroTitle: 30,
        heading: 24,
        title: 20,
        subtitle: 18,
        body: 16,
        label: 14,
        caption: 12,
        micro: 10,
        navLabel: 11
    },
    shadows: {
        card: {
            color: '#000000',
            offset: { width: 0, height: 1 },
            opacity: 0.05,
            radius: 2,
            elevation: 1
        },
        elevated: {
            color: '#000000',
            offset: { width: 0, height: 4 },
            opacity: 0.1,
            radius: 6,
            elevation: 3
        },
        navBar: {
            color: '#1A1C1C',
            offset: { width: 0, height: -4 },
            opacity: 0.04,
            radius: 24,
            elevation: 4
        }
    }
} as const;

export type DesignTokens = typeof designTokens;
