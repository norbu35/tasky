import expoFlat from 'eslint-config-expo/flat.js';
import { baseConfig, mobileOverrides } from '@tasky/tooling-config/eslint/react-native';

// Drop Expo entries that register plugins already provided by baseConfig.
// ESLint 9 flat config forbids registering the same plugin name twice.
// baseConfig already provides @typescript-eslint and import plugin rules.
const expoWithoutTs = expoFlat.filter(
  (entry) =>
    !(
      entry.plugins &&
      (entry.plugins['@typescript-eslint'] !== undefined || entry.plugins.import !== undefined)
    ),
);

export default [
  ...expoWithoutTs,
  ...baseConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@tanstack/query/exhaustive-deps': 'warn',
    },
  },
  ...mobileOverrides,
  { ignores: ['.expo/', 'dist/', 'coverage/'] },
];
