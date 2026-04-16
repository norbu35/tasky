import baseConfig from './base.mjs';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import queryPlugin from '@tanstack/eslint-plugin-query';
import globals from 'globals';

export default [
  ...baseConfig, // already includes eslint-config-prettier as the last entry
  {
    ...reactPlugin.configs.flat['jsx-runtime'],
    settings: { react: { version: 'detect' } },
  },
  ...queryPlugin.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
];
