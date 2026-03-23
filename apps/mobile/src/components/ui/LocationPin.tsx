import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

interface LocationPinProps {
  text: string;
  compact?: boolean;
  testID?: string;
}

export function LocationPin({ text, compact = false, testID }: LocationPinProps) {
  return (
    <View style={styles.container} testID={testID} accessibilityLabel={text}>
      <MapPin size={compact ? 14 : 16} color={colors.accent} />
      <Text
        style={[styles.text, compact && styles.compactText]}
        numberOfLines={compact ? 1 : undefined}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  text: {
    fontSize: typography.label,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  compactText: {
    fontSize: typography.caption,
  },
});
