import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import-x';
import unusedImports from 'eslint-plugin-unused-imports';
import security from 'eslint-plugin-security';
import noSecrets from 'eslint-plugin-no-secrets';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
      'unused-imports': unusedImports,
      security,
      'no-secrets': noSecrets,
    },
    rules: {
      // Import sorting
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [{ pattern: '@tasky/**', group: 'internal', position: 'before' }],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',

      // Unused imports — auto-fixable
      'unused-imports/no-unused-imports': 'warn',

      // Security
      'security/detect-eval-with-expression': 'error',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'no-secrets/no-secrets': ['warn', { tolerance: 4.5 }],

      // TypeScript already handles this — disable base ESLint rule
      'no-undef': 'off',
    },
  },
  prettierConfig,
];
