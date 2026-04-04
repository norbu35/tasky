import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import IntakeFormScreen from '../../../src/app/(customer)/tasks/new/intake';

const mockPush = jest.fn();
const mockBack = jest.fn();

// Default: Cleaning category with full intake schema
const mockCleaningSchema = JSON.stringify([
  {
    key: 'property_type',
    label: 'Property type',
    type: 'single_select',
    required: true,
    options: ['Apartment', 'Ger', 'Office', 'House'],
  },
  {
    key: 'size_or_rooms',
    label: 'Number of rooms',
    type: 'numeric_counter',
    required: true,
    min: 1,
    max: 10,
  },
  {
    key: 'cleaning_type',
    label: 'Cleaning type',
    type: 'single_select',
    required: true,
    options: ['Standard', 'Deep Clean', 'Move-in/Move-out', 'Post-Renovation'],
  },
  {
    key: 'supplies_provided',
    label: 'Supplies provided by customer',
    type: 'yes_no',
    required: true,
  },
]);

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({
    categoryId: 'cat-123',
    intakeEnabled: '1',
    intakeSchemaVersion: '1',
    intakeSchemaJson: mockCleaningSchema,
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fb?: string) => fb || key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('IntakeFormScreen (SCR-CUST-003)', () => {
  it('has a testID on the screen container', () => {
    render(<IntakeFormScreen />);
    expect(screen.getByTestId('intake-form-screen')).toBeTruthy();
  });

  it('renders the description field label and step header', () => {
    render(<IntakeFormScreen />);
    expect(screen.getByText('Task Details')).toBeTruthy();
    expect(screen.getByText('Fill in the task details')).toBeTruthy();
    expect(screen.getByText('Description')).toBeTruthy();
  });

  it('renders the description text input', () => {
    render(<IntakeFormScreen />);
    expect(screen.getByTestId('intake-description-input')).toBeTruthy();
  });

  it('renders schema field labels for Cleaning category', () => {
    render(<IntakeFormScreen />);
    expect(screen.getByText('Property type')).toBeTruthy();
    expect(screen.getByText('Number of rooms')).toBeTruthy();
    expect(screen.getByText('Cleaning type')).toBeTruthy();
    expect(screen.getByText('Supplies provided by customer')).toBeTruthy();
  });

  it('renders single_select options as chips', () => {
    render(<IntakeFormScreen />);
    expect(screen.getByText('Apartment')).toBeTruthy();
    expect(screen.getByText('Standard')).toBeTruthy();
  });

  it('renders yes_no as Yes/No chips', () => {
    render(<IntakeFormScreen />);
    expect(screen.getByTestId('intake-supplies_provided-yes')).toBeTruthy();
    expect(screen.getByTestId('intake-supplies_provided-no')).toBeTruthy();
  });

  it('shows validation error when next pressed with empty description', () => {
    render(<IntakeFormScreen />);
    fireEvent.press(screen.getByTestId('intake-form-screen-next'));
    expect(screen.getAllByText('This field is required').length).toBeGreaterThan(0);
  });

  it('shows description min-length error when description is too short', () => {
    render(<IntakeFormScreen />);
    fireEvent.changeText(screen.getByTestId('intake-description-input'), 'short');
    fireEvent.press(screen.getByTestId('intake-form-screen-next'));
    expect(screen.getByText('Description must be at least 10 characters')).toBeTruthy();
  });

  it('navigates to photos when description and schema fields are valid', () => {
    render(<IntakeFormScreen />);
    fireEvent.changeText(screen.getByTestId('intake-description-input'), 'Fix my leaky faucet');
    // Fill schema fields
    fireEvent.press(screen.getByTestId('intake-property_type-apartment'));
    fireEvent.changeText(screen.getByTestId('intake-size_or_rooms-input'), '2');
    fireEvent.press(screen.getByTestId('intake-cleaning_type-standard'));
    fireEvent.press(screen.getByTestId('intake-supplies_provided-yes'));

    fireEvent.press(screen.getByTestId('intake-form-screen-next'));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(customer)/tasks/new/photos',
        params: expect.objectContaining({
          categoryId: 'cat-123',
          description: 'Fix my leaky faucet',
          intakeSchemaVersion: '1',
        }),
      }),
    );
  });

  it('renders as step 2 of 7 wizard', () => {
    render(<IntakeFormScreen />);
    expect(screen.getByText('Step 2 of 7')).toBeTruthy();
  });

  it('shows a live character counter for the description field', () => {
    render(<IntakeFormScreen />);
    expect(screen.getByText('0 / 2000')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('intake-description-input'), 'Fix sink');
    expect(screen.getByText('8 / 2000')).toBeTruthy();
  });

  it('back button returns to category selection', () => {
    render(<IntakeFormScreen />);
    fireEvent.press(screen.getByTestId('intake-form-screen-back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('renders continue CTA copy from the wizard spec', () => {
    render(<IntakeFormScreen />);
    expect(screen.getByText('Continue')).toBeTruthy();
  });
});
