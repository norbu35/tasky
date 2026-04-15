import baseConfig from '@tasky/tooling-config/eslint/base';

export default [
  ...baseConfig,
  {
    ignores: [
      'build/',
      'dist/',
      'node_modules/',
      '.worktrees/',
      'apps/',
      'packages/',
      'services/',
      'tooling/',
      'archive/',
      'research/',
    ],
  },
];
