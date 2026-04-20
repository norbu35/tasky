import { Sparkles } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

const { colors } = mobileTheme;

export function EmptyState({ onPostTask }: { onPostTask: () => void }) {
  const { t } = useTranslation();

  return (
    <View
      className="mx-screen-x mt-block rounded-lg p-section items-center gap-item bg-card"
      style={elevations.soft}
      testID="my-tasks-empty-state"
    >
      <View
        className="w-16 h-16 rounded-full items-center justify-center"
        style={{ backgroundColor: `${colors.primary}12` }}
      >
        <Sparkles size={24} color={colors.primary} />
      </View>
      <Text className="text-subtitle font-extrabold text-primary-deep text-center">
        {t('customer.taskList.emptyTitle')}
      </Text>
      <Text className="text-body text-text-secondary text-center leading-relaxed">
        {t('customer.taskList.emptyDescription')}
      </Text>
      <Touchable
        onPress={onPostTask}
        className="px-xl rounded-md items-center justify-center bg-primary"
        style={{ minHeight: mobileSurfaces.touchTarget.ctaHeight }}
        accessibilityRole="button"
        testID="my-tasks-feed-empty-cta"
      >
        <Text className="text-body font-bold text-primary-foreground">
          {t('customer.taskList.emptyCta')}
        </Text>
      </Touchable>
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <View
      className="mx-screen-x mt-block rounded-lg p-section gap-item bg-card"
      style={elevations.soft}
      testID="my-tasks-error-state"
    >
      <Text className="text-subtitle font-extrabold text-primary-deep">
        {t('customer.taskList.errorTitle')}
      </Text>
      <Text className="text-body text-text-secondary leading-relaxed">
        {t('customer.taskList.errorNetwork')}
      </Text>
      <Touchable
        onPress={onRetry}
        className="rounded-md items-center justify-center bg-secondary"
        style={{ minHeight: mobileSurfaces.touchTarget.ctaHeight }}
        accessibilityRole="button"
        testID="my-tasks-feed-error-cta"
      >
        <Text className="text-body font-bold text-secondary-foreground">
          {t('common.tryAgain')}
        </Text>
      </Touchable>
    </View>
  );
}
