import { getIntakeFieldLabel, type IntakeField } from '@tasky/core';

export const DESCRIPTION_MIN_LENGTH = 10;
export const DESCRIPTION_MAX_LENGTH = 2000;

export function getFieldLabel(field: IntakeField, locale: string): string {
  return getIntakeFieldLabel(field, locale === 'mn' ? 'mn' : 'en');
}

export interface IntakeValidationResult {
  descriptionError: string;
  fieldErrors: Record<string, string>;
  valid: boolean;
}

export function validateIntake(
  description: string,
  answers: Record<string, unknown>,
  schema: IntakeField[] | null,
  intakeEnabled: boolean,
  t: (key: string) => string,
): IntakeValidationResult {
  let valid = true;
  let descriptionError = '';

  if (!description.trim()) {
    descriptionError = t('Intake.required');
    valid = false;
  } else if (description.trim().length < DESCRIPTION_MIN_LENGTH) {
    descriptionError = t('Intake.descriptionMin').replace(
      '{{min}}',
      String(DESCRIPTION_MIN_LENGTH),
    );
    valid = false;
  }

  const fieldErrors: Record<string, string> = {};

  if (intakeEnabled && schema) {
    for (const field of schema) {
      const fieldKey = field.key ?? field.name;
      if (!field.required) continue;
      const val = answers[fieldKey];
      if (field.type === 'yes_no') {
        if (val !== true && val !== false) {
          fieldErrors[fieldKey] = t('Intake.required');
        }
      } else if (field.type === 'multi_select') {
        if (!Array.isArray(val) || val.length === 0) {
          fieldErrors[fieldKey] = t('Intake.required');
        }
      } else if (field.type === 'numeric_counter') {
        const num = Number(val);
        if (val === undefined || val === null || val === '' || !Number.isFinite(num)) {
          fieldErrors[fieldKey] = t('Intake.required');
        } else if (field.min != null && num < field.min) {
          fieldErrors[fieldKey] = t('Intake.minimumValue').replace('{{min}}', String(field.min));
        } else if (field.max != null && num > field.max) {
          fieldErrors[fieldKey] = t('Intake.maximumValue').replace('{{max}}', String(field.max));
        }
      } else if (field.type === 'text' || field.type === 'textarea') {
        const strVal = typeof val === 'string' ? val : '';
        if (!strVal.trim()) {
          fieldErrors[fieldKey] = t('Intake.required');
        } else if (field.min_length != null && strVal.length < field.min_length) {
          fieldErrors[fieldKey] = t('Intake.minimumLength').replace(
            '{{min}}',
            String(field.min_length),
          );
        } else if (field.max_length != null && strVal.length > field.max_length) {
          fieldErrors[fieldKey] = t('Intake.maximumLength').replace(
            '{{max}}',
            String(field.max_length),
          );
        }
      } else {
        if (!val) {
          fieldErrors[fieldKey] = t('Intake.required');
        }
      }
    }
    if (Object.keys(fieldErrors).length > 0) valid = false;
  }

  return { descriptionError, fieldErrors, valid };
}
