import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import RebookScreen from '../../../../src/app/(customer)/rebook';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({
    taskerId: 'tasker-1',
    taskerName: 'Bold',
    taskerAvatar: 'https://example.com/avatar.jpg',
    categoryId: 'cat-1',
    categoryName: 'Handyman',
    description: 'Fix my sink',
    budget: '50000',
    locationLat: '47.9',
    locationLng: '106.9',
    locationText: 'Ulaanbaatar',
    scheduledAt: '2026-04-01T10:00:00Z',
  }),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
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

const mockCreateTask = jest.fn();
const mockCreateBookingIntent = jest.fn();
jest.mock('../../../../src/features/tasks/hooks/useCreateTask', () => ({
  useCreateTask: () => ({
    mutateAsync: mockCreateTask,
    isPending: false,
  }),
}));
jest.mock('../../../../src/features/bookings/hooks/useCreateBookingIntent', () => ({
  useCreateBookingIntent: () => ({
    mutateAsync: mockCreateBookingIntent,
    isPending: false,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
});

describe('RebookScreen (SCR-CUST-023)', () => {
  it('has a testID on the screen container', () => {
    render(<RebookScreen />);
    expect(screen.getByTestId('SCR-CUST-023')).toBeTruthy();
  });

  it('shows prefilled form with previous booking data', () => {
    render(<RebookScreen />);
    expect(screen.getByText('Bold')).toBeTruthy();
    expect(screen.getByText('Handyman')).toBeTruthy();
    expect(screen.getByText('Fix my sink')).toBeTruthy();
  });

  it('shows prefilled note', () => {
    render(<RebookScreen />);
    expect(screen.getByText('Prefilled from previous booking. You can edit.')).toBeTruthy();
  });

  it('shows the previous booking schedule in Mongolian date format', () => {
    render(<RebookScreen />);
    expect(screen.getByText(/2026/)).toBeTruthy();
  });

  it('renders a back button and returns to booking detail', () => {
    render(<RebookScreen />);
    fireEvent.press(screen.getByTestId('SCR-CUST-023-back'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('disables continue when budget is at or below the minimum threshold', () => {
    render(<RebookScreen />);
    fireEvent.changeText(screen.getByTestId('rebook-screen-budget'), '1001');
    fireEvent.press(screen.getByTestId('SCR-CUST-023-next'));

    expect(mockCreateTask).not.toHaveBeenCalled();
    expect(screen.getByText('Budget must be above ₮1,001')).toBeTruthy();
  });

  it('submit creates new task', async () => {
    mockCreateTask.mockResolvedValue({ id: 'new-task-1' });
    mockCreateBookingIntent.mockResolvedValue({ id: 'intent-1' });
    render(<RebookScreen />);
    fireEvent.press(screen.getByTestId('SCR-CUST-023-next'));
    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          category_id: 'cat-1',
          description: 'Fix my sink',
          budget: 50000,
          intake_answers: { description: 'Fix my sink' },
        }),
      );
    });
  });

  it('success navigates to confirm booking', async () => {
    mockCreateTask.mockResolvedValue({ id: 'new-task-1' });
    mockCreateBookingIntent.mockResolvedValue({ id: 'intent-1' });
    render(<RebookScreen />);
    fireEvent.press(screen.getByTestId('SCR-CUST-023-next'));
    await waitFor(() => {
      expect(mockCreateBookingIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'new-task-1',
          source: 'REBOOK',
          originalBookingId: undefined,
          taskerId: 'tasker-1',
        }),
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/(customer)/bookings/confirm',
          params: expect.objectContaining({
            source: 'rebook',
            bookingIntentId: 'intent-1',
          }),
        }),
      );
    });
  });
});
