import { CalendarDays } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { PriceTag } from '@/components/ui/PriceTag';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';

import { formatSchedule, mapBookingStatus } from './model';

const { colors, spacing } = mobileTheme;

export function BookingCard({
  booking,
  t,
  onPress,
  testID,
  statusTestID,
}: {
  booking: {
    id: string;
    status?: string;
    task?: { description?: string | null; budget?: number | null; scheduled_at?: string | null };
    tasker?: { full_name?: string | null; avatar_url?: string | null };
  };
  t: (key: string) => string;
  onPress: () => void;
  testID?: string;
  statusTestID?: string;
}) {
  const schedule = formatSchedule(booking.task?.scheduled_at);
  const taskerName = booking.tasker?.full_name ?? t('BookingsListScreen.taskerFallback');
  const description = booking.task?.description ?? t('BookingsListScreen.taskFallback');

  return (
    <Touchable
      onPress={onPress}
      className="bg-card rounded-2xl p-lg gap-md"
      style={elevations.card}
      testID={testID ?? `booking-card-${booking.id}`}
    >
      <View className="flex-row items-center" style={{ gap: spacing.md }}>
        <ProfileAvatar uri={booking.tasker?.avatar_url} name={taskerName} size="md" showVerified />
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-sm">
            <Text className="text-body font-sans-bold text-primary-deep flex-1" numberOfLines={1}>
              {taskerName}
            </Text>
            <View testID={statusTestID}>
              <StatusBadge status={mapBookingStatus(booking.status)} />
            </View>
          </View>
          <Text className="text-caption text-text-secondary mt-xs" numberOfLines={2}>
            {description}
          </Text>
        </View>
      </View>

      <View className="border-t border-border" />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-xs flex-1">
          <CalendarDays size={16} color={colors.textSecondary} strokeWidth={2.5} />
          <Text className="text-caption text-text-secondary flex-1" numberOfLines={1}>
            {schedule ?? '—'}
          </Text>
        </View>
        <PriceTag amount={booking.task?.budget ?? 0} size="sm" />
      </View>
    </Touchable>
  );
}
