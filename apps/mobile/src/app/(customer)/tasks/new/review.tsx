import React, { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  normalizeIntakeSchema,
  prettifyIntakeToken,
  summarizeIntakeAnswers,
  type IntakeAnswerSummaryItem,
  type IntakeSchema,
} from '@tasky/core';
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

function buildFallbackAnswerSummary(
  answers: Record<string, unknown>,
  t: (key: string) => string,
): IntakeAnswerSummaryItem[] {
  return Object.entries(answers)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => {
      const values = Array.isArray(value)
        ? value.map((item) => prettifyIntakeToken(String(item)))
        : [
            typeof value === 'boolean'
              ? value
                ? t('common.yes')
                : t('common.no')
              : typeof value === 'number'
                ? String(value)
                : typeof value === 'string'
                  ? prettifyIntakeToken(value)
                  : String(value ?? ''),
          ].filter(Boolean);

      return {
        key,
        name: key,
        label: prettifyIntakeToken(key),
        values,
      };
    });
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
      className={`rounded-sm p-lg mb-md gap-sm${featured ? ' bg-primary-deep rounded-lg' : ' bg-muted'}`}
      style={featured ? elevations.soft : undefined}
    >
      <View className="flex-row justify-between items-center">
        <Text
          className={`text-caption font-bold${featured ? ' text-primary-foreground/80' : ' text-text-secondary'}`}
        >
          {label}
        </Text>
        {onEdit ? (
          <Pressable onPress={onEdit} accessibilityRole="button">
            <Text
              className={`text-caption font-bold${featured ? ' text-accent' : ' text-primary-deep'}`}
            >
              {t('ReviewSubmitScreen.edit')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row items-center gap-sm">
        {icon ? (
          <View
            className="w-7 h-7 rounded-md items-center justify-center"
            style={{
              backgroundColor: featured ? `${colors.primaryForeground}1F` : `${colors.primary}14`,
            }}
          >
            {icon}
          </View>
        ) : null}
        <Text
          className={`flex-1 text-body font-bold leading-snug${featured ? ' text-primary-foreground text-[36px] font-extrabold leading-[40px]' : ' text-foreground'}`}
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
        <Text className="text-caption font-bold text-text-secondary">
          {t('ReviewSubmitScreen.sectionPhotos')} {photos.length > 0 ? `(${photos.length})` : ''}
        </Text>
        <Pressable onPress={onEdit} accessibilityRole="button">
          <Text className="text-caption font-bold text-primary-deep">
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
              <Text className="text-caption font-bold text-primary-deep">{String(index + 1)}</Text>
            )}
          </View>
        ))}
        {Array.from({ length: Math.max(0, 3 - slots.length) }).map((_, idx) => (
          <View
            key={`empty-${idx}`}
            className="w-32 h-32 rounded-md overflow-hidden items-center justify-center border-2 border-dashed border-chip-inactive bg-card"
          >
            <Text className="text-heading text-text-secondary leading-[24px]">+</Text>
          </View>
        ))}
      </View>

      {photos.length === 0 ? (
        <Text className="text-caption text-text-secondary">{t('ReviewSubmitScreen.noPhotos')}</Text>
      ) : null}
    </View>
  );
}

