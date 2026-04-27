import { extendTailwindMerge } from 'tailwind-merge';

// Custom tailwind-merge config for NativeWind v4 tokens.
// Font-family and spacing tokens here are pre-configured for tokens
// added in tailwind.config.ts (Task 3 of the mobile UI centralization plan).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-family': [
        {
          font: ['sans', 'sans-medium', 'sans-semibold', 'sans-bold', 'display', 'display-bold'],
        },
      ],
      'font-size': [
        {
          text: [
            'display-xl',
            'display-lg',
            'heading-1',
            'heading-2',
            'heading-3',
            'hero-title',
            'heading',
            'title',
            'subtitle',
            'body-lg',
            'body',
            'body-sm',
            'label',
            'label-ui',
            'caption',
            'overline',
            'micro',
            'nav-label',
            'page-heading',
            'section-heading',
            'card-title',
            'body-default',
            'body-emphasis',
            'button-label',
            'price-display',
            'badge-text',
          ],
        },
        {
          font: [
            'screen-greeting',
            'screen-title',
            'screen-section',
            'screen-card-title',
            'screen-subtitle',
            'screen-label',
          ],
        },
      ],
      gap: [
        {
          gap: [
            'section',
            'block',
            'item',
            'micro',
            'action-buttons',
            'header-greeting',
            'header-title',
            'header-bottom',
          ],
        },
      ],
      p: [{ p: ['card', 'action-bar'] }],
      px: [{ px: ['screen-x', 'action-bar'] }],
      pt: [{ pt: ['header-top', 'action-bar'] }],
      pb: [{ pb: ['header-bottom'] }],
      opacity: [{ opacity: ['pressed', 'hover', 'disabled'] }],
      scale: [{ scale: ['pressed'] }],
    },
  },
});

export const cn = (...inputs: (string | undefined | false)[]) =>
  twMerge(inputs.filter(Boolean).join(' '));
