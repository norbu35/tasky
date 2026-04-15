import { forwardRef } from 'react';
import type { TextInputProps } from 'react-native';
import { TextInput } from 'react-native';

import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

type Props = TextInputProps & {
  invalid?: boolean;
  readOnly?: boolean;
  className?: string;
};

export const Input = forwardRef<TextInput, Props>(function Input(
  { invalid = false, editable = true, readOnly = false, style, className, ...props },
  ref,
) {
  const isEditable = editable && !readOnly;

  return (
    <TextInput
      ref={ref}
      editable={isEditable}
      placeholderTextColor={mobileTheme.colors.mutedForeground}
      style={style}
      className={cn(
        'min-h-[44px] rounded-md border border-input bg-card text-foreground px-md py-sm text-body font-sans',
        invalid && 'border-danger',
        !isEditable && 'opacity-60',
        className,
      )}
      {...props}
    />
  );
});
