import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { TimelineStepper } from '@/components/ui/TimelineStepper';
import { mobileTheme } from '@/design/tokenAdapter';
import { formatDateTime } from '@/utils/formatDate';

interface BookingLifecyclePreviewProps {
  status?: string | null;
  createdAt?: string | null;
  scheduledAt?: string | null;
}

function getActiveIndex(status?: string | null): number {
  switch (status) {
    case 'COMPLETED':
    case 'CANCELLED':
    case 'NO_SHOW':
      return 2;
    case 'TASKER_MARKED_DONE':
      return 2;
    case 'ASSIGNED':
    default:
      return 1;
  }
}

export function BookingLifecyclePreview({
  status,
  createdAt,
  scheduledAt,
}: BookingLifecyclePreviewProps) {
  const { t } = useTranslation();
  const activeIndex = getActiveIndex(status);
  const pending = t('booking.lifecycle.pending');
  const events = [
    {
      label: t('booking.lifecycle.requested'),
      timestamp: formatDateTime(createdAt) || pending,
      isActive: activeIndex === 0,
    },
    {
      label: t('booking.lifecycle.confirmed'),
      timestamp: t('booking.lifecycle.confirmedTimestamp'),
      isActive: activeIndex === 1,
    },
    {
      label: t('booking.lifecycle.scheduled'),
      timestamp: formatDateTime(scheduledAt) || pending,
      isActive: activeIndex === 2,
    },
  ];

  return (
    <View className="mb-xl rounded-lg bg-muted p-md">
      <Text className="text-heading font-sans-bold text-primary-deep">
        {t('booking.lifecycle.title')}
      </Text>
      <TimelineStepper events={events} testID="booking-lifecycle-preview" className="mt-xs" />
      <Text
        className="text-caption leading-[20px]"
        style={{ color: mobileTheme.colors.textSecondary }}
      >
        {t('booking.lifecycle.addressNote')}
      </Text>
    </View>
  );
}
