import { ClipboardList, CalendarDays } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { PriceTag } from '@/components/ui/PriceTag';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

import {
  formatSchedule,
  getBookingStatusLabel,
  getBookingStatusColors,
} from './BookingsList.model';

const { colors } = mobileTheme;
const { bookingList } = mobileSurfaces;

export function FilterTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Touchable
      onPress={onPress}
      className="pb-xs items-start"
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        className={`text-label font-semibold${active ? ' text-primary-deep' : ' text-text-secondary'}`}
      >
        {label}
      </Text>
      {active ? <View className="mt-xs w-12 h-1 rounded-full bg-primary-deep" /> : null}
    </Touchable>
  );
}

export function BookingCard({
  booking,
  t,
  onPress,
}: {
  booking: {
    id: string;
    status?: string;
    task?: { description?: string | null; budget?: number | null; scheduled_at?: string | null };
    tasker?: { full_name?: string | null; avatar_url?: string | null };
  };
  t: (key: string) => string;
  onPress: () => void;
}) {
  const schedule = formatSchedule(booking.task?.scheduled_at);
  const statusColors = getBookingStatusColors(booking.status);

  return (
    <Touchable
      onPress={onPress}
      className="bg-card rounded-lg p-card gap-item"
      style={elevations.soft}
      testID={`booking-card-${booking.id}`}
    >
      <View className="flex-row items-start justify-between gap-item">
        <View className="flex-row items-center flex-1 gap-item">
          <ProfileAvatar
            uri={booking.tasker?.avatar_url}
            name={booking.tasker?.full_name ?? t('BookingsListScreen.taskerFallback')}
            size="md"
            showVerified
          />
          <View className="flex-1 gap-[2px]">
            <Text className="text-body font-bold text-primary-deep" numberOfLines={1}>
              {booking.tasker?.full_name ?? t('BookingsListScreen.taskerFallback')}
            </Text>
            <Text className="text-caption text-text-secondary" numberOfLines={1}>
              {booking.task?.description ?? t('BookingsListScreen.taskFallback')}
            </Text>
          </View>
        </View>

        <View
          className="self-start rounded-full px-md py-xs"
          style={{ backgroundColor: statusColors.bg }}
        >
          <Text
            className="text-micro font-bold uppercase tracking-[0.6px]"
            style={{ letterSpacing: bookingList.statusTracking, color: statusColors.text }}
          >
            {getBookingStatusLabel(booking.status, t)}
          </Text>
        </View>
      </View>

      <View className="bg-border opacity-40" style={{ height: bookingList.railHeight }} />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-xs flex-1">
          <CalendarDays size={16} color={colors.textSecondary} />
          <Text className="text-caption text-text-secondary flex-1">{schedule ?? '—'}</Text>
        </View>
        <PriceTag amount={booking.task?.budget ?? 0} size="sm" />
      </View>
    </Touchable>
  );
}

export function LoadingSkeletonCard() {
  return (
    <View className="bg-card rounded-lg p-lg gap-md" style={elevations.soft}>
      <View className="flex-row items-center gap-md">
        <View
          className="rounded-md bg-muted"
          style={{ width: bookingList.skeletonAvatar, height: bookingList.skeletonAvatar }}
        />
        <View className="flex-1 gap-xs">
          <View
            className="h-3 rounded-xs bg-muted"
            style={{ width: bookingList.skeletonTitleWidth }}
          />
          <View
            className="rounded-xs bg-muted"
            style={{ height: 10, width: bookingList.skeletonSubtitleWidth }}
          />
        </View>
        <View
          className="rounded-full bg-muted"
          style={{ width: bookingList.skeletonPillWidth, height: bookingList.skeletonPillHeight }}
        />
      </View>
      <View className="bg-border opacity-40" style={{ height: bookingList.railHeight }} />
      <View className="flex-row justify-between items-center">
        <View
          className="rounded-xs bg-muted"
          style={{ height: 10, width: bookingList.skeletonMetaWidth }}
        />
        <View
          className="rounded-xs bg-muted"
          style={{ height: bookingList.skeletonPriceHeight, width: bookingList.skeletonPriceWidth }}
        />
      </View>
    </View>
  );
}

export function EmptyState({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="items-center gap-md py-2xl px-xl">
      <View className="w-16 h-16 rounded-lg items-center justify-center bg-muted">
        <ClipboardList size={24} color={colors.secondary} />
      </View>
      <Text className="text-title font-bold text-primary-deep text-center">
        {t('customer.bookings.emptyTitle')}
      </Text>
      <Text className="text-body text-text-secondary text-center leading-relaxed">
        {t('customer.bookings.emptyDescription')}
      </Text>
      <Touchable
        onPress={onPress}
        className="px-xl rounded-md bg-secondary items-center justify-center"
        style={{ minHeight: bookingList.ctaHeight }}
        testID="bookings-empty-cta"
      >
        <Text className="text-label font-bold text-secondary-foreground">
          {t('customer.bookings.emptyCta')}
        </Text>
      </Touchable>
    </View>
  );
}
