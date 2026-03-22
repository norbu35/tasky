// Palette: Steppe Diffusion — Deep Teal #163838 · Gold #89752A · Indigo #3F53A2 · Terracotta #A93700 · Cream #FAFAF5
export const designTokens = {
    colors: {
        background: {hsl: "60 33.3% 97.1%", hex: "#FAFAF5"},
        foreground: {hsl: "180 43.6% 15.3%", hex: "#163838"},
        card: {hsl: "0 0% 100%", hex: "#FFFFFF"},
        cardForeground: {hsl: "180 43.6% 15.3%", hex: "#163838"},
        primary: {hsl: "180 43.6% 15.3%", hex: "#163838"},
        primaryForeground: {hsl: "60 33.3% 97.1%", hex: "#FAFAF5"},
        primaryDeep: {hsl: "180 50% 10%", hex: "#0D2626"},
        secondary: {hsl: "47.4 53.1% 35.1%", hex: "#89752A"},
        secondaryForeground: {hsl: "0 0% 100%", hex: "#FFFFFF"},
        muted: {hsl: "60 17% 95%", hex: "#F2F1EB"},
        mutedForeground: {hsl: "180 5% 27%", hex: "#424846"},
        accent: {hsl: "19.5 100% 33.1%", hex: "#A93700"},
        accentForeground: {hsl: "60 33.3% 97.1%", hex: "#FAFAF5"},
        border: {hsl: "171 7% 77%", hex: "#BDC5C3"},
        input: {hsl: "60 9% 88%", hex: "#E2E1DA"},
        ring: {hsl: "180 43.6% 15.3%", hex: "#163838"},
        danger: {hsl: "0 84% 60%", hex: "#EF4444"},
        dangerForeground: {hsl: "0 0% 100%", hex: "#FFFFFF"},
        // Trust system (indigo-based)
        trust: {hsl: "227.9 44% 44.1%", hex: "#3F53A2"},
        trustForeground: {hsl: "0 0% 100%", hex: "#FFFFFF"},
        trustMuted: {hsl: "227.9 44% 80%", hex: "#B3BCE0"},
        // Status colors
        statusOpen: {hsl: "60 17% 90%", hex: "#E8E7DD"},
        statusOpenForeground: {hsl: "180 5% 27%", hex: "#424846"},
        statusAssigned: {hsl: "180 43.6% 15.3%", hex: "#163838"},
        statusAssignedForeground: {hsl: "0 0% 100%", hex: "#FFFFFF"},
        // Verification (sage-emerald — derived from primary hue 180 shifted to 160)
        verified: {hsl: "160 45% 42%", hex: "#3B9B7A"},
        verifiedForeground: {hsl: "0 0% 100%", hex: "#FFFFFF"},
        // Subtle backgrounds
        subtleViolet: {hsl: "60 17% 95%", hex: "#F2F1EB"},   // warm cream tint; key kept for compat
        chipInactive: {hsl: "171 7% 90%", hex: "#E2E6E5"},
        textSecondary: {hsl: "180 5% 27%", hex: "#424846"},
        textTertiary: {hsl: "180 3% 45%", hex: "#6F7573"},
        navInactive: {hsl: "180 5% 40%", hex: "#616A68"},
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
