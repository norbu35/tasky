import React from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { Search } from 'lucide-react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';

export interface SearchBarProps extends TextInputProps {
  className?: string;
  containerClassName?: string;
}

const { colors, spacing } = mobileTheme;

export function SearchBar({ className, containerClassName, ...props }: SearchBarProps) {
  return (
    <View
      className={cn('flex-row items-center bg-muted rounded-xl px-md py-sm', containerClassName)}
    >
      <Search size={20} color={colors.textTertiary} style={{ marginRight: spacing.sm }} />
      <TextInput
        className={cn('flex-1 text-body text-foreground p-0 m-0', className)}
        placeholderTextColor={colors.textTertiary}
        {...props}
      />
    </View>
  );
}
