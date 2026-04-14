import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { baseTestConfig } from '@tasky/tooling-config/vitest/base';

export default defineConfig({
  plugins: [react()],
  test: {
    ...baseTestConfig,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    coverage: {
      ...baseTestConfig.coverage,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.d.ts', 'src/main.tsx', 'src/lib/apiTypes.ts'],
    },
  },
});
