import { defineConfig } from 'vitest/config';
import { baseTestConfig } from '@tasky/tooling-config/vitest/base';

export default defineConfig({
  test: {
    ...baseTestConfig,
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
      ...baseTestConfig.coverage,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts'],
    },
  },
});
