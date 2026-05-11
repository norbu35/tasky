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
import { StatusBadge, type StatusType } from '@/components/ui/StatusBadge';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { useBookings } from '@/features/bookings/hooks/useBookings';
import { NotificationBellButton } from '@/features/notifications/components/NotificationBellButton';
import type { Booking } from '@/lib/api/types';
import { formatDateTime } from '@/utils/formatDate';

const { colors, spacing } = mobileTheme;

function mapJobStatus(status?: string): StatusType {
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

function getJobCardTestID(status?: string): string | undefined {
  switch ((status ?? '').toUpperCase()) {
    case 'ASSIGNED':
    case 'TASKER_MARKED_DONE':
      return 'job-card-active';
    case 'COMPLETED':
      return 'job-card-completed';
    case 'CANCELLED':
      return 'job-card-cancelled';
    case 'NO_SHOW':
      return 'job-card-no-show';
    default:
      return undefined;
  }
}

function TaskerJobCard({
  booking,
  onPress,
  testID,
  statusTestID,
}: {
  booking: Booking;
  onPress: () => void;
  testID: string;
  statusTestID?: string;
}) {
  const { t } = useTranslation();
  const customerName = booking.customer?.full_name ?? t('tasker.jobs.customerFallback');
  const description = booking.task?.description ?? '';
  const scheduledAt = booking.confirmed_scheduled_at ?? booking.task?.scheduled_at;
  const schedule = formatDateTime(scheduledAt);
  const price = booking.price ?? booking.task?.budget ?? 0;

  return (
    <Touchable
      onPress={onPress}
      className="bg-card rounded-2xl p-lg gap-md"
      style={elevations.card}
      testID={testID}
    >
      <View className="flex-row items-center" style={{ gap: spacing.md }}>
        <ProfileAvatar uri={booking.customer?.avatar_url} name={customerName} size="md" />
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-sm">
            <Text
              testID="SCR-TASK-012"
              className="text-body font-sans-bold text-primary-deep flex-1"
              numberOfLines={1}
            >
              {customerName}
            </Text>
            <View testID={statusTestID}>
              <StatusBadge status={mapJobStatus(booking.status)} />
            </View>
          </View>
          {description ? (
            <Text className="text-caption text-text-secondary mt-xs" numberOfLines={2}>
              {description}
            </Text>
          ) : null}
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

export default function TaskerJobsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, isRefetching, refetch } = useBookings();
  const [activeFilters, setActiveFilters] = useState<string[]>(['active']);
  const jobFilters = useMemo(
    () => [
      { id: 'active', label: t('MyJobsScreen.active') },
      { id: 'completed', label: t('MyJobsScreen.completed') },
      { id: 'cancelled', label: t('MyJobsScreen.cancelled') },
      { id: 'no_show', label: t('MyJobsScreen.noShow') },
    ],
    [t],
  );

  const bookings = useMemo(() => data?.data ?? [], [data?.data]);
  const filteredBookings = useMemo(() => {
    if (activeFilters.includes('completed')) {
      return bookings.filter((booking) => booking.status === 'COMPLETED');
    }
    if (activeFilters.includes('cancelled')) {
      return bookings.filter((booking) => booking.status === 'CANCELLED');
    }
    if (activeFilters.includes('no_show')) {
      return bookings.filter((booking) => booking.status === 'NO_SHOW');
    }
    return bookings.filter(
      (booking) =>
        booking.status !== 'COMPLETED' &&
        booking.status !== 'CANCELLED' &&
        booking.status !== 'NO_SHOW',
    );
  }, [activeFilters, bookings]);

  const renderItem = useCallback(
    (booking: Booking) => (
      <TaskerJobCard
        booking={booking}
        onPress={() => router.push(`/(tasker)/jobs/${booking.id}`)}
        testID={`booking-card-${booking.id}`}
        statusTestID={getJobCardTestID(booking.status)}
      />
    ),
    [router],
  );

  const keyExtractor = useCallback((booking: Booking) => booking.id, []);
  const handleToggleFilter = useCallback((id: string) => {
    setActiveFilters([id]);
  }, []);

  const listHeader = (
    <ScreenHeader
      title={t('tasker.jobs.title')}
      rightSlot={<NotificationBellButton testID="tasker-jobs-notifications" />}
    />
  );

  return (
    <FeedListTemplate
      data={filteredBookings}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      isLoading={isLoading}
      isError={isError}
      isEmpty={filteredBookings.length === 0}
      onRefresh={refetch}
      isRefreshing={isRefetching}
      onRetry={refetch}
      emptyTitle={t('tasker.jobs.emptyTitle')}
      emptyDescription={t('MyJobsScreen.copy1')}
      emptyCtaLabel={t('tasker.jobs.emptyCta')}
      emptyCtaOnPress={() => router.push('/(tabs)')}
      ListHeaderComponent={listHeader}
      filterBar={
        <FilterBar
          filters={jobFilters}
          activeFilters={activeFilters}
          onToggle={handleToggleFilter}
          testID="my-jobs-filter-bar"
        />
      }
      testID="my-jobs-feed"
    />
  );
}
