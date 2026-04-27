import { Search } from 'lucide-react-native';
import React from 'react';
import { View, TextInput, TextInputProps } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

export interface SearchBarProps extends TextInputProps {
  className?: string;
  containerClassName?: string;
}

const { colors, spacing } = mobileTheme;

export function SearchBar({ className, containerClassName, ...props }: SearchBarProps) {
  return (
    <View
      className={cn('min-h-12 flex-row items-center bg-muted rounded-lg px-md', containerClassName)}
    >
      <Search size={20} color={colors.textTertiary} style={{ marginRight: spacing.sm }} />
      <TextInput
        className={cn('flex-1 text-body text-foreground font-sans p-0 m-0', className)}
        placeholderTextColor={colors.textTertiary}
        {...props}
      />
    </View>
  );
}
