import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FeedListTemplate } from '../../../components/templates/FeedListTemplate';
import { SplitCard } from '../../../components/ui/SplitCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useBookings } from '../../../features/bookings/hooks/useBookings';
import { mobileTheme } from '../../../design/tokenAdapter';
import type { Booking } from '../../../lib/mobileApiClient';

const { colors, spacing, typography } = mobileTheme;

function BookingCardHeader({ booking }: { booking: Booking }) {
  const customerName = booking.customer?.full_name ?? '';
  const status = booking.status.toLowerCase() as 'assigned' | 'completed' | 'cancelled' | 'no_show';

  return (
    <View style={styles.headerRow}>
      <Text style={styles.customerName} numberOfLines={1}>
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
    <View style={styles.bodyContent}>
      <Text style={styles.taskTitle} numberOfLines={2}>
        {taskTitle}
      </Text>
      <Text style={styles.schedule}>{scheduledDate}</Text>
    </View>
  );
}

export default function MyJobsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, isRefetching, refetch } = useBookings();

  const bookings = data?.data ?? [];

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

  return (
    <FeedListTemplate
      data={bookings}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      isLoading={isLoading}
      isError={isError}
      isEmpty={bookings.length === 0}
      onRefresh={refetch}
      isRefreshing={isRefetching}
      onRetry={refetch}
      emptyTitle={t('tasker.jobs.emptyTitle', 'No jobs yet')}
      emptyDescription={t('tasker.jobs.emptyDescription', 'Apply to tasks and get your first job')}
      emptyCtaLabel={t('tasker.jobs.emptyCta', 'Browse Tasks')}
      emptyCtaOnPress={() => router.push('/(tabs)')}
      testID="my-jobs-feed"
    />
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerName: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.primaryForeground,
    flex: 1,
    marginRight: spacing.sm,
  },
  bodyContent: {
    gap: spacing.xs,
  },
  taskTitle: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.foreground,
  },
  schedule: {
    fontSize: typography.micro,
    color: colors.mutedForeground,
  },
});
