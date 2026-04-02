import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../../components/templates/DetailTemplate';
import { StepIndicator } from '../../../../components/ui/StepIndicator';
import { useCreateTask } from '../../../../features/tasks/hooks/useCreateTask';
import { mobileTheme } from '../../../../design/tokenAdapter';

const { colors, spacing, radius, typography } = mobileTheme;

function parsePhotoKeys(value?: string): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function parseIntakeAnswers(value?: string): Record<string, unknown> {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function formatBudget(amount: string): string {
  const num = Number(amount);
  if (Number.isNaN(num)) return amount;
  return `₮${num.toLocaleString('en-US')}`;
}

function formatSchedule(scheduledAt?: string): string {
  if (!scheduledAt) {
    return 'Flexible';
  }

  const parsed = new Date(scheduledAt);
  if (Number.isNaN(parsed.getTime())) {
    return scheduledAt;
  }

  const date = `${parsed.getFullYear()}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(parsed.getDate()).padStart(2, '0')}`;
  const time = parsed.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date} ${time}`;
}

function SummarySection({
  label,
  value,
  onEdit,
  testID,
  children,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
  testID?: string;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.section} testID={testID}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {onEdit ? (
          <Pressable onPress={onEdit} accessibilityRole="button">
            <Text style={styles.editLink}>{t('customer.postTask.edit', 'Edit')}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.sectionValue}>{value}</Text>
      {children}
    </View>
  );
}

function PhotosPreview({ photos }: { photos: string[] }) {
  const { t } = useTranslation();

  return (
    <View style={styles.photosRow}>
      {photos.length > 0 ? (
        photos.map((photo, index) => (
          <View key={`${photo}-${index}`} style={styles.photoThumb}>
            <Text style={styles.photoThumbText}>{String(index + 1)}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.sectionValue}>{t('customer.postTask.noPhotos', 'No photos added')}</Text>
      )}
    </View>
  );
}

export default function ReviewSubmitScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId: string;
    description: string;
    intakeAnswers?: string;
    intakeSchemaVersion?: string;
    photos: string;
    location: string;
    lat: string;
    lng: string;
    scheduledAt: string;
    budget: string;
  }>();

  const { mutateAsync, isPending } = useCreateTask();
  const photos = useMemo(() => parsePhotoKeys(params.photos), [params.photos]);
  const intakeAnswers = useMemo(() => parseIntakeAnswers(params.intakeAnswers), [params.intakeAnswers]);

  const handleSubmit = async () => {
    try {
      const locationLat = Number(params.lat);
      const locationLng = Number(params.lng);

      const createdTask = await mutateAsync({
        category_id: params.categoryId ?? '',
        description: params.description ?? '',
        budget: Number(params.budget) || 0,
        intake_answers: intakeAnswers,
        intake_schema_version: Number(params.intakeSchemaVersion) || 1,
        location_lat: Number.isFinite(locationLat) ? locationLat : 0,
        location_lng: Number.isFinite(locationLng) ? locationLng : 0,
        location_text: params.location ?? '',
        scheduled_at: params.scheduledAt ?? '',
        photo_keys: photos,
      });
      router.replace({
        pathname: '/(customer)/tasks/new/success',
        params: { taskId: createdTask.id },
      });
    } catch {
      // Error handling is surfaced by the mutation hook and screen state.
    }
  };

  return (
    <DetailTemplate
      headerTitle={t('customer.postTask.reviewPageTitle', 'Review & Submit')}
      onBack={() => router.back()}
      ctaLabel={t('customer.postTask.postButton', 'Post Task')}
      ctaOnPress={handleSubmit}
      ctaLoading={isPending}
      testID="review-submit-screen"
    >
      <View style={styles.stepWrap}>
        <StepIndicator currentStep={6} totalSteps={7} testID="review-step-indicator" />
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>{t('customer.postTask.sectionScope', 'Job Scope Summary')}</Text>
        <Text style={styles.heroTitle}>{params.description ?? ''}</Text>
        <Text style={styles.heroBody}>
          {t(
            'customer.postTask.scopeSummaryHint',
            'You can edit the summary before posting the task.',
          )}
        </Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>
            {t('customer.postTask.sectionCategory', 'Category')} · {params.categoryId}
          </Text>
        </View>
      </View>

      <SummarySection
        label={t('customer.postTask.sectionDetails', 'Task Details')}
        value={params.description ?? ''}
        onEdit={() => router.back()}
        testID="review-section-description"
      />

      <SummarySection
        label={t('customer.postTask.sectionPhotos', 'Photos')}
        value={photos.length > 0 ? t('customer.postTask.photosCount', '{{count}} photos').replace('{{count}}', String(photos.length)) : t('customer.postTask.noPhotos', 'No photos added')}
        onEdit={() => router.back()}
        testID="review-section-photos"
      >
        <PhotosPreview photos={photos} />
      </SummarySection>

      <SummarySection
        label={t('customer.postTask.sectionLocation', 'Location')}
        value={params.location ?? t('customer.postTask.notSet', 'Not set')}
        onEdit={() => router.back()}
        testID="review-section-location"
      />

      <SummarySection
        label={t('customer.postTask.sectionSchedule', 'Schedule')}
        value={formatSchedule(params.scheduledAt) || t('customer.postTask.flexible', 'Flexible')}
        onEdit={() => router.back()}
        testID="review-section-schedule"
      />

      <SummarySection
        label={t('customer.postTask.sectionBudget', 'Budget')}
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
  stepWrap: {
    marginBottom: spacing.md,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  heroLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  heroBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}12`,
  },
  categoryBadgeText: {
    fontSize: typography.caption,
    color: colors.primaryDeep,
    fontWeight: '700',
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editLink: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.accent,
  },
  sectionValue: {
    fontSize: typography.body,
    color: colors.foreground,
    lineHeight: typography.body * 1.5,
  },
  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoThumbText: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  paymentNote: {
    fontSize: typography.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: typography.caption * 1.6,
  },
});
