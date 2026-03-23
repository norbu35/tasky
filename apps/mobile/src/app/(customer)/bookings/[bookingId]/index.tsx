import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { ProfileAvatar } from '../../../../components/ui/ProfileAvatar';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { PriceTag } from '../../../../components/ui/PriceTag';
import { useBookingDetail } from '../../../../features/bookings/hooks/useBookingDetail';
import { ConfirmCompletionSheet } from '../../../../features/bookings/components/ConfirmCompletionSheet';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

function mapStatus(status: string): 'open' | 'assigned' | 'completed' | 'cancelled' | 'no_show' {
  const lower = status.toLowerCase();
  if (lower === 'assigned' || lower === 'tasker_marked_done') return 'assigned';
  if (lower === 'completed') return 'completed';
  if (lower === 'cancelled') return 'cancelled';
  if (lower === 'no_show') return 'no_show';
  return 'assigned';
}

function getStatusLabel(status: string, t: (key: string, fb: string) => string): string {
  switch (status) {
    case 'ASSIGNED':
      return t('customer.bookings.statusAssigned', 'Assigned');
    case 'TASKER_MARKED_DONE':
      return t('customer.bookings.statusMarkedDone', 'Marked as done');
    case 'COMPLETED':
      return t('customer.bookings.statusCompleted', 'Completed');
    case 'CANCELLED':
      return t('customer.bookings.statusCancelled', 'Cancelled');
    case 'NO_SHOW':
      return t('customer.bookings.statusNoShow', 'No-Show');
    default:
      return status;
  }
}

function getCtaConfig(
  status: string,
  t: (key: string, fb: string) => string,
): { label: string; action: string } | null {
  switch (status) {
    case 'ASSIGNED':
      return { label: t('customer.bookings.ctaMessage', 'Message'), action: 'message' };
    case 'TASKER_MARKED_DONE':
      return {
        label: t('customer.bookings.ctaConfirmComplete', 'Confirm Complete'),
        action: 'confirm_complete',
      };
    case 'COMPLETED':
      return { label: t('customer.bookings.ctaRebook', 'Rebook'), action: 'rebook' };
    default:
      return null;
  }
}

