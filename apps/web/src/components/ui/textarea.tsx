import * as React from 'react';

import { cn } from '../../lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'flex min-h-24 w-full rounded-sm border-[1.5px] border-border bg-background px-3 py-2 text-base font-sans text-foreground',
      'placeholder:text-text-tertiary focus-visible:outline-none focus-visible:border-foreground',
      'aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Textarea };
