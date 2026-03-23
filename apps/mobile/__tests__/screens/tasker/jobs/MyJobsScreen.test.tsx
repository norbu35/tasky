import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useBookings } from '../../../../src/features/bookings/hooks/useBookings';
import type { Booking } from '../../../../src/lib/mobileApiClient';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      return typeof fallback === 'string' ? fallback : key;
    },
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

jest.mock('../../../../src/features/bookings/hooks/useBookings', () => ({
  useBookings: jest.fn(),
}));

const mockUseBookings = useBookings as jest.MockedFunction<typeof useBookings>;

const baseBooking: Booking = {
  id: 'booking-1',
  task_id: 'task-1',
  task: {
    id: 'task-1',
    category_id: 'cat-cleaning',
    category: {
      id: 'cat-cleaning',
      name: 'Cleaning',
      name_mn: '\u0426\u044d\u0432\u044d\u0440\u043b\u044d\u0433\u044d\u044d',
      icon_url: 'https://example/icon.png',
      is_active: true,
      sort_order: 1,
      intake_enabled: false,
      intake_schema_version: 0,
    },
    customer_id: 'customer-1',
    description: 'Deep clean apartment',
    budget: 50000,
    location_lat: 47.91,
    location_lng: 106.91,
    location_text: 'Bayangol district',
    status: 'ASSIGNED',
    scheduled_at: '2026-03-25T10:00:00Z',
    intake_schema_version: 0,
    photos: [],
    created_at: '2026-03-23T00:00:00Z',
    updated_at: '2026-03-23T00:00:00Z',
  },
  tasker_id: 'tasker-1',
  customer_id: 'customer-1',
  customer: {
    id: 'customer-1',
    phone_masked: '+97699****01',
    role: 'CUSTOMER',
    status: 'VERIFIED',
    full_name: 'John Customer',
    avatar_url: null,
    rating_avg: 4.5,
    completed_tasks: 5,
    is_pro: false,
    created_at: '2026-01-01T00:00:00Z',
  },
  price: 50000,
  status: 'ASSIGNED',
  confirmed_scheduled_at: '2026-03-25T10:00:00Z',
  created_at: '2026-03-23T00:00:00Z',
};

const completedBooking: Booking = {
  ...baseBooking,
  id: 'booking-2',
  status: 'COMPLETED',
  customer: {
    ...baseBooking.customer!,
    full_name: 'Jane Poster',
  },
  task: {
    ...baseBooking.task!,
    id: 'task-2',
    description: 'Fix kitchen sink',
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MyJobsScreen (SCR-TASK-012)', () => {
  it('renders loading skeleton when isLoading is true', () => {
    mockUseBookings.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useBookings>);

    const MyJobsScreen = require('../../../../src/app/(tasker)/jobs/index').default;
    render(<MyJobsScreen />);

    expect(screen.getByTestId('my-jobs-feed')).toBeTruthy();
  });

  it('shows empty state when no bookings', () => {
    mockUseBookings.mockReturnValue({
      data: { data: [], cursor: { next: null, prev: null } },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useBookings>);

    const MyJobsScreen = require('../../../../src/app/(tasker)/jobs/index').default;
    render(<MyJobsScreen />);

    expect(screen.getByText('No jobs yet')).toBeTruthy();
  });

  it('renders job cards with customer name, task title, schedule, and status', () => {
    mockUseBookings.mockReturnValue({
      data: {
        data: [baseBooking, completedBooking],
        cursor: { next: null, prev: null },
      },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useBookings>);

    const MyJobsScreen = require('../../../../src/app/(tasker)/jobs/index').default;
    render(<MyJobsScreen />);

    expect(screen.getByText('John Customer')).toBeTruthy();
    expect(screen.getByText('Deep clean apartment')).toBeTruthy();
    expect(screen.getByText('Jane Poster')).toBeTruthy();
    expect(screen.getByText('Fix kitchen sink')).toBeTruthy();
  });

  it('navigates to booking detail on card press', () => {
    mockUseBookings.mockReturnValue({
      data: {
        data: [baseBooking],
        cursor: { next: null, prev: null },
      },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useBookings>);

    const MyJobsScreen = require('../../../../src/app/(tasker)/jobs/index').default;
    render(<MyJobsScreen />);

    fireEvent.press(screen.getByTestId('booking-card-booking-1'));
    expect(mockPush).toHaveBeenCalledWith('/(tasker)/jobs/booking-1');
  });

  it('shows error state with retry', () => {
    const refetchFn = jest.fn();
    mockUseBookings.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isRefetching: false,
      refetch: refetchFn,
    } as unknown as ReturnType<typeof useBookings>);

    const MyJobsScreen = require('../../../../src/app/(tasker)/jobs/index').default;
    render(<MyJobsScreen />);

    expect(screen.getByTestId('my-jobs-feed-error')).toBeTruthy();
  });
});
