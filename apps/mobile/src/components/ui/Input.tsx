import { forwardRef } from 'react';
import type { TextInputProps } from 'react-native';
import { StyleSheet, TextInput } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';

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
      style={[styles.base, invalid && styles.invalid, !isEditable && styles.disabled, style]}
      className={className}
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: mobileTheme.radius.md,
    borderWidth: 1,
    borderColor: mobileTheme.colors.input,
    backgroundColor: mobileTheme.colors.card,
    color: mobileTheme.colors.foreground,
    paddingHorizontal: mobileTheme.spacing.md,
    paddingVertical: mobileTheme.spacing.sm,
    fontSize: mobileTheme.typography.body,
  },
  invalid: {
    borderColor: mobileTheme.colors.danger,
  },
  disabled: {
    opacity: 0.6,
  },
});
