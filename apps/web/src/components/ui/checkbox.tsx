import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'grid place-content-center peer h-icon-sm w-icon-sm shrink-0 rounded-md',
      'border-[1.5px] border-border bg-background',
      'ring-offset-background transition-all duration-sheet-close ease-sheet-close',
      'focus-visible:outline-none focus-visible:ring-[length:var(--interaction-focused-ring-width)] focus-visible:ring-ring focus-visible:ring-offset-[length:var(--interaction-focused-ring-offset)]',
      'disabled:cursor-not-allowed disabled:opacity-disabled',
      'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn('grid place-content-center text-current')}>
      <Check className="h-icon-xs w-icon-xs" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
