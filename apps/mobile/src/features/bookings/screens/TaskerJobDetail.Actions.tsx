import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';

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

  if (isAssigned) {
    return (
      <View className="items-center pt-md gap-sm">
        <Button
          label={t('booking.support.cta')}
          variant="outline"
          onPress={onOpenSupport}
          testID="booking-detail-tasker-support"
        />
        <Button
          label={t('tasker.jobs.noShowFlag')}
          variant="ghost"
          onPress={onOpenNoShow}
          labelClassName="text-danger"
          testID="booking-detail-tasker-no-show"
        />
        <Button
          label={t('tasker.jobs.cancelBooking')}
          variant="ghost"
          onPress={onOpenCancel}
          labelClassName="text-danger"
          testID="booking-detail-tasker-cancel"
        />
      </View>
    );
  }

  if (isCompleted) {
    return (
      <View className="gap-xs">
        <Button
          label={t('tasker.jobs.leaveReview')}
          variant="outline"
          onPress={onLeaveReview}
          testID="booking-detail-tasker-review"
        />
      </View>
    );
  }

  return null;
}
