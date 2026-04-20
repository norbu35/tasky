import { MapPin } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

const { colors } = mobileTheme;

interface LocationPinProps {
  text: string;
  compact?: boolean;
  testID?: string;
  className?: string;
}

export function LocationPin({ text, compact = false, testID, className }: LocationPinProps) {
  return (
    <View
      className={cn('flex-row items-center gap-xs', className)}
      testID={testID}
      accessibilityLabel={text}
    >
      <MapPin size={16} color={colors.accent} />
      <Text
        className={cn('text-label text-text-secondary shrink', compact && 'text-caption')}
        numberOfLines={compact ? 1 : undefined}
      >
        {text}
      </Text>
    </View>
  );
}
