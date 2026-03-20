import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))"
                },
                "primary-deep": "hsl(var(--primary-deep))",
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))"
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))"
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))"
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))"
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))"
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))"
                },
                trust: {
                    DEFAULT: "hsl(var(--trust))",
                    foreground: "hsl(var(--trust-foreground))",
                    muted: "hsl(var(--trust-muted))"
                },
                status: {
                    open: "hsl(var(--status-open))",
                    "open-foreground": "hsl(var(--status-open-foreground))",
                    assigned: "hsl(var(--status-assigned))",
                    "assigned-foreground": "hsl(var(--status-assigned-foreground))"
                },
                verified: "hsl(var(--verified))",
                "subtle-violet": "hsl(var(--subtle-violet))",
                "chip-inactive": "hsl(var(--chip-inactive))",
                "nav-inactive": "hsl(var(--nav-inactive))"
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                xl: "12px",
                "2xl": "16px",
                full: "9999px"
            },
            fontFamily: {
                sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
                display: ["Manrope", "system-ui", "sans-serif"]
            }
        }
    },
    plugins: [tailwindcssAnimate]
};

export default config;
