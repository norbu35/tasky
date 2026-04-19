import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold transition-all duration-200 active:opacity-85 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none ring-offset-background',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[var(--shadow-fab)] hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'bg-transparent text-primary border-[1.5px] border-border hover:bg-muted',
        secondary: 'bg-sun-light text-white hover:bg-sun-light/90',
        ghost: 'bg-transparent text-primary hover:bg-muted',
      },
      size: {
        default: 'h-12 px-4 py-2',
        sm: 'h-10 rounded-md px-3',
        lg: 'h-14 rounded-md px-8',
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
