import * as React from 'react';

import { cn } from '../../lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-12 w-full rounded-md border-[1.5px] border-border bg-background px-4 py-3 text-body font-sans text-foreground transition-colors duration-sheet-close ease-sheet-close',
        'placeholder:text-text-tertiary focus-visible:outline-none focus-visible:border-foreground',
        'aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-disabled',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
