import { AlertTriangle, Flag, LifeBuoy, Star } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ActionRow } from '@/components/ui/ActionRow';
import { mobileTheme } from '@/design/tokenAdapter';

interface TaskerJobDetailActionsProps {
  isAssigned: boolean;
  isCompleted: boolean;
  onOpenSupport: () => void;
  onOpenNoShow: () => void;
  onOpenCancel: () => void;
  onLeaveReview: () => void;
}

export function TaskerJobDetailActions({
  isAssigned,
  isCompleted,
  onOpenSupport,
  onOpenNoShow,
  onOpenCancel,
  onLeaveReview,
}: TaskerJobDetailActionsProps) {
  const { t } = useTranslation();
  const { colors } = mobileTheme;

  if (isAssigned) {
    return (
      <View className="rounded-md border border-border overflow-hidden">
        <ActionRow
          icon={<LifeBuoy size={20} color={colors.primary} />}
          label={t('booking.support.cta')}
          onPress={onOpenSupport}
          testID="booking-detail-tasker-support"
        />
        <ActionRow
          icon={<Flag size={20} color={colors.danger} />}
          label={t('tasker.jobs.noShowFlag')}
          onPress={onOpenNoShow}
          testID="booking-detail-tasker-no-show"
          destructive
        />
        <ActionRow
          icon={<AlertTriangle size={20} color={colors.danger} />}
          label={t('tasker.jobs.cancelBooking')}
          onPress={onOpenCancel}
          testID="booking-detail-tasker-cancel"
          showDivider={false}
          destructive
        />
      </View>
    );
  }

  if (isCompleted) {
    return (
      <View className="rounded-md border border-border overflow-hidden">
        <ActionRow
          icon={<Star size={20} color={colors.primary} />}
          label={t('tasker.jobs.leaveReview')}
          onPress={onLeaveReview}
          testID="booking-detail-tasker-review"
          showDivider={false}
        />
      </View>
    );
  }

  return null;
}
