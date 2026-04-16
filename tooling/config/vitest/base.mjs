export const baseTestConfig = {
  environment: 'jsdom',
  globals: true,
  coverage: {
    provider: 'v8',
    thresholds: { lines: 60, functions: 55, branches: 55, statements: 60 },
    reporter: ['text', 'json'],
  },
};
