export const designTokens = {
    colors: {
        background: {hsl: "44 40% 97%", hex: "#f8f4ea"},
        foreground: {hsl: "212 24% 16%", hex: "#203040"},
        card: {hsl: "0 0% 100%", hex: "#ffffff"},
        cardForeground: {hsl: "212 24% 16%", hex: "#203040"},
        primary: {hsl: "177 78% 28%", hex: "#107f78"},
        primaryForeground: {hsl: "0 0% 100%", hex: "#ffffff"},
        secondary: {hsl: "35 49% 91%", hex: "#f4ead9"},
        secondaryForeground: {hsl: "212 24% 16%", hex: "#203040"},
        muted: {hsl: "38 34% 92%", hex: "#efe9dc"},
        mutedForeground: {hsl: "213 14% 43%", hex: "#5d6d7d"},
        accent: {hsl: "19 88% 63%", hex: "#f48550"},
        accentForeground: {hsl: "213 33% 13%", hex: "#162c3d"},
        border: {hsl: "38 28% 83%", hex: "#dfd5c7"},
        input: {hsl: "38 28% 83%", hex: "#dfd5c7"},
        ring: {hsl: "177 78% 28%", hex: "#107f78"},
        danger: {hsl: "2 78% 58%", hex: "#e74b44"},
        dangerForeground: {hsl: "0 0% 100%", hex: "#ffffff"}
    },
    radius: {
        sm: 10,
        md: 14,
        lg: 18
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24
    },
    typography: {
        heading: 28,
        body: 16,
        caption: 13
    }
} as const;

export type DesignTokens = typeof designTokens;
