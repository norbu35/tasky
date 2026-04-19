import React from 'react';
import { Text, View } from 'react-native';

import { cn } from '../../lib/cn';

interface InfoRowProps {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
  testID?: string;
  className?: string;
}

export function InfoRow({ label, value, icon, testID, className }: InfoRowProps) {
  const isStringValue = typeof value === 'string';

  return (
    <View
      className={cn('flex-row items-center justify-between py-md', className)}
      testID={testID}
      accessibilityLabel={isStringValue ? `${label}: ${value}` : label}
    >
      <View className="flex-row items-center shrink">
        {icon && <View className="mr-sm">{icon}</View>}
        <Text className="text-label font-sans text-text-tertiary">{label}</Text>
      </View>
      {isStringValue ? (
        <Text className="text-label font-sans-semibold text-foreground">{value}</Text>
      ) : (
        <View>{value}</View>
      )}
    </View>
  );
}
