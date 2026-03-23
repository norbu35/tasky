import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import BookingsListScreen from '../../../../src/app/(customer)/bookings/index';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
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

const mockUseBookings = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useBookings', () => ({
  useBookings: () => mockUseBookings(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BookingsListScreen (SCR-CUST-016)', () => {
  it('has a testID on the screen container', () => {
    mockUseBookings.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingsListScreen />);
    expect(screen.getByTestId('bookings-list-screen')).toBeTruthy();
  });

  it('renders loading skeleton when loading', () => {
    mockUseBookings.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingsListScreen />);
    expect(screen.getByTestId('bookings-list-screen')).toBeTruthy();
  });

  it('renders empty state when no bookings', () => {
    mockUseBookings.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingsListScreen />);
    expect(screen.getByText('No bookings yet')).toBeTruthy();
    expect(screen.getByText('Post a task and select a Tasker to get started')).toBeTruthy();
  });

  it('renders booking cards with SplitCard when populated', () => {
    mockUseBookings.mockReturnValue({
      data: {
        data: [
          {
            id: 'b-1',
            status: 'ASSIGNED',
            task: {
              description: 'Fix my sink',
              budget: 50000,
              scheduled_at: '2026-04-01T10:00:00Z',
            },
            tasker: { full_name: 'Bold', avatar_url: null },
          },
          {
            id: 'b-2',
            status: 'ASSIGNED',
            task: {
              description: 'Clean apartment',
              budget: 30000,
              scheduled_at: '2026-04-02T14:00:00Z',
            },
            tasker: { full_name: 'Saran', avatar_url: null },
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingsListScreen />);
    expect(screen.getByText('Fix my sink')).toBeTruthy();
    expect(screen.getByText('Clean apartment')).toBeTruthy();
  });

  it('renders status filter tabs', () => {
    mockUseBookings.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingsListScreen />);
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('navigates to booking detail on card press', () => {
    mockUseBookings.mockReturnValue({
      data: {
        data: [
          {
            id: 'b-1',
            status: 'ASSIGNED',
            task: {
              description: 'Fix my sink',
              budget: 50000,
              scheduled_at: '2026-04-01T10:00:00Z',
            },
            tasker: { full_name: 'Bold', avatar_url: null },
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingsListScreen />);
    fireEvent.press(screen.getByTestId('booking-card-b-1'));
    expect(mockPush).toHaveBeenCalledWith('/(customer)/bookings/b-1');
  });
});
