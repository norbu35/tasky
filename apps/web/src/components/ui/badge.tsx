import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-semibold transition-colors duration-badge-pop ease-badge-pop focus:outline-none focus:ring-[length:var(--interaction-focused-ring-width)] focus:ring-ring focus:ring-offset-[length:var(--interaction-focused-ring-offset)] ring-offset-background',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow-card hover:opacity-hover',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground shadow-card hover:opacity-hover',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow-card hover:opacity-hover',
        outline: 'text-foreground',
        statusOpen: 'border-transparent bg-status-open text-status-open-fg',
        statusAssigned: 'border-transparent bg-status-assigned text-status-assigned-fg shadow-card',
        statusCompleted:
          'border-transparent bg-status-completed text-status-completed-fg shadow-card',
        statusCancelled: 'border-transparent bg-status-cancelled text-status-cancelled-fg',
        noShow: 'border-transparent bg-destructive text-destructive-foreground shadow-card',
        verified: 'border-transparent bg-verified text-verified-foreground shadow-card',
      },
      size: {
        sm: 'px-1.5 py-0 text-[10px] leading-tight',
        md: 'px-2 py-0.5 text-badge-text',
        lg: 'px-3 py-1 text-badge-text',
      },
      isCaps: {
        true: 'uppercase tracking-caps font-sans',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      isCaps: false,
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, isCaps, ...props }: BadgeProps) {
  // Automatically apply caps to status variants if not explicitly set
  const autoCaps = isCaps ?? (variant?.toString().startsWith('status') || variant === 'noShow');

  return (
    <div className={cn(badgeVariants({ variant, size, isCaps: autoCaps, className }))} {...props} />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants };
