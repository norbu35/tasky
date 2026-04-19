import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

import { baseTestConfig } from '@tasky/tooling-config/vitest/base';

export default defineConfig({
  plugins: [react()],
  test: {
    ...baseTestConfig,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    // Integration tests (tests/integration/) render the full <App> tree with
    // React Router, i18n, and mock API clients. They are CPU- and memory-
    // intensive. Running them in vitest's default thread pool causes
    // intermittent timeouts under load. Use a single thread and give each
    // test a generous timeout to keep CI green.
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    testTimeout: 15_000,
    coverage: {
      ...baseTestConfig.coverage,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.d.ts', 'src/main.tsx', 'src/lib/apiTypes.ts'],
    },
  },
});
