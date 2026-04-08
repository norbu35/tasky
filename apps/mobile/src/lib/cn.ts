import { extendTailwindMerge } from 'tailwind-merge';

// Custom tailwind-merge config for NativeWind v4 tokens.
// Font-family and spacing tokens here are pre-configured for tokens
// added in tailwind.config.ts (Task 3 of the mobile UI centralization plan).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-family': [
        {
          font: [
            'sans',
            'sans-medium',
            'sans-semibold',
            'sans-bold',
            'display',
            'display-bold',
          ],
        },
      ],
      gap: [{ gap: ['section', 'block', 'item', 'micro', 'action-buttons', 'header-greeting', 'header-title', 'header-bottom'] }],
      p: [{ p: ['card', 'action-bar'] }],
      px: [{ px: ['screen-x'] }],
      pt: [{ pt: ['header-top'] }],
      pb: [{ pb: ['header-bottom'] }],
    },
  },
});

export const cn = (...inputs: (string | undefined | false)[]) =>
  twMerge(inputs.filter(Boolean).join(' '));
