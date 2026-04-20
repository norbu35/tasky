import React from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import { Button } from '../ui/Button';
import { Reveal } from '../ui/Reveal';

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
        <Reveal delay={20}>
          <View className="w-20 h-20 rounded-full bg-muted justify-center items-center mb-xl">
            {icon}
          </View>
        </Reveal>
      )}
      <Reveal delay={60}>
        <Text className="text-title font-display-bold text-foreground text-center">{title}</Text>
      </Reveal>
      {description && (
        <Reveal delay={100}>
          <Text className="text-body text-text-secondary text-center mt-sm leading-relaxed">
            {description}
          </Text>
        </Reveal>
      )}
      {ctaLabel && ctaOnPress && (
        <Reveal delay={140} className="self-stretch">
          <Button
            label={ctaLabel}
            onPress={ctaOnPress}
            style={{ alignSelf: 'stretch', marginTop: 24 }}
            testID={testID ? `${testID}-cta` : undefined}
          />
        </Reveal>
      )}
    </View>
  );
}
