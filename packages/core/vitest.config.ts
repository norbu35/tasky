import { defineConfig } from 'vitest/config';
import { baseTestConfig } from '@tasky/tooling-config/vitest/base';

export default defineConfig({
  test: {
    ...baseTestConfig,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      ...baseTestConfig.coverage,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/index.ts'],
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
  },
});
