import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FeedListTemplate } from '../../../components/templates/FeedListTemplate';
import { FilterBar } from '../../../components/ui/FilterBar';
import { SplitCard } from '../../../components/ui/SplitCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useBookings } from '../../../features/bookings/hooks/useBookings';
import type { Booking } from '../../../lib/mobileApiClient';

const JOB_FILTERS = [
  { id: 'active', label: 'Идэвхтэй' },
  { id: 'completed', label: 'Дууссан' },
  { id: 'cancelled', label: 'Цуцлагдсан' },
];

function BookingCardHeader({ booking }: { booking: Booking }) {
  const customerName = booking.customer?.full_name ?? '';
  const status = booking.status.toLowerCase() as 'assigned' | 'completed' | 'cancelled' | 'no_show';

  return (
    <View testID="SCR-TASK-012" className="flex-row items-center justify-between">
      <Text className="text-body font-semibold text-primaryForeground flex-1 mr-sm" numberOfLines={1}>
        {customerName}
      </Text>
      <StatusBadge status={status} />
    </View>
  );
}

function BookingCardBody({ booking }: { booking: Booking }) {
  const taskTitle = booking.task?.description ?? '';
  const scheduledDate = booking.confirmed_scheduled_at
    ? new Date(booking.confirmed_scheduled_at).toLocaleDateString()
    : '';

  return (
    <View className="gap-xs">
      <Text className="text-body font-medium text-foreground" numberOfLines={2}>
        {taskTitle}
      </Text>
      <Text className="text-micro text-mutedForeground">{scheduledDate}</Text>
    </View>
  );
}

export default function MyJobsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, isRefetching, refetch } = useBookings();
  const [activeFilters, setActiveFilters] = useState<string[]>(['active']);

  const bookings = useMemo(() => data?.data ?? [], [data?.data]);
  const filteredBookings = useMemo(() => {
    if (activeFilters.includes('completed')) {
      return bookings.filter((booking) => booking.status === 'COMPLETED');
    }
    if (activeFilters.includes('cancelled')) {
      return bookings.filter((booking) => booking.status === 'CANCELLED');
    }
    return bookings.filter(
      (booking) => booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED',
    );
  }, [activeFilters, bookings]);

  const renderItem = useCallback(
    (booking: Booking) => (
      <SplitCard
        headerContent={<BookingCardHeader booking={booking} />}
        bodyContent={<BookingCardBody booking={booking} />}
        onPress={() => router.push(`/(tasker)/jobs/${booking.id}`)}
        testID={`booking-card-${booking.id}`}
      />
    ),
    [router],
  );

  const keyExtractor = useCallback((booking: Booking) => booking.id, []);
  const handleToggleFilter = useCallback((id: string) => {
    setActiveFilters([id]);
  }, []);

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
      emptyTitle={t('tasker.jobs.emptyTitle', 'Одоогоор ажил байхгүй байна')}
      emptyDescription={t(
        'tasker.jobs.emptyDescription',
        'Даалгавруудад анкет илгээж, эхний ажлаа аваарай',
      )}
      emptyCtaLabel={t('tasker.jobs.emptyCta', 'Даалгавар хайх')}
      emptyCtaOnPress={() => router.push('/(tabs)')}
      filterBar={
        <FilterBar
          filters={JOB_FILTERS.map((filter) => ({
            id: filter.id,
            label: t(`tasker.jobs.filter.${filter.id}`, filter.label),
          }))}
          activeFilters={activeFilters}
          onToggle={handleToggleFilter}
          testID="my-jobs-filter-bar"
        />
      }
      testID="my-jobs-feed"
    />
  );
}
