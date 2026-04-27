import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { getIntakeOptionLabel, type IntakeField, type IntakeFieldOption } from '@tasky/core';

import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';

import { getFieldLabel } from './TaskIntake.model';

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
        const displayLabel = getIntakeOptionLabel(opt, locale === 'mn' ? 'mn' : 'en');
        return (
          <Touchable
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
          </Touchable>
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
        const automationValue = opt ? 'yes' : 'no';
        const active = value === opt;
        return (
          <Touchable
            key={label}
            onPress={() => onChange(opt)}
            className={`px-md py-sm rounded-sm justify-center items-center min-h-[40px] ${active ? 'bg-primary-deep' : 'bg-muted'}`}
            style={active ? elevations.soft : undefined}
            accessibilityRole="button"
            testID={`intake-${testIDPrefix}-${automationValue}`}
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
          </Touchable>
        );
      })}
    </View>
  );
}

interface SchemaFieldRendererProps {
  field: IntakeField;
  answers: Record<string, unknown>;
  fieldErrors: Record<string, string>;
  locale: string;
  onFieldChange: (key: string, value: unknown) => void;
}

export function SchemaFieldRenderer({
  field,
  answers,
  fieldErrors,
  locale,
  onFieldChange,
}: SchemaFieldRendererProps) {
  const fieldKey = field.key ?? field.name;
  const error = fieldErrors[fieldKey];
  const fieldLabel = getFieldLabel(field, locale);

  if (
    field.type === 'single_select' ||
    field.type === 'multi_select' ||
    field.type === 'dropdown'
  ) {
    const val =
      (answers[fieldKey] as string | string[] | undefined) ??
      (field.type === 'multi_select' ? [] : null);
    return (
      <FormField key={fieldKey} label={fieldLabel} errorText={error}>
        <ChipGroup
          options={field.options ?? []}
          value={val as string | string[] | null}
          multi={field.type === 'multi_select'}
          onChange={(v) => onFieldChange(fieldKey, v)}
          testIDPrefix={fieldKey}
          locale={locale}
        />
      </FormField>
    );
  }
  if (field.type === 'yes_no') {
    const val = answers[fieldKey];
    const boolVal = val === true ? true : val === false ? false : null;
    return (
      <FormField key={fieldKey} label={fieldLabel} errorText={error}>
        <YesNo
          value={boolVal}
          onChange={(v) => onFieldChange(fieldKey, v)}
          testIDPrefix={fieldKey}
        />
      </FormField>
    );
  }
  if (field.type === 'numeric_counter') {
    const val = answers[fieldKey];
    return (
      <FormField key={fieldKey} label={fieldLabel} errorText={error}>
        <Input
          testID={`intake-${fieldKey}-input`}
          value={val != null ? String(val) : ''}
          onChangeText={(text: string) => {
            onFieldChange(fieldKey, text === '' ? '' : Number(text));
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
    const val = answers[fieldKey];
    return (
      <FormField key={fieldKey} label={fieldLabel} errorText={error}>
        <Input
          testID={`intake-${fieldKey}-input`}
          value={val != null ? String(val) : ''}
          onChangeText={(text: string) => onFieldChange(fieldKey, text)}
          maxLength={field.max_length ?? 200}
          invalid={!!error}
        />
      </FormField>
    );
  }
  if (field.type === 'textarea') {
    const val = answers[fieldKey];
    return (
      <FormField key={fieldKey} label={fieldLabel} errorText={error}>
        <Input
          testID={`intake-${fieldKey}-input`}
          value={val != null ? String(val) : ''}
          onChangeText={(text: string) => onFieldChange(fieldKey, text)}
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
}
