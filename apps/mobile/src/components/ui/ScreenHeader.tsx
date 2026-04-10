import React from 'react';
import { Text, View } from 'react-native';
import { cn } from '../../lib/cn';

interface ScreenHeaderProps {
  greeting?: string;
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  testID?: string;
  className?: string;
}

export function ScreenHeader({
  greeting,
  title,
  subtitle,
  rightSlot,
  testID,
  className,
}: ScreenHeaderProps) {
  return (
    <View className={cn('flex-row items-start justify-between', className)} testID={testID}>
      <View className="flex-1 gap-header-greeting">
        {greeting && (
          <Text className="font-screen-greeting text-text-secondary">{greeting}</Text>
        )}
        <Text className="font-screen-title text-primary-deep">{title}</Text>
        {subtitle && (
          <Text className="text-body text-text-secondary mt-header-title">{subtitle}</Text>
        )}
      </View>
      {rightSlot}
    </View>
  );
}
