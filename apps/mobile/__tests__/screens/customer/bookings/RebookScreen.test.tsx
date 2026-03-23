import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import RebookScreen from '../../../../src/app/(customer)/rebook';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
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

const mockCreateTask = jest.fn();
jest.mock('../../../../src/features/tasks/hooks/useCreateTask', () => ({
  useCreateTask: () => ({
    mutateAsync: mockCreateTask,
    isPending: false,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RebookScreen (SCR-CUST-023)', () => {
  it('has a testID on the screen container', () => {
    render(<RebookScreen />);
    expect(screen.getByTestId('rebook-screen')).toBeTruthy();
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

  it('submit creates new task', async () => {
    mockCreateTask.mockResolvedValue({ id: 'new-task-1' });
    render(<RebookScreen />);
    fireEvent.press(screen.getByTestId('rebook-screen-next'));
    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          category_id: 'cat-1',
          description: 'Fix my sink',
          budget: 50000,
        }),
      );
    });
  });

  it('success navigates to confirm booking', async () => {
    mockCreateTask.mockResolvedValue({ id: 'new-task-1' });
    render(<RebookScreen />);
    fireEvent.press(screen.getByTestId('rebook-screen-next'));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/(customer)/bookings/confirm',
        }),
      );
    });
  });
});
