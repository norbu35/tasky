import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { normalizeIntakeSchema, type IntakeField } from '@tasky/core';

import { useTaskDraftStore } from '@/features/tasks/draft';

import { DESCRIPTION_MAX_LENGTH, validateIntake } from './TaskIntake.model';

export function useTaskIntakeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const draft = useTaskDraftStore((s) => s.drafts[draftId]);
  const updateDraft = useTaskDraftStore((s) => s.updateDraft);

  const schema: IntakeField[] | null = useMemo(
    () => normalizeIntakeSchema(draft?.intakeSchemaJson)?.fields ?? null,
    [draft?.intakeSchemaJson],
  );
  const intakeEnabled = draft?.intakeEnabled === true;
  const initialAnswers = useMemo(() => draft?.intakeAnswers ?? {}, [draft?.intakeAnswers]);

  const [description, setDescription] = useState(draft?.description ?? '');
  const [descriptionError, setDescriptionError] = useState('');
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setField = (key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    if (descriptionError) setDescriptionError('');
  };

  const handleNext = () => {
    const result = validateIntake(description, answers, schema, intakeEnabled, t);
    if (!result.valid) {
      setDescriptionError(result.descriptionError);
      setFieldErrors(result.fieldErrors);
      return;
    }

    updateDraft(draftId, {
      description,
      intakeAnswers: answers,
      currentStep: 1,
    });
    router.push({
      pathname: '/(customer)/tasks/new/photos',
      params: { draftId },
    });
  };

  const locale = i18n.language ?? 'en';

  return {
    description,
    descriptionError,
    answers,
    fieldErrors,
    schema,
    intakeEnabled,
    locale,
    maxDescriptionLength: DESCRIPTION_MAX_LENGTH,
    setField,
    handleDescriptionChange,
    handleNext,
    goBack: () => router.back(),
  };
}
