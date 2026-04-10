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

type FieldType =
  | 'single_select'
  | 'multi_select'
  | 'dropdown'
  | 'yes_no'
  | 'numeric_counter'
  | 'text'
  | 'textarea';

interface IntakeFieldOption {
  value: string;
  label: string;
  label_mn: string;
}

interface IntakeField {
  key: string;
  label: string;
  label_mn: string;
  type: FieldType;
  required: boolean;
  options?: IntakeFieldOption[] | null;
  min?: number | null;
  max?: number | null;
  min_length?: number | null;
  max_length?: number | null;
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

// ── Locale helper ─────────────────────────────────────────────────────────────

function getFieldLabel(field: { label: string; label_mn: string }, locale: string): string {
  return locale === 'mn' ? field.label_mn : field.label;
}

// ── Field renderers ───────────────────────────────────────────────────────────

function ChipGroup({
  options,
  value,
  multi,
  onChange,
  testIDPrefix,
  locale,
}: {
  options: IntakeFieldOption[];
  value: string | string[] | null;
  multi: boolean;
  onChange: (v: string | string[]) => void;
  testIDPrefix: string;
  locale: string;
}) {
  const selected = multi
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === 'string'
      ? [value]
      : [];

  const toggle = (optValue: string) => {
    if (multi) {
      const arr = selected.includes(optValue)
        ? selected.filter((s) => s !== optValue)
        : [...selected, optValue];
      onChange(arr);
    } else {
      onChange(optValue);
    }
  };

  return (
    <View className="flex-row flex-wrap gap-sm">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        const displayLabel = locale === 'mn' ? opt.label_mn : opt.label;
        return (
          <Pressable
            key={opt.value}
            onPress={() => toggle(opt.value)}
            className={`px-md py-sm rounded-sm justify-center items-center min-h-[40px] ${active ? 'bg-primary-deep' : 'bg-muted'}`}
            style={active ? elevations.soft : undefined}
            accessibilityRole="button"
            testID={`intake-${testIDPrefix}-${opt.value}`}
          >
            <Text
              className={
                active
                  ? 'text-caption font-bold text-primary-foreground'
                  : 'text-caption font-bold text-text-secondary'
              }
            >
              {displayLabel}
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
        const label = opt ? t('Intake.yes') : t('Intake.no');
        const active = value === opt;
        return (
          <Pressable
            key={label}
            onPress={() => onChange(opt)}
            className={`px-md py-sm rounded-sm justify-center items-center min-h-[40px] ${active ? 'bg-primary-deep' : 'bg-muted'}`}
            style={active ? elevations.soft : undefined}
            accessibilityRole="button"
            testID={`intake-${testIDPrefix}-${label.toLowerCase()}`}
          >
            <Text
              className={
                active
                  ? 'text-caption font-bold text-primary-foreground'
                  : 'text-caption font-bold text-text-secondary'
              }
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
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId: string;
    categoryName?: string;
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
      setDescriptionError(t('Intake.required'));
      valid = false;
    } else if (description.trim().length < DESCRIPTION_MIN_LENGTH) {
      setDescriptionError(
        t('Intake.descriptionMin').replace('{{min}}', String(DESCRIPTION_MIN_LENGTH)),
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
            newErrors[field.key] = t('Intake.required');
          }
        } else if (field.type === 'multi_select') {
          if (!Array.isArray(val) || val.length === 0) {
            newErrors[field.key] = t('Intake.required');
          }
        } else if (field.type === 'numeric_counter') {
          const num = Number(val);
          if (val === undefined || val === null || val === '' || !Number.isFinite(num)) {
            newErrors[field.key] = t('Intake.required');
          } else if (field.min != null && num < field.min) {
            newErrors[field.key] = t('Intake.minimumValue').replace('{{min}}', String(field.min));
          } else if (field.max != null && num > field.max) {
            newErrors[field.key] = t('Intake.maximumValue').replace('{{max}}', String(field.max));
          }
        } else if (field.type === 'text' || field.type === 'textarea') {
          const strVal = typeof val === 'string' ? val : '';
          if (!strVal.trim()) {
            newErrors[field.key] = t('Intake.required');
          } else if (field.min_length != null && strVal.length < field.min_length) {
            newErrors[field.key] = t('Intake.minimumLength').replace(
              '{{min}}',
              String(field.min_length),
            );
          } else if (field.max_length != null && strVal.length > field.max_length) {
            newErrors[field.key] = t('Intake.maximumLength').replace(
              '{{max}}',
              String(field.max_length),
            );
          }
        } else {
          // single_select, dropdown
          if (!val) {
            newErrors[field.key] = t('Intake.required');
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
        categoryName: params.categoryName ?? '',
        description,
        intakeAnswers: JSON.stringify(answers),
        intakeSchemaVersion: params.intakeSchemaVersion ?? '',
      },
    });
  };

  const locale = i18n.language ?? 'en';

  const renderSchemaField = (field: IntakeField) => {
    const error = fieldErrors[field.key];
    const fieldLabel = getFieldLabel(field, locale);

    if (
      field.type === 'single_select' ||
      field.type === 'multi_select' ||
      field.type === 'dropdown'
    ) {
      const val =
        (answers[field.key] as string | string[] | undefined) ??
        (field.type === 'multi_select' ? [] : null);
      return (
        <FormField key={field.key} label={fieldLabel} errorText={error}>
          <ChipGroup
            options={field.options ?? []}
            value={val as string | string[] | null}
            multi={field.type === 'multi_select'}
            onChange={(v) => setField(field.key, v)}
            testIDPrefix={field.key}
            locale={locale}
          />
        </FormField>
      );
    }
    if (field.type === 'yes_no') {
      const val = answers[field.key];
      const boolVal = val === true ? true : val === false ? false : null;
      return (
        <FormField key={field.key} label={fieldLabel} errorText={error}>
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
        <FormField key={field.key} label={fieldLabel} errorText={error}>
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
    if (field.type === 'text') {
      const val = answers[field.key];
      return (
        <FormField key={field.key} label={fieldLabel} errorText={error}>
          <Input
            testID={`intake-${field.key}-input`}
            value={val != null ? String(val) : ''}
            onChangeText={(text: string) => setField(field.key, text)}
            maxLength={field.max_length ?? 200}
            invalid={!!error}
          />
        </FormField>
      );
    }
    if (field.type === 'textarea') {
      const val = answers[field.key];
      return (
        <FormField key={field.key} label={fieldLabel} errorText={error}>
          <Input
            testID={`intake-${field.key}-input`}
            value={val != null ? String(val) : ''}
            onChangeText={(text: string) => setField(field.key, text)}
            multiline
            numberOfLines={4}
            maxLength={field.max_length ?? 2000}
            invalid={!!error}
            style={{ minHeight: 100, textAlignVertical: 'top' }}
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
      nextLabel={t('common.continue')}
      testID="SCR-CUST-003"
    >
      <View className="gap-sm pt-sm" testID="intake-header">
        <Text className="text-heading font-extrabold text-primary-deep">
          {t('Intake.intakePageTitle')}
        </Text>
        <Text className="text-body text-text-secondary leading-relaxed">
          {t('Intake.intakeInstruction')}
        </Text>
      </View>

      <FormField label={t('Intake.intakeDescription')} errorText={descriptionError || undefined}>
        <Input
          testID="intake-description-input"
          value={description}
          onChangeText={(text: string) => {
            setDescription(text);
            if (descriptionError) setDescriptionError('');
          }}
          placeholder={t('Intake.intakePlaceholder')}
          multiline
          numberOfLines={4}
          maxLength={DESCRIPTION_MAX_LENGTH}
          invalid={!!descriptionError}
          style={{ minHeight: 160, textAlignVertical: 'top' }}
        />
        <View className="flex-row justify-end">
          <Text className="text-caption font-bold text-muted-foreground">
            {`${description.length} / ${DESCRIPTION_MAX_LENGTH}`}
          </Text>
        </View>
      </FormField>

      {intakeEnabled && schema ? schema.map(renderSchemaField) : null}
    </FormWizardTemplate>
  );
}
