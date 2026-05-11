import { render, screen } from '@testing-library/react-native';
import React from 'react';

import BookingTimelineScreen from '../../../../src/app/(customer)/bookings/[bookingId]/timeline';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ bookingId: 'b-1' }),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
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

const mockUseBookingTimeline = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useBookingTimeline', () => ({
  useBookingTimeline: (id: string) => mockUseBookingTimeline(id),
}));

const mockUseBookingDetail = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useBookingDetail', () => ({
  useBookingDetail: (id: string) => mockUseBookingDetail(id),
}));

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
  mockUseBookingDetail.mockReturnValue({
    data: {
      id: 'b-1',
      task_id: 'task-1',
      task: { description: 'Гэр цэвэрлэгээ' },
      tasker: { full_name: 'Bold', avatar_url: null },
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
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
    expect(screen.getByTestId('SCR-CUST-019')).toBeTruthy();
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
    expect(screen.getByText('Захиалга үүсгэсэн')).toBeTruthy();
    expect(screen.getByText('Гүйцэтгэгч томилогдсон')).toBeTruthy();
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

  it('shows the helper CTA section', () => {
    mockUseBookingTimeline.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingTimelineScreen />);
    expect(screen.getByText('Тусламж хэрэгтэй юу?')).toBeTruthy();
    expect(screen.getByText('Оператортой холбогдох')).toBeTruthy();
  });

  it('renders loading state', () => {
    mockUseBookingTimeline.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingTimelineScreen />);
    expect(screen.getByTestId('SCR-CUST-019')).toBeTruthy();
  });
});
