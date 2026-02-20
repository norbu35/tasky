import react from "@vitejs/plugin-react";
import {defineConfig} from "vitest/config";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: "./src/test/setup.ts",
        include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
        coverage: {
            provider: "v8",
            include: ["src/**/*.{ts,tsx}"],
            exclude: [
                "src/test/**",
                "src/**/*.d.ts",
                "src/main.tsx",
                "src/lib/apiClient.ts"
            ],
            thresholds: {
                lines: 60,
                functions: 55,
                branches: 55,
                statements: 60
            },
            reporter: ["text", "json"]
        }
    }
});
