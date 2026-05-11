import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import ReviewSubmitScreen from '../../../src/app/(customer)/tasks/new/review';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

const baseDraft = {
  draftId: 'test-draft-id',
  categoryId: 'cat-123',
  categoryName: 'Cleaning',
  description: 'Fix my sink',
  photos: [] as string[],
  location: { lat: 47.92123, lng: 106.91876, text: 'Behind State Dept Store' },
  scheduledAt: new Date(2026, 3, 1, 10, 0).toISOString(),
  budget: 50000,
  pricingMode: 'BUDGET',
  intakeAnswers: {} as Record<string, unknown>,
  intakeSchemaVersion: 1,
  intakeSchemaJson: undefined as string | undefined,
  intakeEnabled: undefined as boolean | undefined,
  currentStep: 4,
};

const mockDraftStoreState: any = {};

const mockUpdateDraft = jest.fn();
jest.mock('../../../src/features/tasks/draft', () => ({
  useTaskDraftStore: (selector: any) =>
    selector({ drafts: mockDraftStoreState, updateDraft: mockUpdateDraft }),
  isDraftComplete: (draft: any) =>
    draft &&
    draft.categoryId &&
    draft.description &&
    draft.location &&
    draft.scheduledAt &&
    (draft.pricingMode === 'QUOTE' || draft.budget),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
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

const mockMutateAsync = jest.fn();
const mockUseCreateTask = jest.fn();
jest.mock('../../../src/features/tasks/hooks/useCreateTask', () => ({
  useCreateTask: () => mockUseCreateTask(),
}));

beforeEach(() => {
  const { resetTestI18n, setTestLanguage } = require('../../test-utils/mockI18n');
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
  mockDraftStoreState['test-draft-id'] = { ...baseDraft };
  mockUseCreateTask.mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
  });
  process.env['EXPO_PUBLIC_DEV_AUTH_ENABLED'] = 'true';
});

describe('ReviewSubmitScreen (SCR-CUST-007)', () => {
  it('has a testID on the screen container', () => {
    render(<ReviewSubmitScreen />);
    expect(screen.getByTestId('SCR-CUST-007')).toBeTruthy();
  });

  it('shows task summary with description', () => {
    render(<ReviewSubmitScreen />);
    expect(screen.getByText('Job Scope Summary')).toBeTruthy();
    expect(screen.getAllByText('Fix my sink').length).toBeGreaterThan(0);
  });

  it('shows task summary with location', () => {
    render(<ReviewSubmitScreen />);
    expect(screen.getByText('Behind State Dept Store')).toBeTruthy();
  });

  it('shows task summary with budget', () => {
    render(<ReviewSubmitScreen />);
    expect(screen.getByText('₮50,000')).toBeTruthy();
  });

  it('shows task summary with quote pricing mode', () => {
    mockDraftStoreState['test-draft-id'] = {
      ...baseDraft,
      pricingMode: 'QUOTE',
      budget: null,
    };

    render(<ReviewSubmitScreen />);

    expect(screen.getByText('I want quotes')).toBeTruthy();
    expect(screen.getByText('Taskers will include a price quote when they apply.')).toBeTruthy();
  });

  it('renders structured intake answers with schema-backed labels in the review summary', () => {
    mockDraftStoreState['test-draft-id'] = {
      ...baseDraft,
      intakeAnswers: {
        property_type: 'apartment',
        cleaning_type: 'deep_clean',
      },
      intakeSchemaJson: JSON.stringify([
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
      ]),
      intakeSchemaVersion: 7,
    };

    render(<ReviewSubmitScreen />);

    expect(screen.getByText('Property type')).toBeTruthy();
    expect(screen.getByText('Apartment')).toBeTruthy();
    expect(screen.getByText('Cleaning type')).toBeTruthy();
    expect(screen.getByText('Deep Clean')).toBeTruthy();
  });

  it('falls back to prettified intake answers when schema is missing', () => {
    mockDraftStoreState['test-draft-id'] = {
      ...baseDraft,
      intakeAnswers: {
        property_type: 'apartment',
        has_pets: true,
      },
    };

    render(<ReviewSubmitScreen />);

    expect(screen.getByText('Property Type')).toBeTruthy();
    expect(screen.getByText('Apartment')).toBeTruthy();
    expect(screen.getByText('Has Pets')).toBeTruthy();
    expect(screen.getByText('Yes')).toBeTruthy();
  });

  it('renders edit buttons for sections', () => {
    render(<ReviewSubmitScreen />);
    const editButtons = screen.getAllByText('Edit');
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('renders the submit button', () => {
    render(<ReviewSubmitScreen />);
    expect(screen.getByText('Post Task')).toBeTruthy();
  });

  it('submit calls useCreateTask', async () => {
    mockMutateAsync.mockResolvedValue({ id: 'task-new-1' });
    render(<ReviewSubmitScreen />);
    fireEvent.press(screen.getByText('Post Task'));
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        budget: 50000,
        category_id: 'cat-123',
        description: 'Fix my sink',
        intake_answers: {},
        intake_schema_version: 1,
        location_lat: 47.92123,
        location_lng: 106.91876,
        location_text: 'Behind State Dept Store',
        photo_keys: [],
        pricing_mode: 'BUDGET',
        scheduled_at: new Date(2026, 3, 1, 10, 0).toISOString(),
      });
    });
  });

  it('shows loading state during submission', () => {
    mockUseCreateTask.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    });
    render(<ReviewSubmitScreen />);
    expect(screen.getByTestId('SCR-CUST-007')).toBeTruthy();
  });

  it('navigates to success on successful submit', async () => {
    mockMutateAsync.mockResolvedValue({ id: 'task-new-1' });
    render(<ReviewSubmitScreen />);
    fireEvent.press(screen.getByText('Post Task'));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/(customer)/tasks/new/success',
        params: { taskId: 'task-new-1', draftId: 'test-draft-id' },
      });
    });
  });

  it('handles nested task id response shape', async () => {
    mockMutateAsync.mockResolvedValue({ task: { id: 'task-nested-2' } });
    render(<ReviewSubmitScreen />);

    fireEvent.press(screen.getByText('Post Task'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/(customer)/tasks/new/success',
        params: { taskId: 'task-nested-2', draftId: 'test-draft-id' },
      });
    });
  });

  it('shows submit error when create task fails', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Request failed with status 500'));
    render(<ReviewSubmitScreen />);

    fireEvent.press(screen.getByText('Post Task'));

    await waitFor(() => {
      expect(screen.getByTestId('review-submit-error')).toBeTruthy();
      expect(screen.getByText('Request failed with status 500')).toBeTruthy();
    });
  });

  it('TID-TASK-113-MOBILE-REVIEW-SUBMIT-PAYLOAD submits intake answers, schema version, and photo keys', async () => {
    mockMutateAsync.mockResolvedValue({ id: 'task-new-1' });
    mockDraftStoreState['test-draft-id'] = {
      ...baseDraft,
      photos: ['photo-key-1', 'photo-key-2'],
      intakeAnswers: { rooms: 2, supplies_provided: true },
      intakeSchemaVersion: 7,
    };

    render(<ReviewSubmitScreen />);
    fireEvent.press(screen.getByText('Post Task'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        budget: 50000,
        category_id: 'cat-123',
        description: 'Fix my sink',
        intake_answers: { rooms: 2, supplies_provided: true },
        intake_schema_version: 7,
        location_lat: 47.92123,
        location_lng: 106.91876,
        location_text: 'Behind State Dept Store',
        photo_keys: ['photo-key-1', 'photo-key-2'],
        pricing_mode: 'BUDGET',
        scheduled_at: new Date(2026, 3, 1, 10, 0).toISOString(),
      });
    });
  });

  it('SCN-TASK-027: submits quote-mode tasks without a budget', async () => {
    mockMutateAsync.mockResolvedValue({ id: 'task-new-1' });
    mockDraftStoreState['test-draft-id'] = {
      ...baseDraft,
      pricingMode: 'QUOTE',
      budget: null,
    };

    render(<ReviewSubmitScreen />);
    fireEvent.press(screen.getByText('Post Task'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        budget: null,
        category_id: 'cat-123',
        description: 'Fix my sink',
        intake_answers: {},
        intake_schema_version: 1,
        location_lat: 47.92123,
        location_lng: 106.91876,
        location_text: 'Behind State Dept Store',
        photo_keys: [],
        pricing_mode: 'QUOTE',
        scheduled_at: new Date(2026, 3, 1, 10, 0).toISOString(),
      });
    });
  });
});
