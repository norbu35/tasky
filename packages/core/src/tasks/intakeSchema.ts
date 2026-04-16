export type IntakeFieldType =
  | 'single_select'
  | 'multi_select'
  | 'dropdown'
  | 'yes_no'
  | 'numeric_counter'
  | 'text'
  | 'textarea';

export type IntakeLocale = 'en' | 'mn';

export interface IntakeFieldOption {
  value: string;
  label: string;
  label_mn: string;
}

export interface IntakeField {
  name: string;
  key?: string;
  label: string;
  label_mn: string;
  type: IntakeFieldType;
  required: boolean;
  options?: IntakeFieldOption[];
  min?: number;
  max?: number;
  min_length?: number;
  max_length?: number;
}

export interface IntakeSchema {
  version: number;
  fields: IntakeField[];
}

export interface IntakeSchemaSource {
  intake_enabled?: boolean | null;
  intake_schema_json?: unknown;
  intake_schema_version?: number | null;
}

export interface IntakeAnswerSummaryItem {
  key: string;
  name: string;
  label: string;
  values: string[];
}

export interface IntakeSummaryOptions {
  locale?: IntakeLocale;
  yesLabel?: string;
  noLabel?: string;
}

const DEFAULT_SCHEMA_VERSION = 1;

const VALID_FIELD_TYPES = new Set<IntakeFieldType>([
  'single_select',
  'multi_select',
  'dropdown',
  'yes_no',
  'numeric_counter',
  'text',
  'textarea',
]);

function coerceString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return undefined;
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeFieldType(value: unknown): IntakeFieldType {
  return typeof value === 'string' && VALID_FIELD_TYPES.has(value as IntakeFieldType)
    ? (value as IntakeFieldType)
    : 'text';
}

export function prettifyIntakeToken(value: string): string {
  return value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeOption(option: unknown): IntakeFieldOption | null {
  if (typeof option === 'string') {
    const value = option.trim();
    if (!value) {
      return null;
    }

    const label = prettifyIntakeToken(value);
    return { value, label, label_mn: label };
  }

  const record = asRecord(option);
  if (!record) {
    return null;
  }

  const value = coerceString(record['value']);
  if (!value) {
    return null;
  }

  const fallbackLabel = prettifyIntakeToken(value);
  return {
    value,
    label: coerceString(record['label'], record['label_mn']) ?? fallbackLabel,
    label_mn: coerceString(record['label_mn'], record['label']) ?? fallbackLabel,
  };
}

function normalizeField(field: unknown): IntakeField | null {
  const record = asRecord(field);
  if (!record) {
    return null;
  }

  const name = coerceString(record['name'], record['key']);
  if (!name) {
    return null;
  }

  const key = coerceString(record['key'], record['name']) ?? name;
  const fallbackLabel = prettifyIntakeToken(name);
  const options = Array.isArray(record['options'])
    ? record['options']
        .map((option) => normalizeOption(option))
        .filter((option): option is IntakeFieldOption => option !== null)
    : undefined;

  const normalizedField: IntakeField = {
    name,
    key,
    label: coerceString(record['label'], record['label_mn']) ?? fallbackLabel,
    label_mn: coerceString(record['label_mn'], record['label']) ?? fallbackLabel,
    type: normalizeFieldType(record['type']),
    required: Boolean(record['required']),
  };

  if (options && options.length > 0) {
    normalizedField.options = options;
  }
  const min = coerceNumber(record['min']);
  if (min !== undefined) {
    normalizedField.min = min;
  }
  const max = coerceNumber(record['max']);
  if (max !== undefined) {
    normalizedField.max = max;
  }
  const min_length = coerceNumber(record['min_length']);
  if (min_length !== undefined) {
    normalizedField.min_length = min_length;
  }
  const max_length = coerceNumber(record['max_length']);
  if (max_length !== undefined) {
    normalizedField.max_length = max_length;
  }

  return normalizedField;
}

function parseRawSchema(rawSchema: unknown): unknown {
  if (typeof rawSchema !== 'string') {
    return rawSchema;
  }

  try {
    return JSON.parse(rawSchema);
  } catch {
    return null;
  }
}

function getLocale(locale?: IntakeLocale): IntakeLocale {
  return locale === 'mn' ? 'mn' : 'en';
}

function getFieldKey(field: IntakeField): string {
  return field.key ?? field.name;
}

function getFieldAnswer(field: IntakeField, answers: Record<string, unknown>): unknown {
  if (Object.prototype.hasOwnProperty.call(answers, field.name)) {
    return answers[field.name];
  }

  const key = getFieldKey(field);
  if (key !== field.name && Object.prototype.hasOwnProperty.call(answers, key)) {
    return answers[key];
  }

  return undefined;
}

function resolveSelectableValue(
  field: IntakeField,
  value: unknown,
  locale: IntakeLocale,
): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return String(value);
  }

  const option = field.options?.find((candidate) => candidate.value === value);
  if (option) {
    return getIntakeOptionLabel(option, locale);
  }

  return prettifyIntakeToken(value);
}

