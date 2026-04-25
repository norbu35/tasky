import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '../../lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-icon-md w-touch-target-min shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-sheet-close ease-sheet-close focus-visible:outline-none focus-visible:ring-[length:var(--interaction-focused-ring-width)] focus-visible:ring-foreground focus-visible:ring-offset-[length:var(--interaction-focused-ring-offset)] focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-disabled data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted',
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-icon-sm w-icon-sm rounded-full bg-background shadow-card ring-0 transition-transform duration-sheet-close ease-sheet-close data-[state=checked]:translate-x-icon-sm data-[state=unchecked]:translate-x-0',
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
