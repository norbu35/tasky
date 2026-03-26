import React from 'react';
import { render, screen } from '@testing-library/react-native';

import BookingTimelineScreen from '../../../../src/app/(customer)/bookings/[bookingId]/timeline';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ bookingId: 'b-1' }),
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

const mockUseBookingTimeline = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useBookingTimeline', () => ({
  useBookingTimeline: (id: string) => mockUseBookingTimeline(id),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BookingTimelineScreen (SCR-CUST-019)', () => {
  it('has a testID on the screen container', () => {
    mockUseBookingTimeline.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingTimelineScreen />);
    expect(screen.getByTestId('booking-timeline-screen')).toBeTruthy();
  });

  it('renders timeline events', () => {
    mockUseBookingTimeline.mockReturnValue({
      data: [
        {
          event: 'booking_created',
          timestamp: '2026-03-22T09:00:00Z',
          actor: 'customer',
          description: 'Customer posted the booking request',
        },
        { event: 'tasker_assigned', timestamp: '2026-03-22T10:00:00Z', actor: 'system' },
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingTimelineScreen />);
    expect(screen.getByText('Booking created')).toBeTruthy();
    expect(screen.getByText('Tasker assigned')).toBeTruthy();
    expect(screen.getByText('Customer posted the booking request')).toBeTruthy();
  });

  it('shows active styling on current (last) event', () => {
    mockUseBookingTimeline.mockReturnValue({
      data: [
        { event: 'booking_created', timestamp: '2026-03-22T09:00:00Z', actor: 'customer' },
        { event: 'tasker_assigned', timestamp: '2026-03-22T10:00:00Z', actor: 'system' },
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingTimelineScreen />);
    expect(screen.getByTestId('timeline-event-1-active')).toBeTruthy();
  });

  it('shows past styling on previous events', () => {
    mockUseBookingTimeline.mockReturnValue({
      data: [
        { event: 'booking_created', timestamp: '2026-03-22T09:00:00Z', actor: 'customer' },
        { event: 'tasker_assigned', timestamp: '2026-03-22T10:00:00Z', actor: 'system' },
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingTimelineScreen />);
    expect(screen.getByTestId('timeline-event-0-past')).toBeTruthy();
  });

  it('shows future styling on upcoming events', () => {
    mockUseBookingTimeline.mockReturnValue({
      data: [
        { event: 'booking_created', timestamp: '2026-03-22T09:00:00Z', actor: 'customer' },
        {
          event: 'reschedule_accepted',
          timestamp: '2026-03-23T10:00:00Z',
          actor: 'system',
          is_future: true,
        },
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingTimelineScreen />);
    expect(screen.getByTestId('timeline-event-1-future')).toBeTruthy();
  });

  it('renders loading state', () => {
    mockUseBookingTimeline.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingTimelineScreen />);
    expect(screen.getByTestId('booking-timeline-screen')).toBeTruthy();
  });
});
