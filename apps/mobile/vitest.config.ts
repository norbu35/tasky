import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    include: ['__tests__/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    deps: {
      inline: [
        /react-native/,
        /@react-native/,
        /expo/,
        /@expo/,
        /nativewind/,
        /react-native-reanimated/,
        /react-native-worklets/,
      ],
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts'],
      thresholds: {
        lines: 60,
        functions: 55,
        branches: 55,
        statements: 60,
      },
      reporter: ['text', 'json'],
    },
  },
});
