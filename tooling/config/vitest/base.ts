export const baseTestConfig = {
  environment: 'jsdom' as const,
  globals: true,
  coverage: {
    provider: 'v8' as const,
    thresholds: { lines: 60, functions: 55, branches: 55, statements: 60 },
    reporter: ['text', 'json'],
  },
};
