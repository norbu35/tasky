import type { Config } from 'tailwindcss';
import { nativeTokens } from '@tasky/design-tokens';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
    './src/providers/**/*.{ts,tsx}',
    './src/store/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: nativeTokens.colors,
      spacing: nativeTokens.spacing,
      borderRadius: nativeTokens.radius,
      fontFamily: {
        sans: [nativeTokens.typography.families.sans],
        display: [nativeTokens.typography.families.display],
      },
      fontSize: nativeTokens.typography.scale,
    },
  },
  plugins: [],
};

export default config;
