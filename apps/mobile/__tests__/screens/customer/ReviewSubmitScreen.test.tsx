import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import ReviewSubmitScreen from '../../../src/app/(customer)/tasks/new/review';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockParams = {
  categoryId: 'cat-123',
  description: 'Fix my sink',
  photos: '[]',
  location: 'Behind State Dept Store',
  lat: '47.92123',
  lng: '106.91876',
  scheduledAt: new Date(2026, 3, 1, 10, 0).toISOString(),
  budget: '50000',
};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => mockParams,
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

const mockMutateAsync = jest.fn();
const mockUseCreateTask = jest.fn();
jest.mock('../../../src/features/tasks/hooks/useCreateTask', () => ({
  useCreateTask: () => mockUseCreateTask(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(mockParams, {
    categoryId: 'cat-123',
    description: 'Fix my sink',
    photos: '[]',
    location: 'Behind State Dept Store',
    lat: '47.92123',
    lng: '106.91876',
    scheduledAt: new Date(2026, 3, 1, 10, 0).toISOString(),
    budget: '50000',
  });
  mockUseCreateTask.mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
  });
});

describe('ReviewSubmitScreen (SCR-CUST-007)', () => {
  it('has a testID on the screen container', () => {
    render(<ReviewSubmitScreen />);
    expect(screen.getByTestId('review-submit-screen')).toBeTruthy();
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
    expect(screen.getByTestId('review-submit-screen')).toBeTruthy();
  });

  it('navigates to success on successful submit', async () => {
    mockMutateAsync.mockResolvedValue({ id: 'task-new-1' });
    render(<ReviewSubmitScreen />);
    fireEvent.press(screen.getByText('Post Task'));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/(customer)/tasks/new/success',
        params: { taskId: 'task-new-1' },
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
        params: { taskId: 'task-nested-2' },
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
    Object.assign(mockParams, {
      photos: JSON.stringify(['photo-key-1', 'photo-key-2']),
      intakeAnswers: JSON.stringify({ rooms: 2, supplies_provided: true }),
      intakeSchemaVersion: '7',
    });

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
        scheduled_at: new Date(2026, 3, 1, 10, 0).toISOString(),
      });
    });
  });
});
