import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-touch-target-min items-center justify-center whitespace-nowrap rounded-lg text-button font-semibold transition-all duration-sheet-close ease-sheet-close active:opacity-pressed active:scale-pressed focus-visible:outline-none focus-visible:ring-[length:var(--interaction-focused-ring-width)] focus-visible:ring-ring focus-visible:ring-offset-[length:var(--interaction-focused-ring-offset)] disabled:pointer-events-none disabled:opacity-disabled disabled:shadow-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-fab hover:opacity-hover',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-hover',
        outline: 'bg-transparent text-primary border-[1.5px] border-border hover:bg-muted',
        secondary: 'bg-sun-light text-secondary-foreground hover:opacity-hover',
        ghost: 'bg-transparent text-primary hover:bg-muted',
      },
      size: {
        default: 'h-12 rounded-xl px-4 py-2',
        sm: 'h-10 rounded-lg px-3',
        lg: 'h-14 rounded-xl px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
