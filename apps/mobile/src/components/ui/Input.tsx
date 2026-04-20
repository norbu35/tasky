import { forwardRef } from 'react';
import type { TextInputProps } from 'react-native';
import { TextInput } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

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
      placeholderTextColor={mobileTheme.colors.textTertiary}
      style={style}
      className={cn(
        'h-12 rounded-sm border-[1.5px] border-border bg-background px-md py-sm text-body font-sans text-foreground',
        invalid && 'border-danger',
        !isEditable && 'opacity-60',
        className,
      )}
      {...props}
    />
  );
});
