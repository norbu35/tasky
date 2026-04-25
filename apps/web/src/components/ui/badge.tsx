import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-badge font-semibold transition-colors duration-badge-pop ease-badge-pop focus:outline-none focus:ring-[length:var(--interaction-focused-ring-width)] focus:ring-ring focus:ring-offset-[length:var(--interaction-focused-ring-offset)]',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:opacity-hover',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:opacity-hover',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:opacity-hover',
        outline: 'text-foreground',
        statusOpen:
          'border-transparent bg-status-open text-status-open-fg font-sans uppercase tracking-caps',
        statusAssigned:
          'border-transparent bg-status-assigned text-status-assigned-fg font-sans uppercase tracking-caps',
        statusCompleted:
          'border-transparent bg-status-completed text-status-completed-fg font-sans uppercase tracking-caps',
        statusCancelled:
          'border-transparent bg-status-cancelled text-status-cancelled-fg font-sans uppercase tracking-caps',
        noShow:
          'border-transparent bg-destructive text-destructive-foreground font-sans uppercase tracking-caps',
        verified: 'border-transparent bg-verified text-verified-foreground font-sans',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants };
