import React from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';

import { Reveal } from './Reveal';

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
    <Reveal
      delay={20}
      testID={testID}
      className={cn('flex-row items-start justify-between', className)}
    >
      <View className="flex-1 gap-header-greeting">
        {greeting && <Text className="font-screen-greeting text-primary">{greeting}</Text>}
        <Text className="font-screen-title text-primary-deep">{title}</Text>
        {subtitle && (
          <Text className="text-body text-text-secondary mt-header-title">{subtitle}</Text>
        )}
      </View>
      {rightSlot}
    </Reveal>
  );
}
