import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FormWizardTemplate } from '../../../../components/templates/FormWizardTemplate';
import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';
import { elevations } from '../../../../design/elevations';

const DESCRIPTION_MIN_LENGTH = 10;
const DESCRIPTION_MAX_LENGTH = 2000;

// ── Schema types ──────────────────────────────────────────────────────────────

type FieldType = 'single_select' | 'multi_select' | 'yes_no' | 'numeric_counter';

interface IntakeField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[] | null;
  min?: number | null;
  max?: number | null;
}

// ── Parsers ───────────────────────────────────────────────────────────────────

function parseSchema(value?: string): IntakeField[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as IntakeField[];
    return null;
  } catch {
    return null;
  }
}

function parseAnswers(value?: string): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

// ── Field renderers ───────────────────────────────────────────────────────────

function ChipGroup({
  options,
  value,
  multi,
  onChange,
  testIDPrefix,
}: {
  options: string[];
  value: string | string[] | null;
  multi: boolean;
  onChange: (v: string | string[]) => void;
  testIDPrefix: string;
}) {
  const selected = multi
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === 'string'
      ? [value]
      : [];

  const toggle = (opt: string) => {
    if (multi) {
      const arr = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
      onChange(arr);
    } else {
      onChange(opt);
    }
  };

  return (
    <View className="flex-row flex-wrap gap-sm">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => toggle(opt)}
            className="px-md py-sm rounded-sm justify-center items-center"
            style={[
              { minHeight: 40 },
              active
                ? { ...elevations.soft, backgroundColor: '#1B3A5C' }
                : { backgroundColor: '#F3F1EC' },
            ]}
            accessibilityRole="button"
            testID={`intake-${testIDPrefix}-${opt.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Text
              className={active ? 'text-caption font-bold text-primaryForeground' : 'text-caption font-bold text-textSecondary'}
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function YesNo({
  value,
  onChange,
  testIDPrefix,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  testIDPrefix: string;
}) {
  const { t } = useTranslation();
  return (
    <View className="flex-row flex-wrap gap-sm">
      {([true, false] as const).map((opt) => {
        const label = opt ? t('common.yes', 'Тийм') : t('common.no', 'Үгүй');
        const active = value === opt;
        return (
          <Pressable
            key={label}
            onPress={() => onChange(opt)}
            className="px-md py-sm rounded-sm justify-center items-center"
            style={[
              { minHeight: 40 },
              active
                ? { ...elevations.soft, backgroundColor: '#1B3A5C' }
                : { backgroundColor: '#F3F1EC' },
            ]}
            accessibilityRole="button"
            testID={`intake-${testIDPrefix}-${label.toLowerCase()}`}
          >
            <Text
              className={active ? 'text-caption font-bold text-primaryForeground' : 'text-caption font-bold text-textSecondary'}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function IntakeFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId: string;
    intakeEnabled?: string;
    intakeSchemaVersion?: string;
    intakeSchemaJson?: string;
    description?: string;
    intakeAnswers?: string;
  }>();

  const schema = useMemo(() => parseSchema(params.intakeSchemaJson), [params.intakeSchemaJson]);
  const intakeEnabled = params.intakeEnabled === '1';
  const initialAnswers = useMemo(() => parseAnswers(params.intakeAnswers), [params.intakeAnswers]);

  const [description, setDescription] = useState(params.description ?? '');
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

  const validate = (): boolean => {
    let valid = true;

    // Validate description
    if (!description.trim()) {
      setDescriptionError(t('customer.postTask.validation.required', 'This field is required'));
      valid = false;
    } else if (description.trim().length < DESCRIPTION_MIN_LENGTH) {
      setDescriptionError(
        t(
          'customer.postTask.validation.descriptionMin',
          'Description must be at least {{min}} characters',
        ).replace('{{min}}', String(DESCRIPTION_MIN_LENGTH)),
      );
      valid = false;
    } else {
      setDescriptionError('');
    }

    // Validate schema fields
    if (intakeEnabled && schema) {
      const newErrors: Record<string, string> = {};
      for (const field of schema) {
        if (!field.required) continue;
        const val = answers[field.key];
        if (field.type === 'yes_no') {
          if (val !== true && val !== false) {
            newErrors[field.key] = t(
              'customer.postTask.validation.required',
              'This field is required',
            );
          }
        } else if (field.type === 'multi_select') {
          if (!Array.isArray(val) || val.length === 0) {
            newErrors[field.key] = t(
              'customer.postTask.validation.required',
              'This field is required',
            );
          }
        } else if (field.type === 'numeric_counter') {
          const num = Number(val);
          if (val === undefined || val === null || val === '' || !Number.isFinite(num)) {
            newErrors[field.key] = t(
              'customer.postTask.validation.required',
              'This field is required',
            );
          } else if (field.min != null && num < field.min) {
            newErrors[field.key] = `Minimum is ${field.min}`;
          } else if (field.max != null && num > field.max) {
            newErrors[field.key] = `Maximum is ${field.max}`;
          }
        } else {
          if (!val) {
            newErrors[field.key] = t(
              'customer.postTask.validation.required',
              'This field is required',
            );
          }
        }
      }
      setFieldErrors(newErrors);
      if (Object.keys(newErrors).length > 0) valid = false;
    }

    return valid;
  };

  const handleNext = () => {
    if (!validate()) return;
    router.push({
      pathname: '/(customer)/tasks/new/photos',
      params: {
        categoryId: params.categoryId,
        description,
        intakeAnswers: JSON.stringify(answers),
        intakeSchemaVersion: params.intakeSchemaVersion ?? '',
      },
    });
  };

  const renderSchemaField = (field: IntakeField) => {
    const error = fieldErrors[field.key];
    if (field.type === 'single_select' || field.type === 'multi_select') {
      const val =
        (answers[field.key] as string | string[] | undefined) ??
        (field.type === 'multi_select' ? [] : null);
      return (
        <FormField key={field.key} label={field.label} errorText={error}>
          <ChipGroup
            options={field.options ?? []}
            value={val as string | string[] | null}
            multi={field.type === 'multi_select'}
            onChange={(v) => setField(field.key, v)}
            testIDPrefix={field.key}
          />
        </FormField>
      );
    }
    if (field.type === 'yes_no') {
      const val = answers[field.key];
      const boolVal = val === true ? true : val === false ? false : null;
      return (
        <FormField key={field.key} label={field.label} errorText={error}>
          <YesNo
            value={boolVal}
            onChange={(v) => setField(field.key, v)}
            testIDPrefix={field.key}
          />
        </FormField>
      );
    }
    if (field.type === 'numeric_counter') {
      const val = answers[field.key];
      return (
        <FormField key={field.key} label={field.label} errorText={error}>
          <Input
            testID={`intake-${field.key}-input`}
            value={val != null ? String(val) : ''}
            onChangeText={(text: string) => {
              setField(field.key, text === '' ? '' : Number(text));
            }}
            placeholder={field.min != null && field.max != null ? `${field.min}–${field.max}` : ''}
            keyboardType="numeric"
            maxLength={3}
            invalid={!!error}
          />
        </FormField>
      );
    }
    return null;
  };

  return (
    <FormWizardTemplate
      currentStep={1}
      totalSteps={7}
      onNext={handleNext}
      onBack={() => router.back()}
      nextLabel={t('common.continue', 'Continue')}
      testID="SCR-CUST-003"
    >
      <View className="gap-sm pt-sm" testID="intake-header">
        <Text className="text-heading font-extrabold text-primaryDeep">
          {t('customer.postTask.intakePageTitle', 'Task Details')}
        </Text>
        <Text className="text-body text-textSecondary leading-relaxed">
          {t('customer.postTask.intakeInstruction', 'Fill in the task details')}
        </Text>
      </View>

      <FormField
        label={t('customer.postTask.intakeDescription', 'Description')}
        errorText={descriptionError || undefined}
      >
        <Input
          testID="intake-description-input"
          value={description}
          onChangeText={(text: string) => {
            setDescription(text);
            if (descriptionError) setDescriptionError('');
          }}
          placeholder={t('customer.postTask.intakePlaceholder', 'What needs to be done?')}
          multiline
          numberOfLines={4}
          maxLength={DESCRIPTION_MAX_LENGTH}
          invalid={!!descriptionError}
          style={{ minHeight: 160, textAlignVertical: 'top' }}
        />
        <View className="flex-row justify-end">
          <Text className="text-caption font-bold text-mutedForeground">
            {`${description.length} / ${DESCRIPTION_MAX_LENGTH}`}
          </Text>
        </View>
      </FormField>

      {intakeEnabled && schema ? schema.map(renderSchemaField) : null}
    </FormWizardTemplate>
  );
}
