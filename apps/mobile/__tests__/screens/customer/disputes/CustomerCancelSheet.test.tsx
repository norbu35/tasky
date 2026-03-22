import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
    useLocalSearchParams: () => ({ bookingId: 'booking-123' }),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fb?: string) => fb || key,
        i18n: { language: 'en' },
    }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

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

const mockCancelBooking = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useCancelBooking', () => ({
    useCancelBooking: () => ({
        mutateAsync: mockCancelBooking,
        isPending: false,
    }),
}));

import { CustomerCancelSheet } from '../../../../src/features/bookings/components/CustomerCancelSheet';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('CustomerCancelSheet (SCR-CUST-022)', () => {
    const defaultProps = {
        isOpen: true,
        onClose: jest.fn(),
        bookingId: 'booking-123',
        cancelType: 'free_cancel' as const,
    };

    it('has a testID on the container', () => {
        render(<CustomerCancelSheet {...defaultProps} />);
        expect(screen.getByTestId('customer-cancel-sheet')).toBeTruthy();
    });

    it('shows title "Cancel Booking"', () => {
        render(<CustomerCancelSheet {...defaultProps} />);
        expect(screen.getAllByText('Cancel Booking').length).toBeGreaterThanOrEqual(1);
    });

    it('shows free cancel copy when cancelType is free_cancel', () => {
        render(<CustomerCancelSheet {...defaultProps} cancelType="free_cancel" />);
        expect(screen.getByText('You can cancel this booking with no penalty.')).toBeTruthy();
    });

    it('shows late cancel warning when cancelType is late_cancel_warning', () => {
        render(<CustomerCancelSheet {...defaultProps} cancelType="late_cancel_warning" />);
        expect(
            screen.getByText('Less than 4 hours until scheduled time. This cancellation will be recorded as a reliability incident.')
        ).toBeTruthy();
    });

    it('shows cancellation policy note', () => {
        render(<CustomerCancelSheet {...defaultProps} />);
        expect(
            screen.getByText('Cancellation policy: >4 hours before — no penalty. Within 4 hours — reliability incident.')
        ).toBeTruthy();
    });

    it('confirm button calls cancelBooking with idempotency key', async () => {
        mockCancelBooking.mockResolvedValue({ id: 'booking-123', status: 'CANCELLED' });
        render(<CustomerCancelSheet {...defaultProps} />);
        fireEvent.press(screen.getByTestId('cancel-confirm-btn'));
        await waitFor(() => {
            expect(mockCancelBooking).toHaveBeenCalledWith(
                expect.objectContaining({
                    bookingId: 'booking-123',
                    idempotencyKey: expect.any(String),
                })
            );
        });
    });

    it('Go Back button closes the sheet', () => {
        const onClose = jest.fn();
        render(<CustomerCancelSheet {...defaultProps} onClose={onClose} />);
        fireEvent.press(screen.getByText('Go Back'));
        expect(onClose).toHaveBeenCalled();
    });
});
