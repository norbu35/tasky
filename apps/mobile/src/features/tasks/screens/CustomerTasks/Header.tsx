import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { NotificationBellButton } from '@/features/notifications/components/NotificationBellButton';
import { ReviewGateBanner } from '@/features/review/components/ReviewGateBanner';
import { useReviewGate } from '@/features/review/components/ReviewGateProvider';

import { type TaskState } from './model';

const { colors } = mobileTheme;

export function Header({ counts }: { counts: Record<TaskState, number> }) {
  const { t } = useTranslation();
  const { hasPending, oldestPending } = useReviewGate();

  return (
    <View className="px-screen-x pt-header-top pb-header-bottom gap-item">
      <ScreenHeader
        greeting={t('customer.taskList.greeting')}
        title={t('customer.taskList.title')}
        rightSlot={<NotificationBellButton testID="my-tasks-notifications" />}
      />

      {hasPending && oldestPending && <ReviewGateBanner pendingReview={oldestPending} />}

      <View className="rounded-lg p-card gap-item bg-card" style={elevations.soft}>
        <Text className="text-subtitle font-extrabold text-primary-deep">
          {t('customer.taskList.heroEyebrow')}
        </Text>
        <Text className="text-body text-text-secondary leading-relaxed">
          {t('customer.taskList.heroTitle')}
        </Text>
        <View className="flex-row gap-sm">
          {(
            [
              { key: 'open', label: t('customer.taskList.filterOpen') },
              { key: 'assigned', label: t('customer.taskList.filterAssigned') },
              { key: 'completed', label: t('customer.taskList.filterCompleted') },
            ] as { key: TaskState; label: string }[]
          ).map(({ key, label }) => (
            <View
              key={key}
              className="flex-1 rounded-md py-sm px-sm"
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <Text className="text-subtitle font-extrabold text-primary-deep">{counts[key]}</Text>
              <Text className="text-caption text-text-secondary">{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
