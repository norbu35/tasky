import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { FeedListTemplate } from '@/components/templates/FeedListTemplate';
import { FilterBar } from '@/components/ui/FilterBar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { NotificationBellButton } from '@/features/notifications/components/NotificationBellButton';

import { BookingCard } from './BookingCard';
import { TAB_IDS, type BookingTab } from './model';
import { useBookingsListScreen } from './useBookingsListScreen';

const TAB_LABEL_KEYS: Readonly<Record<BookingTab, string>> = {
  active: 'BookingsListScreen.tab.active',
  completed: 'BookingsListScreen.tab.completed',
};

function getBookingCardTestID(status?: string): string | undefined {
  switch ((status ?? '').toUpperCase()) {
    case 'ASSIGNED':
      return 'booking-card-active';
    case 'COMPLETED':
      return 'booking-card-completed';
    case 'CANCELLED':
      return 'booking-card-cancelled';
    case 'NO_SHOW':
      return 'booking-card-no-show';
    default:
      return undefined;
  }
}

export default function BookingsListScreen() {
  const { t } = useTranslation();
  const {
    activeTab,
    setActiveTab,
    isRefreshing,
    filteredBookings,
    bookings,
    isLoading,
    isError,
    handleRefresh,
    handleBookingPress,
    handlePostTask,
    refetch,
  } = useBookingsListScreen();

  const filters = useMemo(
    () =>
      TAB_IDS.map((tab) => ({
        id: tab,
        label: t(TAB_LABEL_KEYS[tab]),
      })),
    [t],
  );

  const handleToggleFilter = useCallback(
    (id: string) => setActiveTab(id as BookingTab),
    [setActiveTab],
  );

  const renderItem = useCallback(
    (booking: (typeof filteredBookings)[number]) => (
      <BookingCard
        booking={booking}
        t={t}
        onPress={() => handleBookingPress(booking.id)}
        testID={`booking-card-${booking.id}`}
        statusTestID={getBookingCardTestID(booking.status)}
      />
    ),
    [filteredBookings, t, handleBookingPress],
  );

  const keyExtractor = useCallback((booking: (typeof filteredBookings)[number]) => booking.id, []);

  const listHeader = (
    <ScreenHeader
      title={t('customer.bookings.pageTitle')}
      rightSlot={<NotificationBellButton testID="bookings-list-notifications" />}
    />
  );

  return (
    <FeedListTemplate
      testID="SCR-CUST-016"
      data={filteredBookings}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      isLoading={isLoading}
      isError={isError && bookings.length === 0}
      isEmpty={filteredBookings.length === 0}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
      onRetry={refetch}
      emptyTitle={t('customer.bookings.emptyTitle')}
      emptyDescription={t('customer.bookings.emptyDescription')}
      emptyCtaLabel={t('customer.bookings.emptyCta')}
      emptyCtaOnPress={handlePostTask}
      ListHeaderComponent={listHeader}
      filterBar={
        <FilterBar
          filters={filters}
          activeFilters={[activeTab]}
          onToggle={handleToggleFilter}
          testID="bookings-list-filter-bar"
        />
      }
    />
  );
}
