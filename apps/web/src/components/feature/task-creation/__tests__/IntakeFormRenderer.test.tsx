import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { IntakeFormRenderer } from '../IntakeFormRenderer';

// ---------------------------------------------------------------------------
// Helper schema factories
// ---------------------------------------------------------------------------

interface IntakeField {
  name: string;
  label: string;
  label_mn: string;
  type: 'single_select' | 'multi_select' | 'dropdown' | 'yes_no' | 'numeric_counter';
  required: boolean;
  options?: { value: string; label: string; label_mn: string }[];
  min?: number;
  max?: number;
}

interface IntakeSchema {
  version: number;
  fields: IntakeField[];
}

const singleSelectSchema: IntakeSchema = {
  version: 1,
  fields: [
    {
      name: 'cleaning_type',
      label: 'Cleaning Type',
      label_mn: 'Цэвэрлэгээний төрөл',
      type: 'single_select',
      required: true,
      options: [
        { value: 'standard', label: 'Standard', label_mn: 'Энгийн' },
        { value: 'deep', label: 'Deep Clean', label_mn: 'Гүнзгий цэвэрлэгээ' },
        { value: 'move_out', label: 'Move-out', label_mn: 'Нүүлт' },
      ],
    },
  ],
};

const multiSelectSchema: IntakeSchema = {
  version: 1,
  fields: [
    {
      name: 'extras',
      label: 'Extra Services',
      label_mn: 'Нэмэлт үйлчилгээ',
      type: 'multi_select',
      required: false,
      options: [
        { value: 'laundry', label: 'Laundry', label_mn: 'Угаалга' },
        { value: 'dishes', label: 'Dishes', label_mn: 'Аяга таваг' },
        { value: 'windows', label: 'Windows', label_mn: 'Цонх' },
      ],
    },
  ],
};

const dropdownSchema: IntakeSchema = {
  version: 1,
  fields: [
    {
      name: 'property_type',
      label: 'Property Type',
      label_mn: 'Үл хөдлөх хөрөнгийн төрөл',
      type: 'dropdown',
      required: true,
      options: [
        { value: 'apartment', label: 'Apartment', label_mn: 'Орон сууц' },
        { value: 'house', label: 'House', label_mn: 'Байшин' },
        { value: 'office', label: 'Office', label_mn: 'Оффис' },
      ],
    },
  ],
};

const yesNoSchema: IntakeSchema = {
  version: 1,
  fields: [
    {
      name: 'has_pets',
      label: 'Do you have pets?',
      label_mn: 'Тэжээвэр амьтантай юу?',
      type: 'yes_no',
      required: false,
    },
  ],
};

const numericCounterSchema: IntakeSchema = {
  version: 1,
  fields: [
    {
      name: 'room_count',
      label: 'Number of Rooms',
      label_mn: 'Өрөөний тоо',
      type: 'numeric_counter',
      required: true,
      min: 1,
      max: 10,
    },
  ],
};

