import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '../../lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer items-center rounded-full',
      'border-2 border-transparent',
      'transition-colors duration-sheet-close ease-sheet-close',
      'focus-visible:outline-none focus-visible:ring-[length:var(--interaction-focused-ring-width)] focus-visible:ring-ring focus-visible:ring-offset-[length:var(--interaction-focused-ring-offset)] focus-visible:ring-offset-background',
      'disabled:cursor-not-allowed disabled:opacity-disabled',
      'data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted',
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-4 w-4 rounded-full bg-background',
        'shadow-elevated',
        'ring-0 transition-transform duration-sheet-close ease-sheet-close',
        'data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-[2px]',
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
