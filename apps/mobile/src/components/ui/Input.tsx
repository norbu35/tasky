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
  { invalid = false, editable = true, readOnly = false, style, className, multiline, ...props },
  ref,
) {
  const isEditable = editable && !readOnly;
  const heightClass = multiline ? 'min-h-[48px]' : 'h-12';

  return (
    <TextInput
      ref={ref}
      editable={isEditable}
      multiline={multiline}
      placeholderTextColor={mobileTheme.colors.textTertiary}
      style={[!isEditable && { opacity: mobileTheme.interaction.disabled.opacity }, style]}
      className={cn(
        'rounded-sm border-[1.5px] border-border bg-background px-md py-sm text-body font-sans text-foreground',
        heightClass,
        invalid && 'border-danger',
        className,
      )}
      {...props}
    />
  );
});
