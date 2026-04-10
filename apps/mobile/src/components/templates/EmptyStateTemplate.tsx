import React from 'react';
import { Text, View } from 'react-native';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';

export interface EmptyStateTemplateProps {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaOnPress?: () => void;
  icon?: React.ReactNode;
  testID?: string;
  className?: string;
}

export function EmptyStateTemplate({
  title,
  description,
  ctaLabel,
  ctaOnPress,
  icon,
  testID,
  className,
}: EmptyStateTemplateProps) {
  return (
    <View className={cn('flex-1 justify-center items-center px-lg', className)} testID={testID}>
      {icon && (
        <View className="w-20 h-20 rounded-full bg-muted justify-center items-center mb-xl">
          {icon}
        </View>
      )}
      <Text className="text-title font-bold text-primary text-center">{title}</Text>
      {description && (
        <Text className="text-body text-text-secondary text-center mt-sm leading-relaxed">
          {description}
        </Text>
      )}
      {ctaLabel && ctaOnPress && (
        <Button
          label={ctaLabel}
          onPress={ctaOnPress}
          style={{ alignSelf: 'stretch', marginTop: 24 }}
          testID={testID ? `${testID}-cta` : undefined}
        />
      )}
    </View>
  );
}
