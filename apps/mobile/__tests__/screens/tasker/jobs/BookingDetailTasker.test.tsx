import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useBookingDetail } from '../../../../src/features/bookings/hooks/useBookingDetail';
import type { Booking } from '../../../../src/lib/mobileApiClient';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ bookingId: 'booking-123' }),
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

jest.mock('../../../../src/features/bookings/hooks/useBookingDetail', () => ({
  useBookingDetail: jest.fn(),
}));

const mockMarkBookingDone = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useMarkBookingDone', () => ({
  useMarkBookingDone: () => ({
    mutate: mockMarkBookingDone,
    isPending: false,
  }),
}));

jest.mock('../../../../src/store/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: any) =>
      selector({
        session: {
          accessToken: 'test-token',
          refreshToken: 'ref',
          user: { id: 'u1', phone: '+976', role: 'TASKER', status: 'ACTIVE', created_at: '' },
        },
        profile: {
          id: 'u1',
          phone: '+976',
          role: 'TASKER',
          status: 'ACTIVE',
          full_name: 'Test Tasker',
          avatar_url: null,
          rating_avg: 4.5,
          completed_tasks: 10,
          is_pro: false,
          created_at: '',
        },
      }),
    { getState: () => ({ session: { accessToken: 'test-token' } }), setState: jest.fn() },
  ),
}));

const mockUseBookingDetail = useBookingDetail as jest.MockedFunction<typeof useBookingDetail>;

const assignedBooking: Booking = {
  id: 'booking-123',
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
    description: 'Deep clean a 3-bedroom apartment',
    budget: 75000,
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
  price: 75000,
  status: 'ASSIGNED',
  confirmed_scheduled_at: '2026-03-25T10:00:00Z',
  created_at: '2026-03-23T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BookingDetailTasker (SCR-TASK-013)', () => {
  it('renders loading skeleton when isLoading is true', () => {
    mockUseBookingDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useBookingDetail>);

    const BookingDetailScreen =
      require('../../../../src/app/(tasker)/jobs/[bookingId]/index').default;
    render(<BookingDetailScreen />);

    expect(screen.getByTestId('booking-detail-tasker')).toBeTruthy();
  });

  it('renders booking info for assigned status', () => {
    mockUseBookingDetail.mockReturnValue({
      data: assignedBooking,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useBookingDetail>);

    const BookingDetailScreen =
      require('../../../../src/app/(tasker)/jobs/[bookingId]/index').default;
    render(<BookingDetailScreen />);

    expect(screen.getByText('John Customer')).toBeTruthy();
    expect(screen.getByText('Deep clean a 3-bedroom apartment')).toBeTruthy();
  });

  it('shows "Mark Done" CTA for assigned booking', () => {
    mockUseBookingDetail.mockReturnValue({
      data: assignedBooking,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useBookingDetail>);

    const BookingDetailScreen =
      require('../../../../src/app/(tasker)/jobs/[bookingId]/index').default;
    render(<BookingDetailScreen />);

    expect(screen.getByText('Mark Done')).toBeTruthy();
  });

  it('Mark Done button calls markBookingDone', () => {
    mockUseBookingDetail.mockReturnValue({
      data: assignedBooking,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useBookingDetail>);

    const BookingDetailScreen =
      require('../../../../src/app/(tasker)/jobs/[bookingId]/index').default;
    render(<BookingDetailScreen />);

    fireEvent.press(screen.getByText('Mark Done'));
    expect(mockMarkBookingDone).toHaveBeenCalled();
  });

  it('shows customer info section', () => {
    mockUseBookingDetail.mockReturnValue({
      data: assignedBooking,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useBookingDetail>);

    const BookingDetailScreen =
      require('../../../../src/app/(tasker)/jobs/[bookingId]/index').default;
    render(<BookingDetailScreen />);

    expect(screen.getByText('Customer')).toBeTruthy();
    expect(screen.getByText('John Customer')).toBeTruthy();
  });

  it('shows cancel button for assigned booking', () => {
    mockUseBookingDetail.mockReturnValue({
      data: assignedBooking,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useBookingDetail>);

    const BookingDetailScreen =
      require('../../../../src/app/(tasker)/jobs/[bookingId]/index').default;
    render(<BookingDetailScreen />);

    expect(screen.getByText('Cancel Booking')).toBeTruthy();
  });

  it('shows completed state without Mark Done button', () => {
    const completedBooking = { ...assignedBooking, status: 'COMPLETED' as const };
    mockUseBookingDetail.mockReturnValue({
      data: completedBooking,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useBookingDetail>);

    const BookingDetailScreen =
      require('../../../../src/app/(tasker)/jobs/[bookingId]/index').default;
    render(<BookingDetailScreen />);

    expect(screen.queryByText('Mark Done')).toBeNull();
  });

  it('shows error state with retry', () => {
    mockUseBookingDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useBookingDetail>);

    const BookingDetailScreen =
      require('../../../../src/app/(tasker)/jobs/[bookingId]/index').default;
    render(<BookingDetailScreen />);

    expect(screen.getByTestId('booking-detail-tasker-error')).toBeTruthy();
  });

  it('back button calls router.back', () => {
    mockUseBookingDetail.mockReturnValue({
      data: assignedBooking,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useBookingDetail>);

    const BookingDetailScreen =
      require('../../../../src/app/(tasker)/jobs/[bookingId]/index').default;
    render(<BookingDetailScreen />);

    fireEvent.press(screen.getByTestId('booking-detail-tasker-back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
