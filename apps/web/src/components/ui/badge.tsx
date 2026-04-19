import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        statusOpen:
          'border-transparent bg-status-open text-status-open-fg font-sans uppercase tracking-[0.075em]',
        statusAssigned:
          'border-transparent bg-status-assigned text-status-assigned-fg font-sans uppercase tracking-[0.075em]',
        statusCompleted:
          'border-transparent bg-status-completed text-status-completed-fg font-sans uppercase tracking-[0.075em]',
        statusCancelled:
          'border-transparent bg-status-cancelled text-status-cancelled-fg font-sans uppercase tracking-[0.075em]',
        noShow:
          'border-transparent bg-destructive text-destructive-foreground font-sans uppercase tracking-[0.075em]',
        verified: 'border-transparent bg-verified text-white font-sans',
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
