import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { FeedListTemplate } from '../../components/templates/FeedListTemplate';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SplitCard } from '../../components/ui/SplitCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useBookings } from '../../features/bookings/hooks/useBookings';
import { useRole } from '../../providers/RoleProvider';
import { formatDateTime } from '../../utils/formatDate';
type BookingStatus = 'ASSIGNED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

interface BookingItem {
  id: string;
  task_id: string;
  status: BookingStatus;
  price: number;
  confirmed_scheduled_at: string;
  tasker?: { full_name?: string } | null;
  customer?: { full_name?: string } | null;
  task?: { description?: string; category?: { name?: string } | null } | null;
}

function mapStatus(status: BookingStatus): 'assigned' | 'completed' | 'cancelled' | 'no_show' {
  switch (status) {
    case 'ASSIGNED':
      return 'assigned';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
    case 'NO_SHOW':
      return 'no_show';
  }
}

function formatMoney(amount: number) {
  return `₮${amount.toLocaleString('en-US')}`;
}

function BookingCardHeader({ booking, isCustomer }: { booking: BookingItem; isCustomer: boolean }) {
  const counterpartyName = isCustomer ? booking.tasker?.full_name : booking.customer?.full_name;

  return (
    <View className="flex-row items-center justify-between">
      <StatusBadge status={mapStatus(booking.status)} />
      {counterpartyName && (
        <Text className="text-label font-sans-medium text-text-secondary" numberOfLines={1}>
          {counterpartyName}
        </Text>
      )}
    </View>
  );
}

function BookingCardBody({ booking }: { booking: BookingItem }) {
  const { t } = useTranslation();
  const description = booking.task?.description ?? t('customer.taskList.categoryFallback');
  const date = formatDateTime(booking.confirmed_scheduled_at);

  return (
    <View className="gap-sm">
      <Text className="font-screen-card-title text-primary-deep" numberOfLines={2}>
        {description}
      </Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-caption text-text-secondary">{date}</Text>
        <Text className="text-subtitle font-sans-bold text-secondary">
          {formatMoney(booking.price)}
        </Text>
      </View>
    </View>
  );
}

export default function BookingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isCustomer } = useRole();
  const { data, isLoading, isError, isRefetching, refetch } = useBookings();

  const bookings = (data?.data ?? []) as BookingItem[];

  const handlePress = useCallback(
    (booking: BookingItem) => {
      if (isCustomer) {
        router.push(`/(customer)/bookings/${booking.id}` as any);
      } else {
        router.push(`/(tasker)/jobs/${booking.id}` as any);
      }
    },
    [isCustomer, router],
  );

  const renderItem = useCallback(
    (booking: BookingItem) => (
      <SplitCard
        headerContent={<BookingCardHeader booking={booking} isCustomer={isCustomer} />}
        bodyContent={<BookingCardBody booking={booking} />}
        onPress={() => handlePress(booking)}
        testID={`booking-card-${booking.id}`}
      />
    ),
    [isCustomer, handlePress],
  );

  const keyExtractor = useCallback((booking: BookingItem) => booking.id, []);

  const listHeader = (
    <View className="pb-item">
      <ScreenHeader
        title={isCustomer ? t('customer.bookings.pageTitle') : t('tasker.jobs.title')}
      />
    </View>
  );

  return (
    <FeedListTemplate
      testID="SCR-CUST-016"
      data={bookings}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      isLoading={isLoading}
      isError={isError}
      isEmpty={bookings.length === 0 && !isLoading}
      onRefresh={refetch}
      isRefreshing={isRefetching}
      onRetry={refetch}
      emptyTitle={isCustomer ? t('customer.bookings.emptyTitle') : t('tasker.jobs.emptyTitle')}
      emptyDescription={
        isCustomer ? t('customer.bookings.emptyDescription') : t('tasker.jobs.emptyDescription')
      }
      errorMessage={t('common.error')}
      ListHeaderComponent={listHeader}
    />
  );
}
