import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FeedListTemplate } from '../../../components/templates/FeedListTemplate';
import { FilterBar } from '../../../components/ui/FilterBar';
import { SplitCard } from '../../../components/ui/SplitCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { PriceTag } from '../../../components/ui/PriceTag';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { useBookings } from '../../../features/bookings/hooks/useBookings';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

const FILTER_TABS = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

function mapStatus(status: string): 'open' | 'assigned' | 'completed' | 'cancelled' | 'no_show' {
  const lower = status.toLowerCase();
  if (lower === 'assigned') return 'assigned';
  if (lower === 'completed') return 'completed';
  if (lower === 'cancelled') return 'cancelled';
  if (lower === 'no_show') return 'no_show';
  return 'assigned';
}

function isActiveStatus(status: string): boolean {
  return status === 'ASSIGNED' || status === 'TASKER_MARKED_DONE';
}

export default function BookingsListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useBookings();
  const [activeFilter, setActiveFilter] = useState<string[]>(['active']);

  const bookings = data?.data ?? [];

  const filteredBookings = activeFilter.includes('active')
    ? bookings.filter((b: any) => isActiveStatus(b.status))
    : bookings.filter((b: any) => !isActiveStatus(b.status));

  const handleToggleFilter = useCallback((id: string) => {
    setActiveFilter([id]);
  }, []);

  const handleBookingPress = useCallback(
    (bookingId: string) => {
      router.push(`/(customer)/bookings/${bookingId}`);
    },
    [router],
  );

  const handlePostTask = useCallback(() => {
    router.push('/(customer)/tasks/new/category');
  }, [router]);

  const renderBookingCard = useCallback(
    (booking: any) => (
      <SplitCard
        testID={`booking-card-${booking.id}`}
        onPress={() => handleBookingPress(booking.id)}
        headerContent={
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {booking.task?.description}
            </Text>
            <PriceTag amount={booking.task?.budget ?? 0} size="sm" />
          </View>
        }
        bodyContent={
          <View style={styles.cardBody}>
            <View style={styles.cardBodyLeft}>
              <ProfileAvatar
                uri={booking.tasker?.avatar_url}
                name={booking.tasker?.full_name}
                size="sm"
              />
              <Text style={styles.taskerName} numberOfLines={1}>
                {booking.tasker?.full_name}
              </Text>
            </View>
            <StatusBadge status={mapStatus(booking.status ?? 'ASSIGNED')} />
          </View>
        }
      />
    ),
    [handleBookingPress],
  );

  const filterBar = (
    <FilterBar
      filters={FILTER_TABS.map((f) => ({
        id: f.id,
        label: t(`customer.bookings.tab${f.label}`, f.label),
      }))}
      activeFilters={activeFilter}
      onToggle={handleToggleFilter}
      testID="bookings-filter-bar"
    />
  );

  return (
    <View style={styles.container} testID="bookings-list-screen">
      <FeedListTemplate
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(booking: any) => booking.id}
        isLoading={isLoading}
        isError={isError}
        isEmpty={bookings.length === 0}
        onRefresh={refetch}
        emptyTitle={t('customer.bookings.emptyTitle', 'No bookings yet')}
        emptyDescription={t(
          'customer.bookings.emptyDescription',
          'Post a task and select a Tasker to get started',
        )}
        emptyCtaLabel={t('customer.bookings.emptyCta', 'Post a Task')}
        emptyCtaOnPress={handlePostTask}
        filterBar={filterBar}
        testID="bookings-feed"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.primaryForeground,
    marginRight: spacing.sm,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBodyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  taskerName: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
});
