import * as React from 'react';

import { cn } from '../../lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-12 w-full rounded-lg border-[1.5px] border-border/60 bg-muted/20 px-4 py-3',
        'text-body font-sans text-foreground',
        'transition-all duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]',
        'placeholder:text-muted-foreground/50',
        'hover:border-border hover:bg-muted/30',
        'focus-visible:outline-none focus-visible:bg-background focus-visible:border-foreground/40',
        'focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20',
        'disabled:cursor-not-allowed disabled:opacity-disabled',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
