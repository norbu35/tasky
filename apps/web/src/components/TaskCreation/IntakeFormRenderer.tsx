export interface IntakeField {
  name: string;
  label: string;
  label_mn: string;
  type:
    | "single_select"
    | "multi_select"
    | "dropdown"
    | "yes_no"
    | "numeric_counter";
  required: boolean;
  options?: { value: string; label: string; label_mn: string }[];
  min?: number;
  max?: number;
}

export interface IntakeSchema {
  version: number;
  fields: IntakeField[];
}

export interface IntakeFormRendererProps {
  schema: IntakeSchema;
  values: Record<string, unknown>;
  onChange: (fieldName: string, value: unknown) => void;
  errors?: Record<string, string>;
  locale?: "en" | "mn";
}

function getLabel(
  item: { label: string; label_mn: string },
  locale: "en" | "mn",
): string {
  return locale === "mn" ? item.label_mn : item.label;
}

function SingleSelectField({
  field,
  value,
  onChange,
  error,
  locale,
}: {
  field: IntakeField;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  locale: "en" | "mn";
}) {
  const fieldLabel = getLabel(field, locale);
  return (
    <div data-field={field.name}>
      <span>
        {fieldLabel}
        {field.required && <span>*</span>}
      </span>
      <div
        role="radiogroup"
        aria-label={fieldLabel}
        aria-required={field.required ? "true" : undefined}
      >
        {field.options?.map((opt) => {
          const optLabel = getLabel(opt, locale);
          const id = `${field.name}-${opt.value}`;
          return (
            <label key={opt.value} htmlFor={id} className="flex items-center gap-2">
              <input
                type="radio"
                id={id}
                name={field.name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(field.name, opt.value)}
              />
              {optLabel}
            </label>
          );
        })}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

function MultiSelectField({
  field,
  value,
  onChange,
  error,
  locale,
}: {
  field: IntakeField;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  locale: "en" | "mn";
}) {
  const fieldLabel = getLabel(field, locale);
  const selected = Array.isArray(value) ? (value as string[]) : [];

  return (
    <div data-field={field.name}>
      <span>{fieldLabel}</span>
      <div>
        {field.options?.map((opt) => {
          const optLabel = getLabel(opt, locale);
          const id = `${field.name}-${opt.value}`;
          const isChecked = selected.includes(opt.value);
          return (
            <label key={opt.value} htmlFor={id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={id}
                name={field.name}
                value={opt.value}
                checked={isChecked}
                onChange={() => {
                  if (isChecked) {
                    onChange(
                      field.name,
                      selected.filter((v) => v !== opt.value),
                    );
                  } else {
                    onChange(field.name, [...selected, opt.value]);
                  }
                }}
              />
              {optLabel}
            </label>
          );
        })}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

function DropdownField({
  field,
  value,
  onChange,
  error,
  locale,
}: {
  field: IntakeField;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  locale: "en" | "mn";
}) {
  const fieldLabel = getLabel(field, locale);
  return (
    <div data-field={field.name}>
      <label htmlFor={field.name}>
        {fieldLabel}
        {field.required && <span>*</span>}
      </label>
      <select
        id={field.name}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(field.name, e.target.value)}
        required={field.required}
      >
        <option value="" disabled>
          Select...
        </option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {getLabel(opt, locale)}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

function YesNoField({
  field,
  value,
  onChange,
  error,
  locale,
}: {
  field: IntakeField;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  locale: "en" | "mn";
}) {
  const fieldLabel = getLabel(field, locale);
  const yesId = `${field.name}-yes`;
  const noId = `${field.name}-no`;

  return (
    <div data-field={field.name}>
      <span>{fieldLabel}</span>
      <div role="radiogroup" aria-label={fieldLabel}>
        <label htmlFor={yesId} className="flex items-center gap-2">
          <input
            type="radio"
            id={yesId}
            name={field.name}
            checked={value === true}
            onChange={() => onChange(field.name, true)}
          />
          Yes
        </label>
        <label htmlFor={noId} className="flex items-center gap-2">
          <input
            type="radio"
            id={noId}
            name={field.name}
            checked={value === false}
            onChange={() => onChange(field.name, false)}
          />
          No
        </label>
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

function NumericCounterField({
  field,
  value,
  onChange,
  error,
  locale,
}: {
  field: IntakeField;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  locale: "en" | "mn";
}) {
  const fieldLabel = getLabel(field, locale);
  const currentValue = typeof value === "number" ? value : field.min ?? 0;

  return (
    <div data-field={field.name}>
      <label htmlFor={field.name}>
        {fieldLabel}
        {field.required && <span>*</span>}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Decrement"
          onClick={() => {
            if (field.min !== undefined && currentValue <= field.min) return;
            onChange(field.name, currentValue - 1);
          }}
        >
          -
        </button>
        <input
          type="number"
          id={field.name}
          value={typeof value === "number" ? value : ""}
          min={field.min !== undefined ? String(field.min) : undefined}
          max={field.max !== undefined ? String(field.max) : undefined}
          aria-required={field.required ? "true" : undefined}
          onChange={(e) => {
            const num = Number(e.target.value);
            onChange(field.name, num);
          }}
        />
        <button
          type="button"
          aria-label="Increment"
          onClick={() => {
            if (field.max !== undefined && currentValue >= field.max) return;
            onChange(field.name, currentValue + 1);
          }}
        >
          +
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

export function IntakeFormRenderer({
  schema,
  values,
  onChange,
  errors,
  locale = "en",
}: IntakeFormRendererProps) {
  if (schema.fields.length === 0) {
    return <div />;
  }

  return (
    <div>
      {schema.fields.map((field) => {
        const error = errors?.[field.name];
        const value = values[field.name];

        switch (field.type) {
          case "single_select":
            return (
              <SingleSelectField
                key={field.name}
                field={field}
                value={value}
                onChange={onChange}
                error={error}
                locale={locale}
              />
            );
          case "multi_select":
            return (
              <MultiSelectField
                key={field.name}
                field={field}
                value={value}
                onChange={onChange}
                error={error}
                locale={locale}
              />
            );
          case "dropdown":
            return (
              <DropdownField
                key={field.name}
                field={field}
                value={value}
                onChange={onChange}
                error={error}
                locale={locale}
              />
            );
          case "yes_no":
            return (
              <YesNoField
                key={field.name}
                field={field}
                value={value}
                onChange={onChange}
                error={error}
                locale={locale}
              />
            );
          case "numeric_counter":
            return (
              <NumericCounterField
                key={field.name}
                field={field}
                value={value}
                onChange={onChange}
                error={error}
                locale={locale}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
