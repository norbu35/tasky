import _baseConfig from './base.mjs';
import queryPlugin from '@tanstack/eslint-plugin-query';

// eslint-config-expo must be imported dynamically at the consumer level
// because it requires expo to be installed. This config provides the base rules
// and the mobile-specific overrides that get spread into the consumer's flat config.

export const baseConfig = [..._baseConfig, ...queryPlugin.configs['flat/recommended']];

export const mobileOverrides = [
  // ─── Route boundary enforcement ───
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: 'react-native',
              importNames: [
                'SafeAreaView',
                'TextInput',
                'TouchableOpacity',
                'TouchableHighlight',
                'TouchableWithoutFeedback',
                'Pressable',
              ],
              message:
                'Use shared primitives (ScreenContainer, Input, Button, Touchable, PressableCard) instead of raw RN components.',
            },
          ],
          patterns: [
            {
              group: ['**/mobileApiClient*'],
              importNames: ['createMobileApiClient'],
              message:
                'Route files must use the pre-wired API client from hooks (useApiClient), not create their own via createMobileApiClient.',
            },
            {
              group: ['**/features/*/api'],
              message:
                'Route files must import from feature index barrels, not directly from feature api.ts files.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create']",
          message: 'Screens must use NativeWind className instead of StyleSheet.create.',
        },
        {
          selector: "Property[key.name='fontSize'][value.type!='MemberExpression']",
          message:
            'Use typography classes (text-body, font-screen-card-title, etc.) instead of inline fontSize.',
        },
      ],
      'max-lines': [
        'warn',
        {
          max: 60,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  // Exclude layout files from max-lines (they are glue, not screen logic)
  {
    files: ['src/app/_layout.tsx', 'src/app/**/_layout.tsx'],
    rules: {
      'max-lines': 'off',
    },
  },
  // Existing per-file exemptions
  {
    files: ['src/app/(tabs)/_layout.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['src/app/(auth)/otp.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
  // ─── Component isolation ───
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['**/features/**'],
              message:
                'Components must not import from features. Use props/callbacks to pass data, or move the component into the feature module.',
            },
          ],
        },
      ],
    },
  },
  // ─── Design isolation ───
  {
    files: ['src/design/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['**/app/**', '**/features/**'],
              message:
                'Design primitives must not depend on app routes or feature modules. Keep the design layer dependency-free.',
            },
          ],
        },
      ],
    },
  },
  // ─── Future quarantine ───
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/future/**'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['**/future/**'],
              message:
                'Imports from src/future/ are quarantined. Future code is deferred and must not leak into active modules.',
            },
          ],
        },
      ],
    },
  },
];
