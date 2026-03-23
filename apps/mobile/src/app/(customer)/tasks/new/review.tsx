import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { useCreateTask } from '../../../../features/tasks/hooks/useCreateTask';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, radius, typography } = mobileTheme;

function formatBudget(amount: string): string {
  const num = Number(amount);
  if (isNaN(num)) return amount;
  return num.toLocaleString('en-US');
}

function SummarySection({
  label,
  value,
  onEdit,
  testID,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
  testID?: string;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.section} testID={testID}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {onEdit && (
          <Pressable onPress={onEdit} accessibilityRole="button">
            <Text style={styles.editLink}>{t('customer.postTask.edit', 'Edit')}</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.sectionValue}>{value}</Text>
    </View>
  );
}

export default function ReviewSubmitScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId: string;
    description: string;
    photos: string;
    location: string;
    date: string;
    time: string;
    budget: string;
  }>();

  const { mutateAsync, isPending } = useCreateTask();

  const handleSubmit = async () => {
    try {
      await mutateAsync({
        category_id: params.categoryId ?? '',
        description: params.description ?? '',
        budget: Number(params.budget) || 0,
        location_lat: 47.9184,
        location_lng: 106.9177,
        location_text: params.location ?? '',
        scheduled_at: `${params.date ?? ''}T${params.time ?? ''}:00Z`,
        photo_keys: [],
      });
      router.replace('/(customer)/tasks/new/success');
    } catch {
      // Error handled by mutation state
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <DetailTemplate
      headerTitle={t('customer.postTask.reviewTitle', 'Review & Post')}
      onBack={handleBack}
      ctaLabel={t('customer.postTask.postButton', 'Post Task')}
      ctaOnPress={handleSubmit}
      ctaLoading={isPending}
      testID="review-submit-screen"
    >
      <SummarySection
        label={t('customer.postTask.intakeDescription', 'Description')}
        value={params.description ?? ''}
        onEdit={() => router.back()}
        testID="review-section-description"
      />
      <SummarySection
        label={t('customer.postTask.locationTitle', 'Location')}
        value={params.location ?? t('customer.postTask.notSet', 'Not set')}
        onEdit={() => router.back()}
        testID="review-section-location"
      />
      <SummarySection
        label={t('customer.postTask.scheduleDate', 'Schedule')}
        value={
          params.date && params.time
            ? `${params.date} ${params.time}`
            : t('customer.postTask.flexible', 'Flexible')
        }
        onEdit={() => router.back()}
        testID="review-section-schedule"
      />
      <SummarySection
        label={t('customer.postTask.budgetLabel', 'Budget')}
        value={formatBudget(params.budget ?? '0')}
        onEdit={() => router.back()}
        testID="review-section-budget"
      />
      <Text style={styles.paymentNote}>
        {t('customer.postTask.paymentNote', 'Payment is arranged directly with the Tasker')}
      </Text>
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editLink: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.accent,
  },
  sectionValue: {
    fontSize: typography.body,
    color: colors.foreground,
    lineHeight: typography.body * 1.5,
  },
  paymentNote: {
    fontSize: typography.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: typography.caption * 1.6,
  },
});