const fullSchema: IntakeSchema = {
  version: 1,
  fields: [
    {
      name: 'cleaning_type',
      label: 'Cleaning Type',
      label_mn: 'Цэвэрлэгээний төрөл',
      type: 'single_select',
      required: true,
      options: [
        { value: 'standard', label: 'Standard', label_mn: 'Энгийн' },
        { value: 'deep', label: 'Deep Clean', label_mn: 'Гүнзгий цэвэрлэгээ' },
      ],
    },
    {
      name: 'extras',
      label: 'Extra Services',
      label_mn: 'Нэмэлт үйлчилгээ',
      type: 'multi_select',
      required: false,
      options: [
        { value: 'laundry', label: 'Laundry', label_mn: 'Угаалга' },
        { value: 'dishes', label: 'Dishes', label_mn: 'Аяга таваг' },
      ],
    },
    {
      name: 'property_type',
      label: 'Property Type',
      label_mn: 'Үл хөдлөх хөрөнгийн төрөл',
      type: 'dropdown',
      required: true,
      options: [
        { value: 'apartment', label: 'Apartment', label_mn: 'Орон сууц' },
        { value: 'house', label: 'House', label_mn: 'Байшин' },
      ],
    },
    {
      name: 'has_pets',
      label: 'Do you have pets?',
      label_mn: 'Тэжээвэр амьтантай юу?',
      type: 'yes_no',
      required: false,
    },
    {
      name: 'room_count',
      label: 'Number of Rooms',
      label_mn: 'Өрөөний тоо',
      type: 'numeric_counter',
      required: true,
      min: 1,
      max: 10,
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('IntakeFormRenderer', () => {
  // =========================================================================
  // single_select (radio group)
  // =========================================================================
  describe('single_select fields', () => {
    it('renders a radio button for each option', () => {
      render(<IntakeFormRenderer schema={singleSelectSchema} values={{}} onChange={vi.fn()} />);

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);
    });

    it('shows option labels matching the English locale by default', () => {
      render(<IntakeFormRenderer schema={singleSelectSchema} values={{}} onChange={vi.fn()} />);

      expect(screen.getByText('Standard')).toBeInTheDocument();
      expect(screen.getByText('Deep Clean')).toBeInTheDocument();
      expect(screen.getByText('Move-out')).toBeInTheDocument();
    });

    it("shows Mongolian option labels when locale is 'mn'", () => {
      render(
        <IntakeFormRenderer
          schema={singleSelectSchema}
          values={{}}
          onChange={vi.fn()}
          locale="mn"
        />,
      );

      expect(screen.getByText('Энгийн')).toBeInTheDocument();
      expect(screen.getByText('Гүнзгий цэвэрлэгээ')).toBeInTheDocument();
      expect(screen.getByText('Нүүлт')).toBeInTheDocument();
    });

    it('shows the field label based on locale', () => {
      const { rerender } = render(
        <IntakeFormRenderer
          schema={singleSelectSchema}
          values={{}}
          onChange={vi.fn()}
          locale="en"
        />,
      );

      expect(screen.getByText('Cleaning Type')).toBeInTheDocument();

      rerender(
        <IntakeFormRenderer
          schema={singleSelectSchema}
          values={{}}
          onChange={vi.fn()}
          locale="mn"
        />,
      );

      expect(screen.getByText('Цэвэрлэгээний төрөл')).toBeInTheDocument();
    });

    it('calls onChange with the field name and selected value when a radio is clicked', () => {
      const onChange = vi.fn();
      render(<IntakeFormRenderer schema={singleSelectSchema} values={{}} onChange={onChange} />);

      fireEvent.click(screen.getByLabelText('Deep Clean'));

      expect(onChange).toHaveBeenCalledWith('cleaning_type', 'deep');
    });

    it('checks the radio that corresponds to the current value', () => {
      render(
        <IntakeFormRenderer
          schema={singleSelectSchema}
          values={{ cleaning_type: 'deep' }}
          onChange={vi.fn()}
        />,
      );

      expect(screen.getByLabelText('Deep Clean')).toBeChecked();
      expect(screen.getByLabelText('Standard')).not.toBeChecked();
    });

    it('displays an error message when errors[fieldName] is set', () => {
      render(
        <IntakeFormRenderer
          schema={singleSelectSchema}
          values={{}}
          onChange={vi.fn()}
          errors={{ cleaning_type: 'Please select a cleaning type' }}
        />,
      );

      expect(screen.getByText('Please select a cleaning type')).toBeInTheDocument();
    });

    it('marks required fields with an indicator or aria-required', () => {
      render(<IntakeFormRenderer schema={singleSelectSchema} values={{}} onChange={vi.fn()} />);

      // The radiogroup or the individual radios should convey required status.
      // Accept either an aria-required attribute on the group, or an asterisk
      // in the label text.
      const group = screen.getByRole('radiogroup');
      const hasAriaRequired = group.getAttribute('aria-required') === 'true';
      const hasAsterisk =
        screen.getByText('Cleaning Type').textContent?.includes('*') ||
        screen.queryByText('*') !== null;

      expect(hasAriaRequired || hasAsterisk).toBe(true);
    });
  });

  // =========================================================================
  // multi_select (checkbox group)
  // =========================================================================
  describe('multi_select fields', () => {
    it('renders a checkbox for each option', () => {
      render(<IntakeFormRenderer schema={multiSelectSchema} values={{}} onChange={vi.fn()} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
    });

    it('shows option labels in English by default', () => {
      render(<IntakeFormRenderer schema={multiSelectSchema} values={{}} onChange={vi.fn()} />);

      expect(screen.getByText('Laundry')).toBeInTheDocument();
      expect(screen.getByText('Dishes')).toBeInTheDocument();
      expect(screen.getByText('Windows')).toBeInTheDocument();
    });

    it('calls onChange with an array containing the newly toggled-on value', () => {
      const onChange = vi.fn();
      render(<IntakeFormRenderer schema={multiSelectSchema} values={{}} onChange={onChange} />);

      fireEvent.click(screen.getByLabelText('Laundry'));

      expect(onChange).toHaveBeenCalledWith('extras', ['laundry']);
    });

    it('adds the value to an existing selection array when toggling on', () => {
      const onChange = vi.fn();
      render(
        <IntakeFormRenderer
          schema={multiSelectSchema}
          values={{ extras: ['laundry'] }}
          onChange={onChange}
        />,
      );

      fireEvent.click(screen.getByLabelText('Dishes'));

      expect(onChange).toHaveBeenCalledWith(
        'extras',
        expect.arrayContaining(['laundry', 'dishes']),
      );
    });

    it('removes the value from the selection array when toggling off', () => {
      const onChange = vi.fn();
      render(
        <IntakeFormRenderer
          schema={multiSelectSchema}
          values={{ extras: ['laundry', 'dishes'] }}
          onChange={onChange}
        />,
      );

      fireEvent.click(screen.getByLabelText('Laundry'));

      expect(onChange).toHaveBeenCalledWith('extras', ['dishes']);
    });

    it('checks the checkboxes corresponding to current values', () => {
      render(
        <IntakeFormRenderer
          schema={multiSelectSchema}
          values={{ extras: ['laundry', 'windows'] }}
          onChange={vi.fn()}
        />,
      );

      expect(screen.getByLabelText('Laundry')).toBeChecked();
      expect(screen.getByLabelText('Windows')).toBeChecked();
      expect(screen.getByLabelText('Dishes')).not.toBeChecked();
    });

    it('displays an error message when errors[fieldName] is set', () => {
      render(
        <IntakeFormRenderer
          schema={multiSelectSchema}
          values={{}}
          onChange={vi.fn()}
          errors={{ extras: 'Select at least one extra' }}
        />,
      );

      expect(screen.getByText('Select at least one extra')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // dropdown (select element)
  // =========================================================================
  describe('dropdown fields', () => {
    it('renders a select element (combobox)', () => {
      render(<IntakeFormRenderer schema={dropdownSchema} values={{}} onChange={vi.fn()} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('has a placeholder option', () => {
      render(<IntakeFormRenderer schema={dropdownSchema} values={{}} onChange={vi.fn()} />);

      const select = screen.getByRole('combobox');
      const options = within(select).getAllByRole('option');

      // First option should be a placeholder like "Select..."
      expect(options[0]).toHaveTextContent(/select/i);
      expect(options[0]).toBeDisabled();
    });

    it('renders an option for each schema option', () => {
      render(<IntakeFormRenderer schema={dropdownSchema} values={{}} onChange={vi.fn()} />);

      const select = screen.getByRole('combobox');
      const options = within(select).getAllByRole('option');

      // 3 real options + 1 placeholder = 4
      expect(options).toHaveLength(4);
      expect(options[1]).toHaveTextContent('Apartment');
      expect(options[2]).toHaveTextContent('House');
      expect(options[3]).toHaveTextContent('Office');
    });

    it("shows Mongolian option labels when locale is 'mn'", () => {
      render(
        <IntakeFormRenderer schema={dropdownSchema} values={{}} onChange={vi.fn()} locale="mn" />,
      );

      const select = screen.getByRole('combobox');
      const options = within(select).getAllByRole('option');

      expect(options[1]).toHaveTextContent('Орон сууц');
      expect(options[2]).toHaveTextContent('Байшин');
      expect(options[3]).toHaveTextContent('Оффис');
    });

    it('calls onChange with field name and selected value on change', () => {
      const onChange = vi.fn();
      render(<IntakeFormRenderer schema={dropdownSchema} values={{}} onChange={onChange} />);

      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'house' },
      });

      expect(onChange).toHaveBeenCalledWith('property_type', 'house');
    });

    it('reflects the current value in the select', () => {
      render(
        <IntakeFormRenderer
          schema={dropdownSchema}
          values={{ property_type: 'office' }}
          onChange={vi.fn()}
        />,
      );

      expect(screen.getByRole('combobox')).toHaveValue('office');
    });

    it('displays an error message when errors[fieldName] is set', () => {
      render(
        <IntakeFormRenderer
          schema={dropdownSchema}
          values={{}}
          onChange={vi.fn()}
          errors={{ property_type: 'Property type is required' }}
        />,
      );

      expect(screen.getByText('Property type is required')).toBeInTheDocument();
    });

    it('marks required dropdown fields', () => {
      render(<IntakeFormRenderer schema={dropdownSchema} values={{}} onChange={vi.fn()} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeRequired();
    });
  });

  // =========================================================================
  // yes_no (toggle / boolean)
  // =========================================================================
  describe('yes_no fields', () => {
    it('renders Yes and No options (as radio buttons, toggle, or switch)', () => {
      render(<IntakeFormRenderer schema={yesNoSchema} values={{}} onChange={vi.fn()} />);

      // Accept either a switch role, or two radio buttons, or explicit Yes/No text
      const yesOption = screen.getByLabelText(/yes/i);
      const noOption = screen.getByLabelText(/no/i);

      expect(yesOption).toBeInTheDocument();
      expect(noOption).toBeInTheDocument();
    });

    it('shows the field label', () => {
      render(<IntakeFormRenderer schema={yesNoSchema} values={{}} onChange={vi.fn()} />);

      expect(screen.getByText('Do you have pets?')).toBeInTheDocument();
    });

    it("shows Mongolian field label when locale is 'mn'", () => {
      render(
        <IntakeFormRenderer schema={yesNoSchema} values={{}} onChange={vi.fn()} locale="mn" />,
      );

      expect(screen.getByText('Тэжээвэр амьтантай юу?')).toBeInTheDocument();
    });

    it('calls onChange with boolean true when Yes is selected', () => {
      const onChange = vi.fn();
      render(<IntakeFormRenderer schema={yesNoSchema} values={{}} onChange={onChange} />);

      fireEvent.click(screen.getByLabelText(/yes/i));

      expect(onChange).toHaveBeenCalledWith('has_pets', true);
    });

    it('calls onChange with boolean false when No is selected', () => {
      const onChange = vi.fn();
      render(<IntakeFormRenderer schema={yesNoSchema} values={{}} onChange={onChange} />);

      fireEvent.click(screen.getByLabelText(/no/i));

      expect(onChange).toHaveBeenCalledWith('has_pets', false);
    });

    it('reflects the current boolean value of true', () => {
      render(
        <IntakeFormRenderer schema={yesNoSchema} values={{ has_pets: true }} onChange={vi.fn()} />,
      );

      expect(screen.getByLabelText(/yes/i)).toBeChecked();
    });

    it('reflects the current boolean value of false', () => {
      render(
        <IntakeFormRenderer schema={yesNoSchema} values={{ has_pets: false }} onChange={vi.fn()} />,
      );

      expect(screen.getByLabelText(/no/i)).toBeChecked();
    });
  });

  // =========================================================================
  // numeric_counter (number input with +/- controls)
  // =========================================================================
  describe('numeric_counter fields', () => {
    it('renders a spinbutton (number input) or equivalent counter display', () => {
      render(<IntakeFormRenderer schema={numericCounterSchema} values={{}} onChange={vi.fn()} />);

      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('shows the field label', () => {
      render(<IntakeFormRenderer schema={numericCounterSchema} values={{}} onChange={vi.fn()} />);

      expect(screen.getByText('Number of Rooms')).toBeInTheDocument();
    });

    it('displays the current value from the values prop', () => {
      render(
        <IntakeFormRenderer
          schema={numericCounterSchema}
          values={{ room_count: 5 }}
          onChange={vi.fn()}
        />,
      );

      expect(screen.getByRole('spinbutton')).toHaveValue(5);
    });

    it('displays the field minimum when the value is unset', () => {
      render(<IntakeFormRenderer schema={numericCounterSchema} values={{}} onChange={vi.fn()} />);

      expect(screen.getByRole('spinbutton')).toHaveValue(1);
    });

    it('calls onChange with field name and numeric value when input changes', () => {
      const onChange = vi.fn();
      render(
        <IntakeFormRenderer
          schema={numericCounterSchema}
          values={{ room_count: 3 }}
          onChange={onChange}
        />,
      );

      fireEvent.change(screen.getByRole('spinbutton'), {
        target: { value: '7' },
      });

      expect(onChange).toHaveBeenCalledWith('room_count', 7);
    });

    it('renders increment and decrement buttons', () => {
      render(
        <IntakeFormRenderer
          schema={numericCounterSchema}
          values={{ room_count: 3 }}
          onChange={vi.fn()}
        />,
      );

      // Expect buttons with accessible names like "+", "Increment", "−", "Decrement"
      const incrementBtn = screen.getByRole('button', { name: /increment|plus|\+/i });
      const decrementBtn = screen.getByRole('button', { name: /decrement|minus|−|-/i });

      expect(incrementBtn).toBeInTheDocument();
      expect(decrementBtn).toBeInTheDocument();
    });

    it('calls onChange with incremented value when increment button is clicked', () => {
      const onChange = vi.fn();
      render(
        <IntakeFormRenderer
          schema={numericCounterSchema}
          values={{ room_count: 3 }}
          onChange={onChange}
        />,
      );

      const incrementBtn = screen.getByRole('button', { name: /increment|plus|\+/i });
      fireEvent.click(incrementBtn);

      expect(onChange).toHaveBeenCalledWith('room_count', 4);
    });

    it('calls onChange with decremented value when decrement button is clicked', () => {
      const onChange = vi.fn();
      render(
        <IntakeFormRenderer
          schema={numericCounterSchema}
          values={{ room_count: 3 }}
          onChange={onChange}
        />,
      );

      const decrementBtn = screen.getByRole('button', { name: /decrement|minus|−|-/i });
      fireEvent.click(decrementBtn);

      expect(onChange).toHaveBeenCalledWith('room_count', 2);
    });

    it('does not decrement below the min value', () => {
      const onChange = vi.fn();
      render(
        <IntakeFormRenderer
          schema={numericCounterSchema}
          values={{ room_count: 1 }}
          onChange={onChange}
        />,
      );

      const decrementBtn = screen.getByRole('button', { name: /decrement|minus|−|-/i });
      fireEvent.click(decrementBtn);

      // Should either not call onChange at all, or call it with the min value
      if (onChange.mock.calls.length > 0) {
        expect(onChange).toHaveBeenCalledWith('room_count', 1);
      } else {
        expect(onChange).not.toHaveBeenCalled();
      }
    });

    it('does not increment above the max value', () => {
      const onChange = vi.fn();
      render(
        <IntakeFormRenderer
          schema={numericCounterSchema}
          values={{ room_count: 10 }}
          onChange={onChange}
        />,
      );

      const incrementBtn = screen.getByRole('button', { name: /increment|plus|\+/i });
      fireEvent.click(incrementBtn);

      // Should either not call onChange at all, or call it with the max value
      if (onChange.mock.calls.length > 0) {
        expect(onChange).toHaveBeenCalledWith('room_count', 10);
      } else {
        expect(onChange).not.toHaveBeenCalled();
      }
    });

    it('sets min and max attributes on the input', () => {
      render(
        <IntakeFormRenderer
          schema={numericCounterSchema}
          values={{ room_count: 3 }}
          onChange={vi.fn()}
        />,
      );

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '1');
      expect(input).toHaveAttribute('max', '10');
    });

    it('displays an error message when errors[fieldName] is set', () => {
      render(
        <IntakeFormRenderer
          schema={numericCounterSchema}
          values={{}}
          onChange={vi.fn()}
          errors={{ room_count: 'Room count is required' }}
        />,
      );

      expect(screen.getByText('Room count is required')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Full schema integration
  // =========================================================================
  describe('full schema integration', () => {
    it('renders all field types from a multi-field schema', () => {
      render(<IntakeFormRenderer schema={fullSchema} values={{}} onChange={vi.fn()} />);

      // single_select radios
      const radios = screen.getAllByRole('radio');
      expect(radios.length).toBeGreaterThanOrEqual(2);

      // multi_select checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(2);

      // dropdown
      expect(screen.getByRole('combobox')).toBeInTheDocument();

      // numeric counter
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('passes correct values to all fields simultaneously', () => {
      render(
        <IntakeFormRenderer
          schema={fullSchema}
          values={{
            cleaning_type: 'deep',
            extras: ['laundry'],
            property_type: 'apartment',
            has_pets: true,
            room_count: 4,
          }}
          onChange={vi.fn()}
        />,
      );

      // single_select: "deep" radio checked
      expect(screen.getByLabelText('Deep Clean')).toBeChecked();

      // multi_select: "laundry" checkbox checked
      expect(screen.getByLabelText('Laundry')).toBeChecked();
      expect(screen.getByLabelText('Dishes')).not.toBeChecked();

      // dropdown: "apartment" selected
      expect(screen.getByRole('combobox')).toHaveValue('apartment');

      // yes_no: true => Yes checked
      expect(screen.getByLabelText(/yes/i)).toBeChecked();

      // numeric_counter: 4
      expect(screen.getByRole('spinbutton')).toHaveValue(4);
    });

    it("renders Mongolian labels for all fields when locale is 'mn'", () => {
      render(<IntakeFormRenderer schema={fullSchema} values={{}} onChange={vi.fn()} locale="mn" />);

      expect(screen.getByText('Цэвэрлэгээний төрөл')).toBeInTheDocument();
      expect(screen.getByText('Нэмэлт үйлчилгээ')).toBeInTheDocument();
      expect(screen.getByText('Үл хөдлөх хөрөнгийн төрөл')).toBeInTheDocument();
      expect(screen.getByText('Тэжээвэр амьтантай юу?')).toBeInTheDocument();
      expect(screen.getByText('Өрөөний тоо')).toBeInTheDocument();
    });

    it('shows required indicators on required fields only', () => {
      render(<IntakeFormRenderer schema={fullSchema} values={{}} onChange={vi.fn()} />);

      // cleaning_type is required
      const cleaningLabel = screen.getByText('Cleaning Type');
      // property_type is required
      const propertyLabel = screen.getByText('Property Type');
      // room_count is required
      const roomLabel = screen.getByText('Number of Rooms');
      // extras is NOT required
      const extrasLabel = screen.getByText('Extra Services');
      // has_pets is NOT required
      const petsLabel = screen.getByText('Do you have pets?');

      // Required fields should have an asterisk or aria-required somewhere
      // in their group/container
      const requiredLabels = [cleaningLabel, propertyLabel, roomLabel];
      const optionalLabels = [extrasLabel, petsLabel];

      for (const label of requiredLabels) {
        const container = label.closest('[data-field]') ?? label.parentElement!;
        const hasAsterisk = container.textContent?.includes('*');
        const hasAriaRequired = container.querySelector("[aria-required='true']") !== null;
        expect(hasAsterisk || hasAriaRequired).toBe(true);
      }

      for (const label of optionalLabels) {
        const container = label.closest('[data-field]') ?? label.parentElement!;
        const hasAriaRequired = container.querySelector("[aria-required='true']") !== null;
        // Optional fields should NOT be marked as required
        // (They may still have asterisks in some designs, but aria-required should be absent)
        expect(hasAriaRequired).toBe(false);
      }
    });

    it('displays multiple error messages for different fields at the same time', () => {
      render(
        <IntakeFormRenderer
          schema={fullSchema}
          values={{}}
          onChange={vi.fn()}
          errors={{
            cleaning_type: 'Cleaning type is required',
            property_type: 'Property type is required',
            room_count: 'Must be at least 1',
          }}
        />,
      );

      expect(screen.getByText('Cleaning type is required')).toBeInTheDocument();
      expect(screen.getByText('Property type is required')).toBeInTheDocument();
      expect(screen.getByText('Must be at least 1')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Edge cases
  // =========================================================================
  describe('edge cases', () => {
    it('renders nothing (or an empty container) when the schema has no fields', () => {
      const emptySchema: IntakeSchema = { version: 1, fields: [] };

      const { container } = render(
        <IntakeFormRenderer schema={emptySchema} values={{}} onChange={vi.fn()} />,
      );

      // Should have no interactive form elements
      expect(screen.queryAllByRole('radio')).toHaveLength(0);
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();

      // Container should be empty or have a minimal wrapper
      const textContent = container.textContent?.trim() ?? '';
      expect(textContent).toBe('');
    });

    it('gracefully handles an unknown field type by skipping it', () => {
      const schemaWithUnknown: IntakeSchema = {
        version: 1,
        fields: [
          {
            name: 'mystery',
            label: 'Mystery Field',
            label_mn: 'Нууцлаг талбар',
            type: 'color_picker' as IntakeField['type'], // unknown type
            required: false,
          },
          {
            name: 'room_count',
            label: 'Number of Rooms',
            label_mn: 'Өрөөний тоо',
            type: 'numeric_counter',
            required: true,
            min: 1,
            max: 10,
          },
        ],
      };

      // Should not throw
      expect(() =>
        render(<IntakeFormRenderer schema={schemaWithUnknown} values={{}} onChange={vi.fn()} />),
      ).not.toThrow();

      // The known field should still render
      expect(screen.getByText('Number of Rooms')).toBeInTheDocument();
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it("defaults locale to 'en' when locale prop is omitted", () => {
      render(<IntakeFormRenderer schema={singleSelectSchema} values={{}} onChange={vi.fn()} />);

      // Should show English labels, not Mongolian
      expect(screen.getByText('Cleaning Type')).toBeInTheDocument();
      expect(screen.getByText('Standard')).toBeInTheDocument();
      expect(screen.queryByText('Цэвэрлэгээний төрөл')).not.toBeInTheDocument();
    });

    it('handles undefined values gracefully for all field types', () => {
      render(<IntakeFormRenderer schema={fullSchema} values={{}} onChange={vi.fn()} />);

      // No single_select radios should be checked when values are empty
      // (yes_no radios are also unchecked since has_pets is undefined)
      expect(screen.getByLabelText('Standard')).not.toBeChecked();
      expect(screen.getByLabelText('Deep Clean')).not.toBeChecked();

      // No checkboxes should be checked
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((cb) => {
        expect(cb).not.toBeChecked();
      });

      // Dropdown should show placeholder
      const select = screen.getByRole('combobox');
      const selectedOption = within(select)
        .getAllByRole('option')
        .find((opt) => (opt as HTMLOptionElement).selected);
      expect(selectedOption).toHaveTextContent(/select/i);
    });

    it('handles errors prop being undefined', () => {
      // Should not throw when errors prop is omitted
      expect(() =>
        render(<IntakeFormRenderer schema={fullSchema} values={{}} onChange={vi.fn()} />),
      ).not.toThrow();
    });
  });
});
