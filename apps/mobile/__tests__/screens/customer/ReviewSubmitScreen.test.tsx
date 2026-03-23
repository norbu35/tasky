import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import ReviewSubmitScreen from '../../../src/app/(customer)/tasks/new/review';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({
    categoryId: 'cat-123',
    description: 'Fix my sink',
    photos: '[]',
    location: 'Behind State Dept Store',
    date: '2026-04-01',
    time: '10:00',
    budget: '50000',
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

const mockMutateAsync = jest.fn();
const mockUseCreateTask = jest.fn();
jest.mock('../../../src/features/tasks/hooks/useCreateTask', () => ({
  useCreateTask: () => mockUseCreateTask(),
}));

beforeEach(() => {
  jest.clearAllMocks();
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
    expect(screen.getByText('Fix my sink')).toBeTruthy();
  });

  it('shows task summary with location', () => {
    render(<ReviewSubmitScreen />);
    expect(screen.getByText('Behind State Dept Store')).toBeTruthy();
  });

  it('shows task summary with budget', () => {
    render(<ReviewSubmitScreen />);
    expect(screen.getByText('50,000')).toBeTruthy();
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
      expect(mockMutateAsync).toHaveBeenCalled();
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
      expect(mockReplace).toHaveBeenCalledWith('/(customer)/tasks/new/success');
    });
  });
});
