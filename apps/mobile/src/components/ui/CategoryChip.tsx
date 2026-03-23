import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, radius, typography } = mobileTheme;

interface CategoryChipProps {
  label: string;
  isActive?: boolean;
  onPress?: () => void;
}

export function CategoryChip({ label, isActive = false, onPress }: CategoryChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, isActive ? styles.active : styles.inactive]}>
      <Text style={[styles.text, isActive ? styles.activeText : styles.inactiveText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  active: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 3,
  },
  inactive: {
    backgroundColor: colors.chipInactive,
  },
  text: {
    fontSize: typography.label,
    fontWeight: '600',
  },
  activeText: {
    color: colors.primaryForeground,
  },
  inactiveText: {
    color: colors.mutedForeground,
  },
});
