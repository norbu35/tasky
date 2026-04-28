import { AlertTriangle } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';

import { Button } from '../ui/Button';
import { Reveal } from '../ui/Reveal';

const { colors } = mobileTheme;

export interface ErrorStateTemplateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onBack?: () => void;
  testID?: string;
  className?: string;
}

export function ErrorStateTemplate({
  message,
  onRetry,
  retryLabel,
  onBack,
  testID,
  className,
}: ErrorStateTemplateProps) {
  const { t } = useTranslation();

  return (
    <View className={cn('flex-1 justify-center items-center px-lg', className)} testID={testID}>
      <Reveal delay={20}>
        <AlertTriangle size={24} color={colors.danger} />
      </Reveal>
      <Reveal delay={60}>
        <Text className="text-body font-sans text-foreground text-center mt-lg leading-relaxed">
          {message ?? t('error.generic')}
        </Text>
      </Reveal>
      {onRetry && (
        <Reveal delay={100} className="self-stretch">
          <Button
            label={retryLabel ?? t('error.retry')}
            onPress={onRetry}
            className="mt-xl self-stretch"
            testID={testID ? `${testID}-retry` : undefined}
          />
        </Reveal>
      )}
      {onBack && (
        <Reveal delay={140} className="self-stretch">
          <Button
            label={t('error.goBack')}
            variant="outline"
            onPress={onBack}
            className="mt-md self-stretch"
            testID={testID ? `${testID}-back` : undefined}
          />
        </Reveal>
      )}
    </View>
  );
}
