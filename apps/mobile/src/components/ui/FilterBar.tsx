import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, radius, spacing, typography } = mobileTheme;

interface FilterItem {
  id: string;
  label: string;
}

interface FilterBarProps {
  filters: FilterItem[];
  activeFilters: string[];
  onToggle: (id: string) => void;
  testID?: string;
}

export function FilterBar({ filters, activeFilters, onToggle, testID }: FilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      testID={testID}
    >
      {filters.map((filter) => {
        const isActive = activeFilters.includes(filter.id);
        return (
          <Pressable
            key={filter.id}
            onPress={() => onToggle(filter.id)}
            style={[styles.chip, isActive ? styles.activeChip : styles.inactiveChip]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={filter.label}
          >
            <Text style={[styles.chipText, isActive ? styles.activeText : styles.inactiveText]}>
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  activeChip: {
    backgroundColor: colors.primary,
  },
  inactiveChip: {
    backgroundColor: colors.muted,
  },
  chipText: {
    fontSize: typography.label,
    fontWeight: '600',
  },
  activeText: {
    color: colors.primaryForeground,
  },
  inactiveText: {
    color: colors.primary,
  },
});
