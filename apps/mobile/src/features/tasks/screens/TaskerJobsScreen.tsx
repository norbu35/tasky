import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { FeedListTemplate } from '@/components/templates/FeedListTemplate';
import { FilterBar } from '@/components/ui/FilterBar';
import { SplitCard } from '@/components/ui/SplitCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useBookings } from '@/features/bookings/hooks/useBookings';
import type { Booking } from '@/lib/mobileApiClient';

function BookingCardHeader({ booking }: { booking: Booking }) {
  const customerName = booking.customer?.full_name ?? '';
  const status = booking.status.toLowerCase() as 'assigned' | 'completed' | 'cancelled' | 'no_show';

  return (
    <View testID="SCR-TASK-012" className="flex-row items-center justify-between">
      <Text
        className="text-body font-semibold text-primary-foreground flex-1 mr-sm"
        numberOfLines={1}
      >
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
      <Text className="text-micro text-muted-foreground">{scheduledDate}</Text>
    </View>
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
      emptyTitle={t('tasker.jobs.emptyTitle')}
      emptyDescription={t('MyJobsScreen.copy1')}
      emptyCtaLabel={t('tasker.jobs.emptyCta')}
      emptyCtaOnPress={() => router.push('/(tabs)')}
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
