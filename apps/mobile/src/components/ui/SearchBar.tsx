import { Search } from 'lucide-react-native';
import React from 'react';
import { View, TextInput, TextInputProps } from 'react-native';

import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

export interface SearchBarProps extends TextInputProps {
  /** Elevated pill style (Airbnb-style prominent search bar with shadow). */
  elevated?: boolean;
  className?: string;
  containerClassName?: string;
}

const { colors, iconSizes, spacing } = mobileTheme;

export function SearchBar({
  elevated = false,
  className,
  containerClassName,
  ...props
}: SearchBarProps) {
  return (
    <View
      className={cn(
        'flex-row items-center px-md',
        elevated ? 'min-h-[52px] bg-card rounded-full' : 'min-h-12 bg-muted rounded-lg',
        containerClassName,
      )}
      style={elevated ? elevations.card : undefined}
    >
      <Search
        size={iconSizes.semantic.inputIcon}
        color={colors.textTertiary}
        style={{ marginRight: spacing.sm }}
      />
      <TextInput
        className={cn('flex-1 text-body text-foreground font-sans p-0 m-0', className)}
        placeholderTextColor={colors.textTertiary}
        {...props}
      />
    </View>
  );
}
