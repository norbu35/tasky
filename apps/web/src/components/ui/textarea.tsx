import * as React from 'react';

import { cn } from '../../lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'flex min-h-24 w-full rounded-lg border-[1.5px] border-border bg-background px-4 py-3 text-body font-sans text-foreground',
      'transition-colors duration-sheet-close ease-sheet-close',
      'placeholder:text-text-tertiary',
      'focus-visible:outline-none focus-visible:border-foreground',
      'aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-disabled',
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Textarea };
