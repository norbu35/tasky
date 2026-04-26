import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

import BookingDetailScreen from '../../../../src/app/(customer)/bookings/[bookingId]/index';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({ bookingId: 'b-1' }),
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

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockBottomSheet = React.forwardRef(function MockBottomSheet(
    { children, ...props }: any,
    ref: any,
  ) {
    React.useImperativeHandle(ref, () => ({
      snapToIndex: jest.fn(),
      close: jest.fn(),
    }));
    return <View {...props}>{children}</View>;
  });
  MockBottomSheet.displayName = 'MockBottomSheet';
  return {
    __esModule: true,
    default: MockBottomSheet,
    BottomSheetView: View,
    BottomSheetBackdrop: View,
  };
});

const mockUseBookingDetail = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useBookingDetail', () => ({
  useBookingDetail: (id: string) => mockUseBookingDetail(id),
}));

jest.mock('../../../../src/features/bookings/hooks/useCompleteBooking', () => ({
  useCompleteBooking: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('../../../../src/features/bookings/hooks/useCancelBooking', () => ({
  useCancelBooking: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('../../../../src/features/bookings/hooks/useFlagNoShow', () => ({
  useFlagNoShow: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
});

const makeBooking = (overrides = {}) => ({
  id: 'b-1',
  status: 'ASSIGNED',
  task: {
    id: 'task-1',
    description: 'Fix my sink',
    budget: 50000,
    scheduled_at: '2026-04-01T10:00:00Z',
    location_text: 'Ulaanbaatar',
    category: { name: 'Handyman' },
  },
  tasker: {
    id: 'tasker-1',
    full_name: 'Bold',
    avatar_url: 'https://example.com/avatar.jpg',
  },
  ...overrides,
});

describe('BookingDetailScreen (SCR-CUST-017)', () => {
  it('has a testID on the screen container', () => {
    mockUseBookingDetail.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);
    expect(screen.getByTestId('SCR-CUST-017')).toBeTruthy();
  });

  it('renders loading state', () => {
    mockUseBookingDetail.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);
    expect(screen.getByTestId('SCR-CUST-017')).toBeTruthy();
  });

  it('renders booking info when assigned', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking(),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);
    expect(screen.getByTestId('booking-lifecycle-preview')).toBeTruthy();
    expect(screen.getByText('Fix my sink')).toBeTruthy();
    expect(screen.getByText('Bold')).toBeTruthy();
  });

  it('shows tasker info when assigned', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking(),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);
    expect(screen.getByText('Bold')).toBeTruthy();
  });

  it('shows Confirm Complete CTA when tasker_marked_done', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking({ status: 'TASKER_MARKED_DONE' }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);
    expect(screen.getAllByText('Confirm').length).toBeGreaterThanOrEqual(1);
  });

  it('navigates to chat when message CTA is pressed', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking(),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);

    fireEvent.press(screen.getByTestId('SCR-CUST-017-cta'));
    expect(mockPush).toHaveBeenCalledWith('/inbox/b-1');
  });

  it('shows report issue instead of reschedule and cancel when tasker_marked_done', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking({ status: 'TASKER_MARKED_DONE' }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);

    expect(screen.getByText('Report Issue')).toBeTruthy();
    expect(screen.queryByTestId('booking-detail-screen-reschedule-link')).toBeNull();
    expect(screen.queryByTestId('booking-detail-screen-cancel-btn')).toBeNull();
  });

  it('navigates to the dispute flow when report issue is pressed', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking({ status: 'TASKER_MARKED_DONE' }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);

    fireEvent.press(screen.getByTestId('booking-detail-screen-report-issue-link'));
    expect(screen.getByTestId('booking-support-sheet')).toBeTruthy();
    fireEvent.press(screen.getByTestId('booking-support-sheet-primary'));
    expect(mockPush).toHaveBeenCalledWith('/(customer)/bookings/b-1/dispute');
  });

  it('shows leave review as the primary CTA when completed and not yet reviewed', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking({ status: 'COMPLETED' }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);

    expect(screen.getByText('Leave Review')).toBeTruthy();
    expect(screen.queryByText('Rebook')).toBeNull();
  });

  it('shows Rebook CTA when completed review is already submitted', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking({
        status: 'COMPLETED',
        customer_review_submitted_at: '2026-04-01T12:00:00Z',
      }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);

    expect(screen.getByText('Rebook')).toBeTruthy();
  });

  it('shows cancelled status when cancelled', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking({ status: 'CANCELLED' }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);
    expect(screen.getByText('Cancelled')).toBeTruthy();
  });

  it('shows no-show status when no_show', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking({ status: 'NO_SHOW' }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);
    expect(screen.getByText('No-Show')).toBeTruthy();
  });

  it('navigates to timeline on timeline link press', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking(),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);
    fireEvent.press(screen.getByTestId('booking-detail-screen-timeline-link'));
    expect(mockPush).toHaveBeenCalledWith('/(customer)/bookings/b-1/timeline');
  });

  it('shows cancel button when assigned', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking(),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);
    expect(screen.getByTestId('booking-detail-screen-cancel-btn')).toBeTruthy();
  });

  it('opens the cancel sheet when cancel booking is pressed', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking(),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);

    fireEvent.press(screen.getByTestId('booking-detail-screen-cancel-btn'));
    expect(screen.getByTestId('customer-cancel-sheet')).toBeTruthy();
  });

  it('navigates to tasker profile when the tasker card is pressed', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking(),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);

    fireEvent.press(screen.getByTestId('booking-detail-screen-tasker-card'));
    expect(mockPush).toHaveBeenCalledWith('/(customer)/taskers/tasker-1');
  });

  it('navigates to reschedule screen when reschedule is pressed', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking(),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);

    fireEvent.press(screen.getByTestId('booking-detail-screen-reschedule-link'));
    expect(mockPush).toHaveBeenCalledWith('/(customer)/bookings/b-1/reschedule');
  });

  it('completed state review link navigates to the shared review screen', () => {
    mockUseBookingDetail.mockReturnValue({
      data: makeBooking({ status: 'COMPLETED' }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);

    fireEvent.press(screen.getByTestId('booking-detail-screen-review-link'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(shared)/review/[bookingId]',
      params: { bookingId: 'b-1', role: 'customer' },
    });
  });

  it('renders error state', () => {
    mockUseBookingDetail.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    });
    render(<BookingDetailScreen />);
    expect(screen.getByTestId('SCR-CUST-017')).toBeTruthy();
  });
});
