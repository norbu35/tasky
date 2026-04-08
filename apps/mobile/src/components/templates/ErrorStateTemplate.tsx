import React from 'react';
import { Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../design/tokenAdapter';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';

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
      <AlertTriangle size={48} color={colors.danger} />
      <Text className="text-body text-primary text-center mt-lg leading-relaxed">
        {message ?? t('error.generic', 'Something went wrong')}
      </Text>
      {onRetry && (
        <Button
          label={retryLabel ?? t('error.retry', 'Try again')}
          onPress={onRetry}
          style={{ marginTop: 24, alignSelf: 'stretch' }}
          testID={testID ? `${testID}-retry` : undefined}
        />
      )}
      {onBack && (
        <Button
          label={t('error.goBack', 'Go back')}
          variant="outline"
          onPress={onBack}
          style={{ marginTop: 12, alignSelf: 'stretch' }}
          testID={testID ? `${testID}-back` : undefined}
        />
      )}
    </View>
  );
}
