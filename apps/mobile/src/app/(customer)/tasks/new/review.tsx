import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CalendarDays, CircleAlert, CircleDollarSign, MapPin, Sparkles } from 'lucide-react-native';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { Toast } from '../../../../components/ui/Toast';
import { useCreateTask } from '../../../../features/tasks/hooks/useCreateTask';
import { mobileTheme, elevations } from '../../../../design/tokenAdapter';
import { parseError } from '../../../../utils/errorHandling';

const { colors, spacing, radius, typography } = mobileTheme;

function parsePhotoKeys(value?: string): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
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
    return '';
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
  return `${date}, ${time}`;
}

function extractTaskId(result: unknown): string | null {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const candidate = result as {
    id?: unknown;
    task?: { id?: unknown };
    data?: { id?: unknown };
  };

  if (typeof candidate.id === 'string' && candidate.id.length > 0) {
    return candidate.id;
  }

  if (typeof candidate.task?.id === 'string' && candidate.task.id.length > 0) {
    return candidate.task.id;
  }

  if (typeof candidate.data?.id === 'string' && candidate.data.id.length > 0) {
    return candidate.data.id;
  }

  return null;
}

function isImageUri(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function SectionCard({
  label,
  value,
  onEdit,
  testID,
  icon,
  featured = false,
  children,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
  testID?: string;
  icon?: React.ReactNode;
  featured?: boolean;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <View testID={testID} style={[styles.card, featured && styles.cardFeatured]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardLabel, featured && styles.cardLabelFeatured]}>{label}</Text>
        {onEdit ? (
          <Pressable onPress={onEdit} accessibilityRole="button">
            <Text style={[styles.editLink, featured && styles.editLinkFeatured]}>
              {t('customer.postTask.edit', 'Edit')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.cardValueRow}>
        {icon ? (
          <View style={[styles.cardIconWrap, featured && styles.cardIconWrapFeatured]}>{icon}</View>
        ) : null}
        <Text style={[styles.cardValue, featured && styles.cardValueFeatured]}>{value}</Text>
      </View>
      {children}
    </View>
  );
}

function PhotosCard({ photos, onEdit }: { photos: string[]; onEdit: () => void }) {
  const { t } = useTranslation();
  const slots = photos.slice(0, 3);

  return (
    <View style={styles.card} testID="review-section-photos">
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>
          {t('customer.postTask.sectionPhotos', 'Photos')}{' '}
          {photos.length > 0 ? `(${photos.length})` : ''}
        </Text>
        <Pressable onPress={onEdit} accessibilityRole="button">
          <Text style={styles.editLink}>{t('customer.postTask.edit', 'Edit')}</Text>
        </Pressable>
      </View>

      <View style={styles.photoGrid}>
        {slots.map((photo, index) => (
          <View key={`${photo}-${index}`} style={styles.photoSlot}>
            {isImageUri(photo) ? (
              <Image source={{ uri: photo }} style={styles.photoImage} />
            ) : (
              <Text style={styles.photoFallback}>{String(index + 1)}</Text>
            )}
          </View>
        ))}
        {Array.from({ length: Math.max(0, 3 - slots.length) }).map((_, idx) => (
          <View key={`empty-${idx}`} style={[styles.photoSlot, styles.photoSlotEmpty]}>
            <Text style={styles.photoEmptyPlus}>+</Text>
          </View>
        ))}
      </View>

      {photos.length === 0 ? (
        <Text style={styles.photosHint}>{t('customer.postTask.noPhotos', 'No photos added')}</Text>
      ) : null}
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const photos = useMemo(() => parsePhotoKeys(params.photos), [params.photos]);
  const intakeAnswers = useMemo(
    () => parseIntakeAnswers(params.intakeAnswers),
    [params.intakeAnswers],
  );

  const intakeSchemaVersion = Number(params.intakeSchemaVersion) || 1;
  const hasRequiredPayload =
    Boolean(params.categoryId) &&
    Boolean(params.description?.trim()) &&
    Boolean(params.location?.trim()) &&
    Boolean(params.lat) &&
    Boolean(params.lng) &&
    Boolean(params.budget);

  const commonStepParams = {
    categoryId: params.categoryId ?? '',
    description: params.description ?? '',
    intakeAnswers: JSON.stringify(intakeAnswers),
    intakeSchemaVersion: String(intakeSchemaVersion),
    photos: JSON.stringify(photos),
    location: params.location ?? '',
    lat: params.lat ?? '',
    lng: params.lng ?? '',
    scheduledAt: params.scheduledAt ?? '',
    budget: params.budget ?? '',
  };

  const runtimeEnv = typeof process !== 'undefined' ? process.env : undefined;
  const devAuthEnabled = runtimeEnv?.EXPO_PUBLIC_DEV_AUTH_ENABLED === 'true';

  const handleSubmit = async () => {
    // Dev bypass: skip API call and navigate directly to success screen
    if (devAuthEnabled) {
      router.replace({
        pathname: '/(customer)/tasks/new/success',
        params: { taskId: 'dev-task-00000000' },
      });
      return;
    }

    try {
      setSubmitError(null);
      const locationLat = Number(params.lat);
      const locationLng = Number(params.lng);

      const createdTask = await mutateAsync({
        category_id: params.categoryId ?? '',
        description: params.description ?? '',
        budget: Number(params.budget) || 0,
        intake_answers: intakeAnswers,
        intake_schema_version: intakeSchemaVersion,
        location_lat: Number.isFinite(locationLat) ? locationLat : 0,
        location_lng: Number.isFinite(locationLng) ? locationLng : 0,
        location_text: params.location ?? '',
        scheduled_at: params.scheduledAt ?? '',
        photo_keys: photos,
      });
      const taskId = extractTaskId(createdTask);
      if (!taskId) {
        throw new Error(
          t(
            'customer.postTask.submitUnexpectedResponse',
            'Unexpected server response. Please try again.',
          ),
        );
      }

      router.replace({
        pathname: '/(customer)/tasks/new/success',
        params: { taskId },
      });
    } catch (error) {
      setSubmitError(parseError(error));
    }
  };

  const description = params.description ?? '';
  const shortDescription =
    description.length > 140 ? `${description.slice(0, 140).trimEnd()}...` : description;

  return (
    <FormWizardTemplate
      currentStep={5}
      totalSteps={7}
      onNext={handleSubmit}
      onBack={() => router.back()}
      nextLabel={t('customer.postTask.postButton', 'Захиалга өгөх')}
      nextLoading={isPending}
      nextDisabled={isPending || !hasRequiredPayload}
      testID="SCR-CUST-007"
    >
      <View style={styles.headerBlock}>
        <Text style={styles.stepKicker}>{t('customer.postTask.finalStep', 'Final Step')}</Text>
        <Text style={styles.pageTitle}>
          {t('customer.postTask.reviewTitle', 'Review & Submit')}
        </Text>
      </View>

      <SectionCard
        label={t('customer.postTask.sectionCategory', 'Category')}
        value={params.categoryId ?? ''}
        onEdit={() => router.push('/(customer)/tasks/new/category')}
        testID="review-section-category"
        icon={<Sparkles size={16} color={colors.primaryDeep} />}
      />

      <SectionCard
        label={t('customer.postTask.sectionScope', 'Job Scope Summary')}
        value={params.description ?? ''}
        onEdit={() =>
          router.push({
            pathname: '/(customer)/tasks/new/intake',
            params: { categoryId: commonStepParams.categoryId },
          })
        }
        testID="review-section-title"
      />

      <View style={styles.card} testID="review-section-description">
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>
            {t('customer.postTask.sectionDetails', 'Task Details')}
          </Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(customer)/tasks/new/intake',
                params: { categoryId: commonStepParams.categoryId },
              })
            }
            accessibilityRole="button"
          >
            <Text style={styles.editLink}>{t('customer.postTask.edit', 'Edit')}</Text>
          </Pressable>
        </View>
        <Text style={styles.descriptionText}>
          {showFullDescription ? description : shortDescription}
        </Text>
        {description.length > 140 ? (
          <Pressable
            onPress={() => setShowFullDescription((prev) => !prev)}
            accessibilityRole="button"
          >
            <Text style={styles.viewMoreLink}>
              {showFullDescription
                ? t('customer.postTask.viewLess', 'View less')
                : t('customer.postTask.viewMore', 'View more')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <PhotosCard
        photos={photos}
        onEdit={() =>
          router.push({
            pathname: '/(customer)/tasks/new/photos',
            params: {
              categoryId: commonStepParams.categoryId,
              description: commonStepParams.description,
              intakeAnswers: commonStepParams.intakeAnswers,
              intakeSchemaVersion: commonStepParams.intakeSchemaVersion,
              photos: commonStepParams.photos,
            },
          })
        }
      />

      <SectionCard
        label={t('customer.postTask.sectionLocation', 'Location')}
        value={params.location ?? t('customer.postTask.notSet', 'Not set')}
        onEdit={() =>
          router.push({
            pathname: '/(customer)/tasks/new/location',
            params: {
              categoryId: commonStepParams.categoryId,
              description: commonStepParams.description,
              intakeAnswers: commonStepParams.intakeAnswers,
              intakeSchemaVersion: commonStepParams.intakeSchemaVersion,
              photos: commonStepParams.photos,
              location: commonStepParams.location,
              lat: commonStepParams.lat,
              lng: commonStepParams.lng,
            },
          })
        }
        testID="review-section-location"
        icon={<MapPin size={16} color={colors.accent} />}
      />

      <SectionCard
        label={t('customer.postTask.sectionSchedule', 'Schedule')}
        value={
          formatSchedule(params.scheduledAt) || t('customer.postTask.flexibleSchedule', 'Flexible')
        }
        onEdit={() =>
          router.push({
            pathname: '/(customer)/tasks/new/schedule',
            params: {
              categoryId: commonStepParams.categoryId,
              description: commonStepParams.description,
              intakeAnswers: commonStepParams.intakeAnswers,
              intakeSchemaVersion: commonStepParams.intakeSchemaVersion,
              photos: commonStepParams.photos,
              location: commonStepParams.location,
              lat: commonStepParams.lat,
              lng: commonStepParams.lng,
            },
          })
        }
        testID="review-section-schedule"
        icon={<CalendarDays size={16} color={colors.primaryDeep} />}
      />

      <SectionCard
        label={t('customer.postTask.sectionBudget', 'Budget')}
        value={formatBudget(params.budget ?? '0')}
        onEdit={() =>
          router.push({
            pathname: '/(customer)/tasks/new/schedule',
            params: {
              categoryId: commonStepParams.categoryId,
              description: commonStepParams.description,
              intakeAnswers: commonStepParams.intakeAnswers,
              intakeSchemaVersion: commonStepParams.intakeSchemaVersion,
              photos: commonStepParams.photos,
              location: commonStepParams.location,
              lat: commonStepParams.lat,
              lng: commonStepParams.lng,
            },
          })
        }
        testID="review-section-budget"
        icon={<CircleDollarSign size={16} color={colors.accent} />}
        featured
      />

      <View style={styles.guidanceCard}>
        <CircleAlert size={16} color={colors.accent} />
        <Text style={styles.guidanceText}>
          {t(
            'customer.postTask.reviewGuidance',
            'Taskers will review your task and send offers. Double-check details before posting.',
          )}
        </Text>
      </View>

      {submitError ? (
        <View style={styles.errorBox} testID="review-submit-error">
          <Toast message={submitError} variant="error" />
        </View>
      ) : null}
    </FormWizardTemplate>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  stepKicker: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  pageTitle: {
    fontSize: typography.heading,
    color: colors.primaryDeep,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.muted,
    borderRadius: radius.sm,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardFeatured: {
    backgroundColor: colors.primaryDeep,
    borderRadius: radius.lg,
    ...elevations.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  cardLabelFeatured: {
    color: `${colors.primaryForeground}CC`,
  },
  editLink: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  editLinkFeatured: {
    color: colors.accent,
  },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}14`,
  },
  cardIconWrapFeatured: {
    backgroundColor: `${colors.primaryForeground}1F`,
  },
  cardValue: {
    flex: 1,
    fontSize: typography.body,
    color: colors.foreground,
    fontWeight: '700',
    lineHeight: typography.body * 1.45,
  },
  cardValueFeatured: {
    color: colors.primaryForeground,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 36 * (10 / 9),
  },
  descriptionText: {
    fontSize: typography.body,
    color: colors.foreground,
    lineHeight: typography.body * 1.6,
  },
  viewMoreLink: {
    fontSize: typography.caption,
    color: colors.accent,
    fontWeight: '700',
  },
  photoGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photoSlot: {
    width: 128,
    height: 128,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSlotEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.chipInactive,
    backgroundColor: `${colors.card}`,
  },
  photoImage: {
    alignSelf: 'stretch',
    height: '100%',
  },
  photoFallback: {
    fontSize: typography.caption,
    color: colors.primaryDeep,
    fontWeight: '700',
  },
  photoEmptyPlus: {
    fontSize: typography.heading,
    color: colors.textSecondary,
    lineHeight: typography.heading,
  },
  photosHint: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  guidanceCard: {
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  guidanceText: {
    flex: 1,
    fontSize: typography.caption,
    lineHeight: typography.caption * 1.6,
    color: colors.textSecondary,
  },
  errorBox: {
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
});
