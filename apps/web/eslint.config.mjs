import reactConfig from '@tasky/tooling-config/eslint/react';

export default [
  ...reactConfig,
  { ignores: ['dist/', 'coverage/', 'playwright-report/', 'test-results/'] },
];
