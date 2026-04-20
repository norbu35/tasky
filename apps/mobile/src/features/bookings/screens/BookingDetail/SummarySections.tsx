import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { PriceTag } from '@/components/ui/PriceTag';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';

import { type CustomerBooking } from './model';

interface TaskerSectionProps {
  booking: CustomerBooking;
  onTaskerPress: () => void;
}

export function TaskerSection({ booking, onTaskerPress }: TaskerSectionProps) {
  const { t } = useTranslation();
  return (
    <View className="mb-xl">
      <Text className="text-heading font-bold text-primary-deep mb-md">
        {t('customer.bookings.sectionTasker')}
      </Text>
      <Touchable
        className="flex-row items-center gap-md bg-muted rounded-md p-md mt-xs"
        onPress={onTaskerPress}
        testID="booking-detail-screen-tasker-card"
      >
        <ProfileAvatar
          uri={booking.tasker?.avatar_url}
          name={booking.tasker?.full_name}
          size="lg"
          showVerified
        />
        <View className="flex-1">
          <Text className="text-body font-semibold text-primary-deep">
            {booking.tasker?.full_name}
          </Text>
        </View>
      </Touchable>
    </View>
  );
}

interface TaskSummarySectionProps {
  booking: CustomerBooking;
}

export function TaskSummarySection({ booking }: TaskSummarySectionProps) {
  const { t } = useTranslation();
  return (
    <View className="mb-xl">
      <Text className="text-heading font-bold text-primary-deep mb-md">
        {t('customer.bookings.sectionTaskSummary')}
      </Text>
      <Text className="text-body text-primary-deep mb-sm">{booking.task?.description}</Text>
      {booking.task?.location_text && (
        <Text className="text-caption text-text-secondary mb-sm">{booking.task.location_text}</Text>
      )}
      {booking.task?.scheduled_at && (
        <Text className="text-caption text-text-secondary mb-sm">
          {new Date(booking.task.scheduled_at).toLocaleDateString()}
        </Text>
      )}
      {booking.task?.budget && <PriceTag amount={booking.task.budget} size="sm" />}
    </View>
  );
}

export function PaymentNote() {
  const { t } = useTranslation();
  return (
    <View className="mb-xl">
      <Text className="text-caption text-accent italic">{t('customer.bookings.paymentNote')}</Text>
    </View>
  );
}
