import { cva } from 'class-variance-authority';
import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

const chipVariants = cva('px-lg py-sm rounded-full', {
  variants: {
    active: {
      true: 'bg-foreground',
      false: 'bg-muted border border-border',
    },
  },
  defaultVariants: { active: false },
});

const textVariants = cva('text-label font-sans-semibold', {
  variants: {
    active: {
      true: 'text-background',
      false: 'text-foreground',
    },
  },
  defaultVariants: { active: false },
});

interface FilterItem {
  id: string;
  label: string;
}

interface FilterBarProps {
  filters: FilterItem[];
  activeFilters: string[];
  onToggle: (id: string) => void;
  testID?: string;
  className?: string;
}

export function FilterBar({ filters, activeFilters, onToggle, testID, className }: FilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName={cn('px-lg gap-sm items-center', className)}
      testID={testID}
    >
      {filters.map((filter) => {
        const isActive = activeFilters.includes(filter.id);
        return (
          <Pressable
            key={filter.id}
            onPress={() => onToggle(filter.id)}
            className={chipVariants({ active: isActive })}
            style={{ minHeight: mobileTheme.iconSizes.touchTargetMin }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={filter.label}
          >
            <Text className={textVariants({ active: isActive })}>{filter.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
