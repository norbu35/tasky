import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { mobileTheme, elevations } from '../../../../design/tokenAdapter';

const { colors, spacing, radius, typography } = mobileTheme;

const DESCRIPTION_MIN_LENGTH = 10;
const DESCRIPTION_MAX_LENGTH = 2000;

const intakeTypes = ['One-time', 'Recurring', 'Urgent'] as const;

function parseIntakeAnswers(value?: string): {
  description?: string;
  task_type?: string;
  room_count?: number | null;
} {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as {
      description?: unknown;
      task_type?: unknown;
      room_count?: unknown;
    };

    return {
      description: typeof parsed.description === 'string' ? parsed.description : undefined,
      task_type: typeof parsed.task_type === 'string' ? parsed.task_type : undefined,
      room_count: typeof parsed.room_count === 'number' ? parsed.room_count : null,
    };
  } catch {
    return {};
  }
}

export default function IntakeFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId: string;
    description?: string;
    intakeAnswers?: string;
  }>();
  const initialAnswers = useMemo(
    () => parseIntakeAnswers(params.intakeAnswers),
    [params.intakeAnswers],
  );
  const initialType =
    intakeTypes.find((type) => type === initialAnswers.task_type) ??
    ('One-time' as (typeof intakeTypes)[number]);

  const [description, setDescription] = useState(
    params.description ?? initialAnswers.description ?? '',
  );
  const [selectedType, setSelectedType] = useState<(typeof intakeTypes)[number]>(initialType);
  const [roomCount, setRoomCount] = useState(
    typeof initialAnswers.room_count === 'number' ? String(initialAnswers.room_count) : '',
  );
  const [error, setError] = useState('');

  const descriptionLength = description.length;
  const intakeAnswers = useMemo(
    () => ({
      description,
      task_type: selectedType,
      room_count: roomCount ? Number(roomCount) : null,
    }),
    [description, roomCount, selectedType],
  );

  const handleNext = () => {
    if (!description.trim()) {
      setError(t('customer.postTask.validation.required', 'This field is required'));
      return;
    }
    if (description.trim().length < DESCRIPTION_MIN_LENGTH) {
      setError(
        t(
          'customer.postTask.validation.descriptionMin',
          'Description must be at least {{min}} characters',
        ).replace('{{min}}', String(DESCRIPTION_MIN_LENGTH)),
      );
      return;
    }
    setError('');
    router.push({
      pathname: '/(customer)/tasks/new/photos',
      params: {
        categoryId: params.categoryId,
        description,
        intakeAnswers: JSON.stringify(intakeAnswers),
        intakeSchemaVersion: '1',
      },
    });
  };

  return (
    <FormWizardTemplate
      currentStep={1}
      totalSteps={7}
      onNext={handleNext}
      onBack={() => router.back()}
      nextLabel={t('common.continue', 'Continue')}
      testID="intake-form-screen"
    >
      <View style={styles.headerBlock}>
        <Text style={styles.stepLabel}>
          {t('taskPost.step', 'Step {{current}} of {{total}}')
            .replace('{{current}}', '2')
            .replace('{{total}}', '7')}
        </Text>
        <Text style={styles.title}>{t('customer.postTask.intakePageTitle', 'Task Details')}</Text>
        <Text style={styles.instruction}>
          {t('customer.postTask.intakeInstruction', 'Fill in the task details')}
        </Text>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>
          {t('customer.postTask.intakeTipTitle', 'Better details lead to better offers')}
        </Text>
        <Text style={styles.tipBody}>
          {t(
            'customer.postTask.intakeTipBody',
            'Mention the size of the job, access notes, and anything the Tasker should prepare.',
          )}
        </Text>
      </View>

      <FormField
        label={t('customer.postTask.intakeDescription', 'Description')}
        errorText={error || undefined}
      >
        <Input
          testID="intake-description-input"
          value={description}
          onChangeText={(text: string) => {
            setDescription(text);
            if (error) setError('');
          }}
          placeholder={t('customer.postTask.intakePlaceholder', 'What needs to be done?')}
          multiline
          numberOfLines={4}
          maxLength={DESCRIPTION_MAX_LENGTH}
          invalid={!!error}
          style={styles.descriptionInput}
        />
        <View style={styles.fieldMeta}>
          <Text style={styles.fieldHint}>
            {t(
              'customer.postTask.intakeHint',
              'Include size, access, timing, and any tools or materials involved.',
            )}
          </Text>
          <Text style={styles.counter}>{`${descriptionLength} / ${DESCRIPTION_MAX_LENGTH}`}</Text>
        </View>
      </FormField>

      <FormField
        label={t('customer.postTask.intakeTaskType', 'Task type')}
        helperText={t('customer.postTask.intakeTaskTypeHelper', 'Pick the closest fit')}
      >
        <View style={styles.chipRow}>
          {intakeTypes.map((type) => {
            const active = type === selectedType;
            return (
              <Pressable
                key={type}
                onPress={() => setSelectedType(type)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                testID={`intake-type-${type.toLowerCase()}`}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{type}</Text>
              </Pressable>
            );
          })}
        </View>
      </FormField>

      <FormField
        label={t('customer.postTask.intakeRoomCount', 'Room count')}
        helperText={t('customer.postTask.intakeRoomCountHelper', 'Optional: helps size the job')}
      >
        <Input
          testID="intake-room-count-input"
          value={roomCount}
          onChangeText={setRoomCount}
          placeholder={t('customer.postTask.intakeRoomCountPlaceholder', 'e.g. 2')}
          keyboardType="numeric"
          maxLength={2}
        />
      </FormField>
    </FormWizardTemplate>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  stepLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  instruction: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  tipCard: {
    borderRadius: mobileTheme.radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.muted,
    gap: spacing.sm,
  },
  tipTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  tipBody: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.6,
  },
  descriptionInput: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
  fieldMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  fieldHint: {
    flex: 1,
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.6,
  },
  counter: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.primaryDeep,
    ...elevations.soft,
  },
  chipLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  chipLabelActive: {
    color: colors.primaryForeground,
  },
});