function IntakeAnswersSummary({
  answers,
  schema,
}: {
  answers: Record<string, unknown>;
  schema: IntakeSchema | null;
}) {
  const { t, i18n } = useTranslation();
  const summaryItems = useMemo(() => {
    if (schema) {
      return summarizeIntakeAnswers(schema, answers, {
        locale: i18n.language === 'mn' ? 'mn' : 'en',
        yesLabel: t('common.yes'),
        noLabel: t('common.no'),
      });
    }

    return buildFallbackAnswerSummary(answers, t);
  }, [answers, i18n.language, schema, t]);

  if (summaryItems.length === 0) {
    return null;
  }

  return (
    <View className="mt-sm gap-sm">
      {summaryItems.map((item: IntakeAnswerSummaryItem) => (
        <View key={item.key} className="gap-xs">
          <Text className="text-caption font-bold text-text-secondary">{item.label}</Text>
          <View className="flex-row flex-wrap gap-xs">
            {item.values.map((value: string, index: number) => (
              <View key={`${item.key}-${index}`} className="px-md py-sm rounded-sm bg-card">
                <Text className="text-label font-bold text-foreground">{value}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

export default function ReviewSubmitScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId: string;
    categoryName?: string;
    description: string;
    intakeAnswers?: string;
    intakeSchemaVersion?: string;
    intakeSchemaJson?: string;
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
  const intakeSchema = useMemo(
    () => normalizeIntakeSchema(params.intakeSchemaJson, intakeSchemaVersion),
    [params.intakeSchemaJson, intakeSchemaVersion],
  );
  const hasRequiredPayload =
    Boolean(params.categoryId) &&
    Boolean(params.description?.trim()) &&
    Boolean(params.location?.trim()) &&
    Boolean(params.lat) &&
    Boolean(params.lng) &&
    Boolean(params.budget);

  const commonStepParams = {
    categoryId: params.categoryId ?? '',
    categoryName: params.categoryName ?? '',
    description: params.description ?? '',
    intakeAnswers: JSON.stringify(intakeAnswers),
    intakeSchemaVersion: String(intakeSchemaVersion),
    intakeSchemaJson: params.intakeSchemaJson ?? '',
    photos: JSON.stringify(photos),
    location: params.location ?? '',
    lat: params.lat ?? '',
    lng: params.lng ?? '',
    scheduledAt: params.scheduledAt ?? '',
    budget: params.budget ?? '',
  };

  const handleSubmit = async () => {
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
        throw new Error(t('ReviewSubmitScreen.submitUnexpectedResponse'));
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
      nextButtonTestID="SCR-CUST-007-cta"
    >
      <View className="gap-xs mb-sm">
        <Text className="text-caption font-bold text-text-secondary uppercase tracking-widest">
          {t('ReviewSubmitScreen.finalStep')}
        </Text>
        <Text className="text-heading font-extrabold text-primary-deep">
          {t('ReviewSubmitScreen.reviewTitle')}
        </Text>
      </View>

      <SectionCard
        label={t('ReviewSubmitScreen.sectionCategory')}
        value={params.categoryName ?? params.categoryId ?? ''}
        onEdit={() =>
          router.push({
            pathname: '/(customer)/tasks/new/category',
            params: {
              categoryId: commonStepParams.categoryId,
              categoryName: commonStepParams.categoryName,
            },
          })
        }
        testID="review-section-category"
        icon={<Sparkles size={16} color={colors.primaryDeep} />}
      />

      <SectionCard
        label={t('ReviewSubmitScreen.sectionScope')}
        value={params.description ?? ''}
        onEdit={() =>
          router.push({
            pathname: '/(customer)/tasks/new/intake',
            params: {
              categoryId: commonStepParams.categoryId,
              categoryName: commonStepParams.categoryName,
            },
          })
        }
        testID="review-section-title"
      >
        <IntakeAnswersSummary answers={intakeAnswers} schema={intakeSchema} />
      </SectionCard>

      <View className="bg-muted rounded-sm p-lg mb-md gap-sm" testID="review-section-description">
        <View className="flex-row justify-between items-center">
          <Text className="text-caption font-bold text-text-secondary">
            {t('ReviewSubmitScreen.sectionDetails')}
          </Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(customer)/tasks/new/intake',
                params: {
                  categoryId: commonStepParams.categoryId,
                  categoryName: commonStepParams.categoryName,
                },
              })
            }
            accessibilityRole="button"
          >
            <Text className="text-caption font-bold text-primary-deep">
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
              categoryName: commonStepParams.categoryName,
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
              categoryName: commonStepParams.categoryName,
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
              categoryName: commonStepParams.categoryName,
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
              categoryName: commonStepParams.categoryName,
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
      />

      <View className="rounded-md bg-muted p-md flex-row items-start gap-sm mb-sm">
        <CircleAlert size={16} color={colors.accent} />
        <Text className="flex-1 text-caption leading-relaxed text-text-secondary">
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