export function normalizeIntakeSchema(
  rawSchema: unknown,
  version = DEFAULT_SCHEMA_VERSION,
): IntakeSchema | null {
  const parsed = parseRawSchema(rawSchema);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return null;
  }

  const fields = parsed
    .map((field) => normalizeField(field))
    .filter((field): field is IntakeField => field !== null);

  if (fields.length === 0) {
    return null;
  }

  return {
    version: coerceNumber(version) ?? DEFAULT_SCHEMA_VERSION,
    fields,
  };
}

export function normalizeCategoryIntakeSchema(
  category?: IntakeSchemaSource | null,
): IntakeSchema | null {
  if (!category?.intake_enabled) {
    return null;
  }

  return normalizeIntakeSchema(category.intake_schema_json, category.intake_schema_version ?? 1);
}

export function getIntakeFieldLabel(field: IntakeField, locale?: IntakeLocale): string {
  return getLocale(locale) === 'mn' ? field.label_mn || field.label : field.label || field.label_mn;
}

export function getIntakeOptionLabel(option: IntakeFieldOption, locale?: IntakeLocale): string {
  return getLocale(locale) === 'mn'
    ? option.label_mn || option.label
    : option.label || option.label_mn;
}

export function summarizeIntakeAnswers(
  schema: IntakeSchema,
  answers: Record<string, unknown>,
  options: IntakeSummaryOptions = {},
): IntakeAnswerSummaryItem[] {
  const locale = getLocale(options.locale);
  const yesLabel = options.yesLabel ?? 'Yes';
  const noLabel = options.noLabel ?? 'No';

  return schema.fields.flatMap((field) => {
    const raw = getFieldAnswer(field, answers);
    if (raw === undefined || raw === null || raw === '') {
      return [];
    }

    let values: string[] = [];

    switch (field.type) {
      case 'yes_no':
        values = raw === true ? [yesLabel] : raw === false ? [noLabel] : [String(raw)];
        break;
      case 'single_select':
      case 'dropdown': {
        const value = resolveSelectableValue(field, raw, locale);
        values = value ? [value] : [];
        break;
      }
      case 'multi_select':
        values = Array.isArray(raw)
          ? raw
              .map((value) => resolveSelectableValue(field, value, locale))
              .filter((value): value is string => Boolean(value))
          : [];
        break;
      default:
        values = [String(raw)];
        break;
    }

    const filteredValues = values.map((value) => value.trim()).filter(Boolean);
    if (filteredValues.length === 0) {
      return [];
    }

    return [
      {
        key: getFieldKey(field),
        name: field.name,
        label: getIntakeFieldLabel(field, locale),
        values: filteredValues,
      },
    ];
  });
}

export function generateIntakeScopeSummary(
  schema: IntakeSchema,
  answers: Record<string, unknown>,
  options: IntakeSummaryOptions = {},
): string {
  return summarizeIntakeAnswers(schema, answers, options)
    .map((item) => `${item.label}: ${item.values.join(', ')}`)
    .join('\n');
}
