import _baseConfig from './base.mjs';
import queryPlugin from '@tanstack/eslint-plugin-query';

// eslint-config-expo must be imported dynamically at the consumer level
// because it requires expo to be installed. This config provides the base rules
// and the mobile-specific overrides that get spread into the consumer's flat config.

export const baseConfig = [..._baseConfig, ...queryPlugin.configs['flat/recommended']];

export const mobileOverrides = [
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
    },
  },
  {
    files: ['src/app/(tabs)/_layout.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['src/app/(auth)/otp.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
];
