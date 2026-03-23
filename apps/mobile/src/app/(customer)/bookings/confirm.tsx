import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { PriceTag } from '../../../components/ui/PriceTag';
import { useAcceptApplication } from '../../../features/bookings/hooks/useAcceptApplication';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function BookingConfirmScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    taskId: string;
    applicationId: string;
    taskerId: string;
    taskTitle: string;
    taskBudget: string;
    taskSchedule: string;
    taskerName: string;
    taskerAvatar: string;
    taskerRating: string;
  }>();

  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const { mutateAsync: acceptApplication, isPending } = useAcceptApplication();

  const handleConfirm = useCallback(async () => {
    const idempotencyKey = `confirm-${params.taskId}-${params.applicationId}-${Date.now()}`;
    const booking = await acceptApplication({
      taskId: params.taskId,
      applicationId: params.applicationId,
      liabilityDisclaimerAccepted: true,
      idempotencyKey,
    });
    router.replace({
      pathname: '/(customer)/bookings/confirmed',
      params: { bookingId: booking.id },
    });
  }, [params, acceptApplication, router]);

  return (
    <DetailTemplate
      headerTitle={t('customer.bookings.confirmTitle', 'Confirm Booking')}
      onBack={() => router.back()}
      ctaLabel={t('customer.bookings.ctaConfirm', 'Confirm Booking')}
      ctaOnPress={handleConfirm}
      ctaLoading={isPending}
      ctaDisabled={!disclaimerChecked}
      testID="booking-confirm-screen"
    >
      {/* Tasker Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('customer.bookings.sectionTasker', 'Tasker')}</Text>
        <View style={styles.taskerRow}>
          <ProfileAvatar
            uri={params.taskerAvatar}
            name={params.taskerName}
            size="lg"
            showVerified
          />
          <View style={styles.taskerInfo}>
            <Text style={styles.taskerName}>{params.taskerName}</Text>
            {params.taskerRating && <Text style={styles.taskerRating}>{params.taskerRating}</Text>}
          </View>
        </View>
      </View>

      {/* Task Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('customer.bookings.sectionTask', 'Task')}</Text>
        <Text style={styles.taskTitle}>{params.taskTitle}</Text>
        {params.taskSchedule && (
          <Text style={styles.detailText}>
            {new Date(params.taskSchedule).toLocaleDateString()}
          </Text>
        )}
        {params.taskBudget && <PriceTag amount={Number(params.taskBudget)} size="sm" />}
      </View>

      {/* Payment Note */}
      <View style={styles.section}>
        <Text style={styles.paymentNote}>
          {t('customer.bookings.paymentNote', 'Payment is arranged directly with the Tasker')}
        </Text>
      </View>

      {/* Disclaimer */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('customer.bookings.sectionDisclaimer', 'Liability Disclaimer')}
        </Text>
        <Text style={styles.disclaimerText}>
          {t(
            'customer.bookings.disclaimerText',
            'Tasky is a platform connecting Customers and Taskers. Payment is arranged directly between parties. The platform is not a payment intermediary and bears no liability for arrangements made off-platform',
          )}
        </Text>
        <Pressable
          style={styles.checkboxRow}
          onPress={() => setDisclaimerChecked(!disclaimerChecked)}
          testID="booking-confirm-screen-disclaimer"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: disclaimerChecked }}
        >
          <View style={[styles.checkbox, disclaimerChecked && styles.checkboxChecked]}>
            {disclaimerChecked && <Text style={styles.checkmark}>{'✓'}</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            {t('customer.bookings.disclaimerAcknowledge', 'I agree to these terms')}
          </Text>
        </Pressable>
      </View>

      {/* Calendar Prompt */}
      <View style={styles.section}>
        <Text style={styles.calendarPrompt}>
          {t('customer.bookings.calendarPromptTitle', 'Add to calendar?')}
        </Text>
        <Text style={styles.calendarBody}>
          {t(
            'customer.bookings.calendarPromptBody',
            'Add the scheduled time to your calendar for a reminder',
          )}
        </Text>
      </View>
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
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
  taskerRating: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  taskTitle: {
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
  disclaimerText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.6,
    marginBottom: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: typography.body,
    color: colors.primaryDeep,
    flex: 1,
  },
  calendarPrompt: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  calendarBody: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
});
