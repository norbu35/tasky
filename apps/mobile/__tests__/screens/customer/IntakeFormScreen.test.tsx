import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';

import IntakeFormScreen from '../../../src/app/(customer)/tasks/new/intake';

const mockPush = jest.fn();
const mockBack = jest.fn();

// Default: Cleaning category with full intake schema
const mockCleaningSchema = JSON.stringify([
  {
    key: 'property_type',
    label: 'Property type',
    label_mn: 'Property type',
    type: 'single_select',
    required: true,
    options: [
      { value: 'apartment', label: 'Apartment', label_mn: 'Apartment' },
      { value: 'ger', label: 'Ger', label_mn: 'Ger' },
      { value: 'office', label: 'Office', label_mn: 'Office' },
      { value: 'house', label: 'House', label_mn: 'House' },
    ],
  },
  {
    key: 'size_or_rooms',
    label: 'Number of rooms',
    label_mn: 'Number of rooms',
    type: 'numeric_counter',
    required: true,
    min: 1,
    max: 10,
  },
  {
    key: 'cleaning_type',
    label: 'Cleaning type',
    label_mn: 'Cleaning type',
    type: 'single_select',
    required: true,
    options: [
      { value: 'standard', label: 'Standard', label_mn: 'Standard' },
      { value: 'deep-clean', label: 'Deep Clean', label_mn: 'Deep Clean' },
      {
        value: 'move-in-move-out',
        label: 'Move-in/Move-out',
        label_mn: 'Move-in/Move-out',
      },
      {
        value: 'post-renovation',
        label: 'Post-Renovation',
        label_mn: 'Post-Renovation',
      },
    ],
  },
  {
    key: 'supplies_provided',
    label: 'Supplies provided by customer',
    label_mn: 'Supplies provided by customer',
    type: 'yes_no',
    required: true,
  },
]);

let mockSchemaJson = mockCleaningSchema;

const mockDraftStoreState: any = {};

const mockUpdateDraft = jest.fn();
jest.mock('../../../src/features/tasks/draft', () => ({
  useTaskDraftStore: (selector: any) =>
    selector({ drafts: mockDraftStoreState, updateDraft: mockUpdateDraft }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ draftId: 'test-draft-id' }),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

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
  const { resetTestI18n, setTestLanguage } = require('../../test-utils/mockI18n');
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
  mockSchemaJson = mockCleaningSchema;
  mockDraftStoreState['test-draft-id'] = {
    draftId: 'test-draft-id',
    categoryId: 'cat-123',
    intakeEnabled: true,
    intakeSchemaVersion: 1,
    intakeSchemaJson: mockSchemaJson,
    currentStep: 0,
  };
});

describe('IntakeFormScreen (SCR-CUST-003)', () => {
  it('has a testID on the screen container', () => {
    render(<IntakeFormScreen />);
    expect(screen.getByTestId('SCR-CUST-003')).toBeTruthy();
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

  it('renders fallback labels when schema options are plain strings', () => {
    const plainSchema = JSON.stringify([
      {
        key: 'property_type',
        label: 'Property type',
        label_mn: 'Property type',
        type: 'single_select',
        required: true,
        options: ['apartment', 'ger', 'office', 'house'],
      },
      {
        key: 'cleaning_type',
        label: 'Cleaning type',
        label_mn: 'Cleaning type',
        type: 'single_select',
        required: true,
        options: ['standard', 'deep_clean', 'move_in_move_out', 'post_renovation'],
      },
    ]);
    mockDraftStoreState['test-draft-id'] = {
      ...mockDraftStoreState['test-draft-id'],
      intakeSchemaJson: plainSchema,
    };

    render(<IntakeFormScreen />);

    expect(screen.getByText('Apartment')).toBeTruthy();
    expect(screen.getByText('Deep Clean')).toBeTruthy();
  });

  it('renders yes_no as Yes/No chips', () => {
    render(<IntakeFormScreen />);
    expect(screen.getByTestId('intake-supplies_provided-yes')).toBeTruthy();
    expect(screen.getByTestId('intake-supplies_provided-no')).toBeTruthy();
  });

  it('keeps yes_no automation identifiers stable across locales', () => {
    const { setTestLanguage } = require('../../test-utils/mockI18n');
    setTestLanguage('mn');

    render(<IntakeFormScreen />);

    expect(screen.getByText('Тийм')).toBeTruthy();
    expect(screen.getByText('Үгүй')).toBeTruthy();
    expect(screen.getByTestId('intake-supplies_provided-yes')).toBeTruthy();
    expect(screen.getByTestId('intake-supplies_provided-no')).toBeTruthy();
  });

  it('shows validation error when next pressed with empty description', () => {
    render(<IntakeFormScreen />);
    fireEvent.press(screen.getByTestId('SCR-CUST-003-next'));
    expect(screen.getAllByText('This field is required').length).toBeGreaterThan(0);
  });

  it('shows description min-length error when description is too short', () => {
    render(<IntakeFormScreen />);
    fireEvent.changeText(screen.getByTestId('intake-description-input'), 'short');
    fireEvent.press(screen.getByTestId('SCR-CUST-003-next'));
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

    fireEvent.press(screen.getByTestId('SCR-CUST-003-next'));
    expect(mockUpdateDraft).toHaveBeenCalledWith(
      'test-draft-id',
      expect.objectContaining({
        description: 'Fix my leaky faucet',
        intakeAnswers: expect.objectContaining({
          property_type: 'apartment',
          cleaning_type: 'standard',
          supplies_provided: true,
        }),
        currentStep: 1,
      }),
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(customer)/tasks/new/photos',
      params: { draftId: 'test-draft-id' },
    });
  });

  it('renders as step 2 of 7 wizard', () => {
    render(<IntakeFormScreen />);
    expect(screen.getByLabelText('Step 2 of 7')).toBeTruthy();
  });

  it('shows a live character counter for the description field', () => {
    render(<IntakeFormScreen />);
    expect(screen.getByText('0 / 2000')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('intake-description-input'), 'Fix sink');
    expect(screen.getByText('8 / 2000')).toBeTruthy();
  });

  it('back button returns to category selection', () => {
    render(<IntakeFormScreen />);
    fireEvent.press(screen.getByTestId('SCR-CUST-003-back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('renders continue CTA copy from the wizard spec', () => {
    render(<IntakeFormScreen />);
    expect(screen.getByText('Continue')).toBeTruthy();
  });
});
