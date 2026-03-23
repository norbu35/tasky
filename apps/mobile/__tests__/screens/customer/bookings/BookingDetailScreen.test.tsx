import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
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
            get: (_, name) => (props: any) => (
                <Text testID={`icon-${String(name)}`} {...props} />
            ),
        }
    );
});

jest.mock('@gorhom/bottom-sheet', () => {
    const { View } = require('react-native');
    const MockBottomSheet = ({ children, ...props }: any) => <View {...props}>{children}</View>;
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
        mutateAsync: jest.fn(),
        isPending: false,
    }),
}));

import BookingDetailScreen from '../../../../src/app/(customer)/bookings/[bookingId]/index';

beforeEach(() => {
    jest.clearAllMocks();
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
        mockUseBookingDetail.mockReturnValue({ data: null, isLoading: true, isError: false, refetch: jest.fn() });
        render(<BookingDetailScreen />);
        expect(screen.getByTestId('booking-detail-screen')).toBeTruthy();
    });

    it('renders loading state', () => {
        mockUseBookingDetail.mockReturnValue({ data: null, isLoading: true, isError: false, refetch: jest.fn() });
        render(<BookingDetailScreen />);
        expect(screen.getByTestId('booking-detail-screen')).toBeTruthy();
    });

    it('renders booking info when assigned', () => {
        mockUseBookingDetail.mockReturnValue({ data: makeBooking(), isLoading: false, isError: false, refetch: jest.fn() });
        render(<BookingDetailScreen />);
        expect(screen.getByText('Fix my sink')).toBeTruthy();
        expect(screen.getByText('Bold')).toBeTruthy();
    });

    it('shows tasker info when assigned', () => {
        mockUseBookingDetail.mockReturnValue({ data: makeBooking(), isLoading: false, isError: false, refetch: jest.fn() });
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
        expect(screen.getAllByText('Confirm Complete').length).toBeGreaterThanOrEqual(1);
    });

    it('shows Rebook CTA when completed', () => {
        mockUseBookingDetail.mockReturnValue({
            data: makeBooking({ status: 'COMPLETED' }),
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
        mockUseBookingDetail.mockReturnValue({ data: makeBooking(), isLoading: false, isError: false, refetch: jest.fn() });
        render(<BookingDetailScreen />);
        fireEvent.press(screen.getByTestId('booking-detail-screen-timeline-link'));
        expect(mockPush).toHaveBeenCalledWith('/(customer)/bookings/b-1/timeline');
    });

    it('shows cancel button when assigned', () => {
        mockUseBookingDetail.mockReturnValue({ data: makeBooking(), isLoading: false, isError: false, refetch: jest.fn() });
        render(<BookingDetailScreen />);
        expect(screen.getByText('Cancel Booking')).toBeTruthy();
    });

    it('renders error state', () => {
        mockUseBookingDetail.mockReturnValue({ data: null, isLoading: false, isError: true, refetch: jest.fn() });
        render(<BookingDetailScreen />);
        expect(screen.getByTestId('booking-detail-screen')).toBeTruthy();
    });
});
