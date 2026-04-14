import { describe, expect, it } from 'vitest';

import { generateIntakeScopeSummary, normalizeIntakeSchema } from '@tasky/core';

describe('intake schema utilities', () => {
  it('normalizes plain string and partial object options into labeled options', () => {
    const schema = normalizeIntakeSchema(
      [
        {
          key: 'property_type',
          label: 'Property type',
          label_mn: 'Property type',
          type: 'single_select',
          required: true,
          options: ['apartment', { value: 'deep_clean' }],
        },
      ],
      7,
    );

    expect(schema).toEqual({
      version: 7,
      fields: [
        {
          key: 'property_type',
          name: 'property_type',
          label: 'Property type',
          label_mn: 'Property type',
          type: 'single_select',
          required: true,
          options: [
            { value: 'apartment', label: 'Apartment', label_mn: 'Apartment' },
            { value: 'deep_clean', label: 'Deep Clean', label_mn: 'Deep Clean' },
          ],
          min: undefined,
          max: undefined,
          min_length: undefined,
          max_length: undefined,
        },
      ],
    });
  });

  it('generates summaries with human-readable option labels instead of raw enum values', () => {
    const schema = normalizeIntakeSchema(
      [
        {
          key: 'property_type',
          label: 'Property type',
          label_mn: 'Property type',
          type: 'single_select',
          required: true,
          options: ['apartment'],
        },
        {
          key: 'cleaning_type',
          label: 'Cleaning type',
          label_mn: 'Cleaning type',
          type: 'single_select',
          required: true,
          options: ['deep_clean'],
        },
        {
          key: 'extras',
          label: 'Extras',
          label_mn: 'Extras',
          type: 'multi_select',
          required: false,
          options: ['inside_fridge', 'laundry'],
        },
        {
          key: 'supplies_provided',
          label: 'Supplies provided by customer',
          label_mn: 'Supplies provided by customer',
          type: 'yes_no',
          required: true,
        },
      ],
      1,
    );

    expect(schema).not.toBeNull();
    expect(
      generateIntakeScopeSummary(schema!, {
        property_type: 'apartment',
        cleaning_type: 'deep_clean',
        extras: ['inside_fridge', 'laundry'],
        supplies_provided: true,
      }),
    ).toBe(
      [
        'Property type: Apartment',
        'Cleaning type: Deep Clean',
        'Extras: Inside Fridge, Laundry',
        'Supplies provided by customer: Yes',
      ].join('\n'),
    );
  });
});
