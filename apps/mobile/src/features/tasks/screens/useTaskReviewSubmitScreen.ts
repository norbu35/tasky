import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { normalizeIntakeSchema } from '@tasky/core';

import { parseError } from '@/utils/errorHandling';
import { useTaskDraftStore, isDraftComplete } from '@/features/tasks/draft';

import { useCreateTask } from '../hooks/useCreateTask';

import { extractTaskId, truncateDescription } from './TaskReviewSubmit.model';

export interface ReviewSubmitDraft {
  photos: string[];
  intakeAnswers: Record<string, unknown>;
  intakeSchemaVersion: number;
  description: string;
  shortDescription: string;
  categoryId: string;
  categoryName: string;
  locationText: string;
  scheduledAt: string;
  budget: string;
}

export function useTaskReviewSubmitScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const taskDraft = useTaskDraftStore((s) => s.drafts[draftId]);

  const { mutateAsync, isPending } = useCreateTask();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const photos = useMemo(() => taskDraft?.photos ?? [], [taskDraft?.photos]);

  const intakeAnswers = useMemo(() => taskDraft?.intakeAnswers ?? {}, [taskDraft?.intakeAnswers]);

  const intakeSchemaVersion = taskDraft?.intakeSchemaVersion ?? 1;

  const intakeSchema = useMemo(
    () => normalizeIntakeSchema(taskDraft?.intakeSchemaJson, intakeSchemaVersion),
    [taskDraft?.intakeSchemaJson, intakeSchemaVersion],
  );

  const description = taskDraft?.description ?? '';
  const shortDescription = truncateDescription(description);
  const budget = taskDraft?.budget != null ? String(taskDraft.budget) : '';
  const categoryId = taskDraft?.categoryId ?? '';
  const categoryName = taskDraft?.categoryName ?? '';
  const locationText = taskDraft?.location?.text ?? '';
  const scheduledAt = taskDraft?.scheduledAt ?? '';

  const isValid = isDraftComplete(taskDraft);

  const draft: ReviewSubmitDraft = {
    photos,
    intakeAnswers,
    intakeSchemaVersion,
    description,
    shortDescription,
    categoryId,
    categoryName,
    locationText,
    scheduledAt,
    budget,
  };

  const handleSubmit = async () => {
    try {
      setSubmitError(null);

      const locationLat = taskDraft!.location!.lat;
      const locationLng = taskDraft!.location!.lng;

      const createdTask = await mutateAsync({
        category_id: categoryId,
        description,
        budget: Number(budget) || 0,
        intake_answers: intakeAnswers,
        intake_schema_version: intakeSchemaVersion,
        location_lat: Number.isFinite(locationLat) ? locationLat : 0,
        location_lng: Number.isFinite(locationLng) ? locationLng : 0,
        location_text: locationText,
        scheduled_at: scheduledAt,
        photo_keys: photos,
      });
      const taskId = extractTaskId(createdTask);
      if (!taskId) {
        throw new Error(t('ReviewSubmitScreen.submitUnexpectedResponse'));
      }

      router.replace({
        pathname: '/(customer)/tasks/new/success',
        params: { taskId, draftId },
      });
    } catch (error) {
      setSubmitError(parseError(error));
    }
  };

  const navigateWithDraftId = (pathname: string) => router.push({ pathname, params: { draftId } });

  return {
    draft,
    intakeSchema,
    isValid,
    isSubmitting: isPending,
    error: submitError,
    showFullDescription,
    toggleDescription: () => setShowFullDescription((prev) => !prev),
    submit: handleSubmit,
    goBack: () => router.back(),
    navigateToCategory: () => navigateWithDraftId('/(customer)/tasks/new/category'),
    navigateToIntake: () => navigateWithDraftId('/(customer)/tasks/new/intake'),
    navigateToPhotos: () => navigateWithDraftId('/(customer)/tasks/new/photos'),
    navigateToLocation: () => navigateWithDraftId('/(customer)/tasks/new/location'),
    navigateToSchedule: () => navigateWithDraftId('/(customer)/tasks/new/schedule'),
  };
}
