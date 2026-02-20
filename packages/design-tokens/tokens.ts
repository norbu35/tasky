export const designTokens = {
    colors: {
        background: {hsl: "0 0% 98%", hex: "#FAFAFA"},
        foreground: {hsl: "0 0% 9%", hex: "#171717"},
        card: {hsl: "0 0% 100%", hex: "#FFFFFF"},
        cardForeground: {hsl: "0 0% 9%", hex: "#171717"},
        primary: {hsl: "263 70% 50%", hex: "#6D28D9"},
        primaryForeground: {hsl: "0 0% 100%", hex: "#FFFFFF"},
        secondary: {hsl: "251 91% 95%", hex: "#EDE9FE"},
        secondaryForeground: {hsl: "264 67% 35%", hex: "#4C1D95"},
        muted: {hsl: "240 5% 96%", hex: "#F4F4F5"},
        mutedForeground: {hsl: "240 5% 45%", hex: "#71717A"},
        accent: {hsl: "38 92% 50%", hex: "#F59E0B"},
        accentForeground: {hsl: "0 0% 0%", hex: "#000000"},
        border: {hsl: "240 6% 90%", hex: "#E4E4E7"},
        input: {hsl: "240 6% 90%", hex: "#E4E4E7"},
        ring: {hsl: "263 70% 50%", hex: "#6D28D9"},
        danger: {hsl: "0 84% 60%", hex: "#EF4444"},
        dangerForeground: {hsl: "0 0% 100%", hex: "#FFFFFF"}
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
