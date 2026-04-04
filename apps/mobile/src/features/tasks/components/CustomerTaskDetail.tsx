import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  MoreVertical,
  Calendar,
  Banknote,
  MapPin,
  Star,
  ShieldCheck,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBadge, ProfileAvatar } from '../../../components/ui';
import { mobileTheme, elevations } from '../../../design/tokenAdapter';
import { useTranslation } from 'react-i18next';
import { useBookings } from '../../bookings/hooks/useBookings';
import { useCompleteBooking } from '../../bookings/hooks/useCompleteBooking';
import { useReschedule } from '../../bookings/hooks/useReschedule';
import { RescheduleModal } from '../../bookings/components/RescheduleModal';
import { generateIdempotencyKey } from '../../../utils/uuid';

const { colors, radius, typography } = mobileTheme;

function DetailBentoCard({
  icon: Icon,
  label,
  children,
  span,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  span?: boolean;
}) {
  return (
    <View style={[styles.bentoCard, span && styles.bentoCardSpan]}>
      <Icon size={16} color={colors.textSecondary} />
      <Text style={styles.bentoLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function CustomerTaskDetail() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: taskId } = useLocalSearchParams<{ id: string }>();
  const { data: bookingsData } = useBookings();
  const booking = bookingsData?.data?.find((b: { task_id: string }) => b.task_id === taskId);
  const completeBooking = useCompleteBooking();
  const rescheduleBooking = useReschedule();
  const [showReschedule, setShowReschedule] = useState(false);

  if (!booking) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primaryDeep} />
      </View>
    );
  }

  const scheduledDate = booking.confirmed_scheduled_at?.split('T')[0] ?? '';
  const scheduledTime = booking.confirmed_scheduled_at?.split('T')[1]?.slice(0, 5) ?? '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <ChevronLeft size={16} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {booking.task?.description ?? ''}
        </Text>
        <Pressable style={styles.headerButton}>
          <MoreVertical size={16} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status & Title */}
        <View style={styles.heroSection}>
          <StatusBadge status={booking.status.toLowerCase() as any} />
          <Text style={styles.taskTitleMn}>{booking.task?.description ?? ''}</Text>
        </View>

        {/* Tasker Card */}
        <View style={styles.taskerCard}>
          <View style={styles.taskerHeader}>
            <View style={styles.taskerInfo}>
              <ProfileAvatar
                uri={booking.tasker?.avatar_url}
                name={booking.tasker?.full_name ?? ''}
                size="lg"
                showVerified={booking.tasker?.is_pro ?? false}
              />
              <View style={styles.taskerDetails}>
                <Text style={styles.taskerName}>{booking.tasker?.full_name ?? ''}</Text>
                <View style={styles.ratingRow}>
                  <Star size={12} color={colors.accent} fill={colors.accent} />
                  <Text style={styles.ratingValue}>{booking.tasker?.rating_avg ?? 0}</Text>
                  <Text style={styles.ratingCount}>
                    ({booking.tasker?.completed_tasks ?? 0} {t('taskDetail.reviews', 'reviews')})
                  </Text>
                </View>
              </View>
            </View>
            {booking.tasker?.is_pro && (
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={13} color={colors.trustMuted} />
                <Text style={styles.verifiedText}>{t('taskDetail.verified', 'VERIFIED')}</Text>
              </View>
            )}
          </View>

          <Text style={styles.taskerBio}>{booking.tasker?.full_name ?? ''}</Text>

          <Pressable
            style={styles.messageButton}
            onPress={() => router.push(`/inbox/${booking.task_id}`)}
          >
            <Text style={styles.messageButtonText}>
              {t('taskDetail.messageTasker', 'Message Tasker')}
            </Text>
          </Pressable>
        </View>

        {/* Detail Bento Grid */}
        <View style={styles.bentoGrid}>
          <DetailBentoCard icon={Calendar} label={t('taskDetail.dateTime', 'DATE & TIME')}>
            <Text style={styles.bentoValue}>{scheduledDate}</Text>
            <Text style={styles.bentoValue}>{scheduledTime}</Text>
          </DetailBentoCard>

          <DetailBentoCard icon={Banknote} label={t('taskDetail.totalBudget', 'TOTAL BUDGET')}>
            <Text style={styles.bentoBudget}>{(booking.task?.budget ?? 0).toLocaleString()}₮</Text>
          </DetailBentoCard>

          <DetailBentoCard
            icon={MapPin}
            label={t('taskDetail.serviceAddress', 'SERVICE ADDRESS')}
            span
          >
            <Text style={styles.bentoAddress}>{booking.task?.location_text ?? ''}</Text>
          </DetailBentoCard>
        </View>

        {/* Map Preview Placeholder */}
        <View style={styles.mapPreview}>
          <View style={styles.mapPin}>
            <MapPin size={14} color={colors.primaryForeground} />
          </View>
          <Text style={styles.mapPlaceholder}>{t('taskDetail.mapPreview', 'Map Preview')}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={styles.primaryAction}
            onPress={async () => {
              await completeBooking.mutateAsync({
                bookingId: booking.id,
                idempotencyKey: generateIdempotencyKey(),
              });
              router.back();
            }}
          >
            <LinearGradient
              colors={[colors.primaryDeep, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryActionGradient}
            >
              <Text style={styles.primaryActionText}>
                {t('taskDetail.markComplete', 'MARK AS COMPLETE')}
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.secondaryAction} onPress={() => setShowReschedule(true)}>
            <Text style={styles.secondaryActionText}>
              {t('taskDetail.reschedule', 'Reschedule Task')}
            </Text>
          </Pressable>
        </View>

        <RescheduleModal
          visible={showReschedule}
          onClose={() => setShowReschedule(false)}
          currentDate={scheduledDate}
          currentTime={scheduledTime}
          onSubmit={async ({ date, time, reason }) => {
            await rescheduleBooking.mutateAsync({
              bookingId: booking.id,
              proposed_scheduled_at: `${date}T${time}:00`,
              reason,
              idempotencyKey: generateIdempotencyKey(),
            });
            setShowReschedule(false);
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 128,
    gap: 24,
  },

  // Hero
  heroSection: {
    gap: 12,
  },
  taskTitleMn: {
    fontSize: typography.heroTitle,
    fontWeight: '800',
    color: colors.foreground,
    lineHeight: 38,
  },

  // Tasker Card
  taskerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 20,
    gap: 15,
    overflow: 'hidden',
  },
  taskerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskerInfo: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  taskerDetails: {
    gap: 2,
  },
  taskerName: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.foreground,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingValue: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.foreground,
  },
  ratingCount: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.trust,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: typography.micro,
    fontWeight: '700',
    color: colors.accentForeground,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  taskerBio: {
    fontSize: typography.label,
    color: colors.mutedForeground,
    lineHeight: 23,
  },
  messageButton: {
    borderWidth: 1,
    borderColor: colors.textTertiary,
    borderRadius: radius.sm,
    paddingVertical: 13,
    alignItems: 'center',
  },
  messageButtonText: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.primaryDeep,
  },

  // Bento Grid
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  bentoCard: {
    width: '47%',
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: 16,
    gap: 4,
  },
  bentoCardSpan: {
    alignSelf: 'stretch',
  },
  bentoLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  bentoValue: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.foreground,
  },
  bentoBudget: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.6,
  },
  bentoAddress: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.foreground,
    lineHeight: 18,
  },

  // Map
  mapPreview: {
    height: 128,
    backgroundColor: colors.chipInactive,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPin: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryDeep,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevations.elevated,
  },
  mapPlaceholder: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: 8,
  },

  // Actions
  actions: {
    gap: 12,
    paddingTop: 16,
  },
  primaryAction: {
    borderRadius: radius.md,
    overflow: 'hidden',
    ...elevations.elevated,
  },
  primaryActionGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  primaryActionText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
  secondaryAction: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
