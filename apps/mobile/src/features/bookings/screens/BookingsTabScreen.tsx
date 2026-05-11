import { useRouter } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { FeedListTemplate } from '@/components/templates/FeedListTemplate';
import { FilterBar } from '@/components/ui/FilterBar';
import { PriceTag } from '@/components/ui/PriceTag';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { StatusType } from '@/components/ui/StatusBadge';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { useBookings } from '@/features/bookings/hooks/useBookings';
import { NotificationBellButton } from '@/features/notifications/components/NotificationBellButton';
import type { Booking } from '@/lib/api/types';
import { useRole } from '@/providers/RoleProvider';
import { formatDateTime } from '@/utils/formatDate';

const { colors, spacing } = mobileTheme;

function mapBookingStatus(status: string | undefined): StatusType {
  switch ((status ?? '').toUpperCase()) {
    case 'ASSIGNED':
    case 'TASKER_MARKED_DONE':
      return 'assigned';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
    case 'NO_SHOW':
      return 'no_show';
    default:
      return 'open';
  }
}

function getCardTestID(status: string, isCustomer: boolean): string {
  const prefix = isCustomer ? 'booking-card' : 'job-card';
  switch (status.toUpperCase()) {
    case 'ASSIGNED':
    case 'TASKER_MARKED_DONE':
      return `${prefix}-active`;
    case 'COMPLETED':
      return `${prefix}-completed`;
    case 'CANCELLED':
      return `${prefix}-cancelled`;
    case 'NO_SHOW':
      return `${prefix}-no-show`;
    default:
      return `${prefix}-unknown`;
  }
}

function BookingCard({
  booking,
  isCustomer,
  onPress,
}: {
  booking: Booking;
  isCustomer: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const counterparty = isCustomer ? booking.tasker : booking.customer;
  const name =
    counterparty?.full_name ??
    (isCustomer ? t('BookingsListScreen.taskerFallback') : t('tasker.jobs.customerFallback'));
  const description = booking.task?.description ?? t('BookingsListScreen.taskFallback');
  const scheduledAt = booking.confirmed_scheduled_at ?? booking.task?.scheduled_at;
  const schedule = formatDateTime(scheduledAt);
  const price = booking.price ?? booking.task?.budget ?? 0;

  return (
    <Touchable
      onPress={onPress}
      className="bg-card rounded-2xl p-lg gap-md"
      style={elevations.card}
      testID={`booking-card-${booking.id}`}
    >
      <View className="flex-row items-center" style={{ gap: spacing.md }}>
        <ProfileAvatar
          uri={counterparty?.avatar_url}
          name={name}
          size="md"
          showVerified={isCustomer}
        />
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-sm">
            <Text className="text-body font-sans-bold text-primary-deep flex-1" numberOfLines={1}>
              {name}
            </Text>
            <View testID={getCardTestID(booking.status, isCustomer)}>
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
            {schedule || '—'}
          </Text>
        </View>
        <PriceTag amount={price} size="sm" />
      </View>
    </Touchable>
  );
}

export default function BookingsTabScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isCustomer } = useRole();
  const { data, isLoading, isError, isRefetching, refetch } = useBookings();
  const [activeFilter, setActiveFilter] = useState('active');

  const allBookings = useMemo(() => data?.data ?? [], [data?.data]);

  const filters = useMemo(() => {
    if (isCustomer) {
      return [
        { id: 'active', label: t('BookingsListScreen.tab.active') },
        { id: 'completed', label: t('BookingsListScreen.tab.completed') },
      ];
    }
    return [
      { id: 'active', label: t('MyJobsScreen.active') },
      { id: 'completed', label: t('MyJobsScreen.completed') },
      { id: 'cancelled', label: t('MyJobsScreen.cancelled') },
      { id: 'no_show', label: t('MyJobsScreen.noShow') },
    ];
  }, [isCustomer, t]);

  const filteredBookings = useMemo(() => {
    switch (activeFilter) {
      case 'completed':
        return allBookings.filter((b) => b.status === 'COMPLETED');
      case 'cancelled':
        return allBookings.filter((b) => b.status === 'CANCELLED');
      case 'no_show':
        return allBookings.filter((b) => b.status === 'NO_SHOW');
      default:
        if (isCustomer) {
          return allBookings.filter((b) => b.status === 'ASSIGNED');
        }
        return allBookings.filter(
          (b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && b.status !== 'NO_SHOW',
        );
    }
  }, [allBookings, activeFilter, isCustomer]);

  const handlePress = useCallback(
    (booking: Booking) => {
      if (isCustomer) {
        router.push(`/(customer)/bookings/${booking.id}` as `${string}`);
      } else {
        router.push(`/(tasker)/jobs/${booking.id}` as `${string}`);
      }
    },
    [isCustomer, router],
  );

  const renderItem = useCallback(
    (booking: Booking) => (
      <BookingCard booking={booking} isCustomer={isCustomer} onPress={() => handlePress(booking)} />
    ),
    [isCustomer, handlePress],
  );

  const keyExtractor = useCallback((booking: Booking) => booking.id, []);

  const listHeader = (
    <ScreenHeader
      title={isCustomer ? t('customer.bookings.pageTitle') : t('tasker.jobs.title')}
      rightSlot={<NotificationBellButton testID="bookings-notifications" />}
    />
  );

  return (
    <FeedListTemplate
      testID={isCustomer ? 'SCR-CUST-016' : 'SCR-TASK-012'}
      data={filteredBookings}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      isLoading={isLoading}
      isError={isError && allBookings.length === 0}
      isEmpty={filteredBookings.length === 0}
      onRefresh={refetch}
      isRefreshing={isRefetching}
      onRetry={refetch}
      emptyTitle={isCustomer ? t('customer.bookings.emptyTitle') : t('tasker.jobs.emptyTitle')}
      emptyDescription={
        isCustomer ? t('customer.bookings.emptyDescription') : t('tasker.jobs.emptyDescription')
      }
      emptyCtaLabel={isCustomer ? t('customer.bookings.emptyCta') : t('tasker.jobs.emptyCta')}
      emptyCtaOnPress={() =>
        router.push(
          isCustomer ? ('/(customer)/tasks/new' as `${string}`) : ('/(tabs)' as `${string}`),
        )
      }
      errorMessage={t('common.error')}
      ListHeaderComponent={listHeader}
      filterBar={
        <FilterBar
          filters={filters}
          activeFilters={[activeFilter]}
          onToggle={setActiveFilter}
          testID="bookings-filter-bar"
        />
      }
    />
  );
}