export default function BookingDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking, isLoading, isError, refetch } = useBookingDetail(bookingId);
  const [showCompletionSheet, setShowCompletionSheet] = useState(false);

  const status: string = booking?.status ?? 'ASSIGNED';
  const ctaConfig = getCtaConfig(status, t);

  const handleCtaPress = useCallback(() => {
    if (!booking) return;
    const action = getCtaConfig(status, t)?.action;
    switch (action) {
      case 'message':
        break;
      case 'confirm_complete':
        setShowCompletionSheet(true);
        break;
      case 'rebook':
        router.push({
          pathname: '/(customer)/rebook',
          params: {
            taskerId: booking.tasker?.id,
            taskerName: booking.tasker?.full_name,
            taskerAvatar: booking.tasker?.avatar_url,
            categoryId: booking.task?.category?.id,
            categoryName: booking.task?.category?.name,
            description: booking.task?.description,
            budget: String(booking.task?.budget),
            locationLat: String(booking.task?.location_lat),
            locationLng: String(booking.task?.location_lng),
            locationText: booking.task?.location_text,
            scheduledAt: booking.task?.scheduled_at,
          },
        });
        break;
    }
  }, [booking, status, t, router]);

  const handleTimeline = useCallback(() => {
    router.push(`/(customer)/bookings/${bookingId}/timeline`);
  }, [router, bookingId]);

  const handleReschedule = useCallback(() => {
    router.push(`/(customer)/bookings/${bookingId}/reschedule`);
  }, [router, bookingId]);

  const handleLeaveReview = useCallback(() => {
    router.push({
      pathname: '/(shared)/review/[bookingId]',
      params: { bookingId, role: 'customer' },
    });
  }, [router, bookingId]);

  return (
    <DetailTemplate
      headerTitle={t('customer.bookings.detailTitle', 'Booking Detail')}
      onBack={() => router.back()}
      ctaLabel={ctaConfig?.label}
      ctaOnPress={ctaConfig ? handleCtaPress : undefined}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      testID="booking-detail-screen"
    >
      {booking && (
        <>
          {/* Status */}
          <View style={styles.statusSection}>
            <Text style={styles.statusLabel}>{getStatusLabel(status, t)}</Text>
            <StatusBadge status={mapStatus(status)} />
          </View>

          {/* Tasker Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('customer.bookings.sectionTasker', 'Tasker')}
            </Text>
            <View style={styles.taskerRow}>
              <ProfileAvatar
                uri={booking.tasker?.avatar_url}
                name={booking.tasker?.full_name}
                size="lg"
                showVerified
              />
              <View style={styles.taskerInfo}>
                <Text style={styles.taskerName}>{booking.tasker?.full_name}</Text>
              </View>
            </View>
          </View>

          {/* Task Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('customer.bookings.sectionTaskSummary', 'Task Summary')}
            </Text>
            <Text style={styles.taskDescription}>{booking.task?.description}</Text>
            {booking.task?.location_text && (
              <Text style={styles.detailText}>{booking.task.location_text}</Text>
            )}
            {booking.task?.scheduled_at && (
              <Text style={styles.detailText}>
                {new Date(booking.task.scheduled_at).toLocaleDateString()}
              </Text>
            )}
            {booking.task?.budget && <PriceTag amount={booking.task.budget} size="sm" />}
          </View>

          {/* Payment Note */}
          <View style={styles.section}>
            <Text style={styles.paymentNote}>
              {t('customer.bookings.paymentNote', 'Payment is settled directly with the Tasker')}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <Pressable
              style={styles.actionLink}
              onPress={handleTimeline}
              testID="booking-detail-screen-timeline-link"
            >
              <Text style={styles.actionLinkText}>
                {t('customer.bookings.ctaTimeline', 'View Timeline')}
              </Text>
            </Pressable>

            {(status === 'ASSIGNED' || status === 'TASKER_MARKED_DONE') && (
              <>
                <Pressable
                  style={styles.actionLink}
                  onPress={handleReschedule}
                  testID="booking-detail-screen-reschedule-link"
                >
                  <Text style={styles.actionLinkText}>
                    {t('customer.bookings.ctaReschedule', 'Reschedule')}
                  </Text>
                </Pressable>
                <Pressable style={styles.actionLink} testID="booking-detail-screen-cancel-btn">
                  <Text style={styles.cancelText}>
                    {t('customer.bookings.ctaCancel', 'Cancel Booking')}
                  </Text>
                </Pressable>
              </>
            )}

            {status === 'COMPLETED' && (
              <Pressable
                style={styles.actionLink}
                onPress={handleLeaveReview}
                testID="booking-detail-screen-review-link"
              >
                <Text style={styles.actionLinkText}>
                  {t('shared.review.title', 'Leave a Review')}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Confirm Completion Sheet */}
          <ConfirmCompletionSheet
            isOpen={showCompletionSheet}
            onClose={() => setShowCompletionSheet(false)}
            bookingId={bookingId}
            onCompleted={() => {
              setShowCompletionSheet(false);
              refetch();
            }}
          />
        </>
      )}
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  statusLabel: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  taskerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  taskerInfo: {
    flex: 1,
  },
  taskerName: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.primaryDeep,
  },
  taskDescription: {
    fontSize: typography.body,
    color: colors.primaryDeep,
    marginBottom: spacing.sm,
  },
  detailText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  paymentNote: {
    fontSize: typography.caption,
    color: colors.accent,
    fontStyle: 'italic',
  },
  actionsSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionLink: {
    paddingVertical: spacing.sm,
  },
  actionLinkText: {
    fontSize: typography.body,
    color: colors.primary,
    fontWeight: '500',
  },
  cancelText: {
    fontSize: typography.body,
    color: colors.danger,
    fontWeight: '500',
  },
});
