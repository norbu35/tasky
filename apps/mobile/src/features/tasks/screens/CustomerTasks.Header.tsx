import { Bell } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { ReviewGateBanner } from '@/features/review/components/ReviewGateBanner';
import { useReviewGate } from '@/features/review/components/ReviewGateProvider';

import { type TaskState } from './CustomerTasks.model';

const { colors } = mobileTheme;

export function Header({
  counts,
  onNotificationsPress,
}: {
  counts: Record<TaskState, number>;
  onNotificationsPress: () => void;
}) {
  const { t } = useTranslation();
  const { hasPending, oldestPending } = useReviewGate();

  return (
    <View className="px-screen-x pt-header-top pb-header-bottom gap-item">
      <ScreenHeader
        greeting={t('customer.taskList.greeting')}
        title={t('customer.taskList.title')}
        rightSlot={
          <Touchable
            className="w-11 h-11 rounded-full items-center justify-center bg-muted"
            style={elevations.soft}
            onPress={onNotificationsPress}
            testID="my-tasks-notifications"
            accessibilityRole="button"
            accessibilityLabel={t('shared.notifications.title')}
          >
            <Bell size={20} color={colors.primary} />
          </Touchable>
        }
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
