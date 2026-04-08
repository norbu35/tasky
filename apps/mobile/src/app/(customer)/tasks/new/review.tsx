import React, { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CalendarDays, CircleAlert, CircleDollarSign, MapPin, Sparkles } from 'lucide-react-native';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { Toast } from '../../../../components/ui/Toast';
import { useCreateTask } from '../../../../features/tasks/hooks/useCreateTask';
import { mobileTheme, elevations } from '../../../../design/tokenAdapter';
import { parseError } from '../../../../utils/errorHandling';

const { colors } = mobileTheme;

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
    <View
      testID={testID}
      className={`rounded-sm p-lg mb-md gap-sm${featured ? ' bg-primaryDeep rounded-lg' : ' bg-muted'}`}
      style={featured ? elevations.soft : undefined}
    >
      <View className="flex-row justify-between items-center">
        <Text className={`text-caption font-bold${featured ? ' text-primaryForeground/80' : ' text-textSecondary'}`}>
          {label}
        </Text>
        {onEdit ? (
          <Pressable onPress={onEdit} accessibilityRole="button">
            <Text className={`text-caption font-bold${featured ? ' text-accent' : ' text-primaryDeep'}`}>
              {t('ReviewSubmitScreen.edit')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row items-center gap-sm">
        {icon ? (
          <View
            className="w-7 h-7 rounded-md items-center justify-center"
            style={{ backgroundColor: featured ? `${colors.primaryForeground}1F` : `${colors.primary}14` }}
          >
            {icon}
          </View>
        ) : null}
        <Text
          className={`flex-1 text-body font-bold leading-snug${featured ? ' text-primaryForeground' : ' text-foreground'}`}
          style={featured ? { fontSize: 36, fontWeight: '800', lineHeight: 40 } : undefined}
        >
          {value}
        </Text>
      </View>
      {children}
    </View>
  );
}

function PhotosCard({ photos, onEdit }: { photos: string[]; onEdit: () => void }) {
  const { t } = useTranslation();
  const slots = photos.slice(0, 3);

  return (
      <View className="bg-muted rounded-sm p-lg mb-md gap-sm" testID="review-section-photos">
      <View className="flex-row justify-between items-center">
        <Text className="text-caption font-bold text-textSecondary">
          {t('ReviewSubmitScreen.sectionPhotos')}{' '}
          {photos.length > 0 ? `(${photos.length})` : ''}
        </Text>
        <Pressable onPress={onEdit} accessibilityRole="button">
          <Text className="text-caption font-bold text-primaryDeep">
            {t('ReviewSubmitScreen.edit')}
          </Text>
        </Pressable>
      </View>

      <View className="flex-row gap-sm">
        {slots.map((photo, index) => (
          <View
            key={`${photo}-${index}`}
            className="w-32 h-32 rounded-md overflow-hidden bg-muted items-center justify-center"
          >
            {isImageUri(photo) ? (
              <Image source={{ uri: photo }} className="self-stretch h-full" />
            ) : (
              <Text className="text-caption font-bold text-primaryDeep">{String(index + 1)}</Text>
            )}
          </View>
        ))}
        {Array.from({ length: Math.max(0, 3 - slots.length) }).map((_, idx) => (
          <View
            key={`empty-${idx}`}
            className="w-32 h-32 rounded-md overflow-hidden items-center justify-center border-2 border-dashed border-chipInactive bg-card"
          >
            <Text className="text-heading text-textSecondary" style={{ lineHeight: 24 }}>
              +
            </Text>
          </View>
        ))}
      </View>

      {photos.length === 0 ? (
        <Text className="text-caption text-textSecondary">
          {t('ReviewSubmitScreen.noPhotos')}
        </Text>
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
          t('ReviewSubmitScreen.submitUnexpectedResponse'),
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
      nextLabel={t('ReviewSubmitScreen.postButton')}
      nextLoading={isPending}
      nextDisabled={isPending || !hasRequiredPayload}
      testID="SCR-CUST-007"
    >
      <View className="gap-xs mb-sm">
        <Text className="text-caption font-bold text-textSecondary uppercase tracking-widest">
          {t('ReviewSubmitScreen.finalStep')}
        </Text>
        <Text className="text-heading font-extrabold text-primaryDeep">
          {t('ReviewSubmitScreen.reviewTitle')}
        </Text>
      </View>

      <SectionCard
        label={t('ReviewSubmitScreen.sectionCategory')}
        value={params.categoryId ?? ''}
        onEdit={() => router.push('/(customer)/tasks/new/category')}
        testID="review-section-category"
        icon={<Sparkles size={16} color={colors.primaryDeep} />}
      />

      <SectionCard
        label={t('ReviewSubmitScreen.sectionScope')}
        value={params.description ?? ''}
        onEdit={() =>
          router.push({
            pathname: '/(customer)/tasks/new/intake',
            params: { categoryId: commonStepParams.categoryId },
          })
        }
        testID="review-section-title"
      />

      <View className="bg-muted rounded-sm p-lg mb-md gap-sm" testID="review-section-description">
        <View className="flex-row justify-between items-center">
          <Text className="text-caption font-bold text-textSecondary">
            {t('ReviewSubmitScreen.sectionDetails')}
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
            <Text className="text-caption font-bold text-primaryDeep">
              {t('ReviewSubmitScreen.edit')}
            </Text>
          </Pressable>
        </View>
        <Text className="text-body text-foreground leading-loose">
          {showFullDescription ? description : shortDescription}
        </Text>
        {description.length > 140 ? (
          <Pressable
            onPress={() => setShowFullDescription((prev) => !prev)}
            accessibilityRole="button"
          >
            <Text className="text-caption font-bold text-accent">
              {showFullDescription
                ? t('ReviewSubmitScreen.viewLess')
                : t('ReviewSubmitScreen.viewMore')}
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
        label={t('ReviewSubmitScreen.sectionLocation')}
        value={params.location ?? t('ReviewSubmitScreen.notSet')}
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
        label={t('ReviewSubmitScreen.sectionSchedule')}
        value={formatSchedule(params.scheduledAt) || t('ReviewSubmitScreen.flexibleSchedule')}
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
        label={t('ReviewSubmitScreen.sectionBudget')}
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

      <View className="rounded-md bg-muted p-md flex-row items-start gap-sm mb-sm">
        <CircleAlert size={16} color={colors.accent} />
        <Text className="flex-1 text-caption leading-relaxed text-textSecondary">
          {t('ReviewSubmitScreen.reviewGuidance')}
        </Text>
      </View>

      {submitError ? (
        <View className="rounded-md mb-md" testID="review-submit-error">
          <Toast message={submitError} variant="error" />
        </View>
      ) : null}
    </FormWizardTemplate>
  );
}
