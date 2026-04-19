import { cva } from 'class-variance-authority';
import React from 'react';
import { Pressable, Text } from 'react-native';

import { cn } from '../../lib/cn';

const chipVariants = cva('px-xl py-sm rounded-full', {
  variants: {
    active: {
      true: 'bg-primary',
      false: 'bg-muted',
    },
  },
  defaultVariants: { active: false },
});

const textVariants = cva('text-label font-sans-semibold', {
  variants: {
    active: {
      true: 'text-primary-foreground',
      false: 'text-foreground',
    },
  },
  defaultVariants: { active: false },
});

interface CategoryChipProps {
  label: string;
  isActive?: boolean;
  onPress?: () => void;
  testID?: string;
  className?: string;
}

export function CategoryChip({
  label,
  isActive = false,
  onPress,
  testID,
  className,
}: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(chipVariants({ active: isActive }), className)}
      testID={testID}
      accessibilityRole="button"
    >
      <Text className={textVariants({ active: isActive })}>{label}</Text>
    </Pressable>
  );
}
