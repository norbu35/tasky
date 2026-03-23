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

const mockFlagNoShow = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useFlagNoShow', () => ({
    useFlagNoShow: () => ({
        mutateAsync: mockFlagNoShow,
        isPending: false,
    }),
}));

import { CustomerNoShowSheet } from '../../../../src/features/bookings/components/CustomerNoShowSheet';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('CustomerNoShowSheet (SCR-CUST-021)', () => {
    const defaultProps = {
        isOpen: true,
        onClose: jest.fn(),
        bookingId: 'booking-123',
        state: 'reminder_10min' as const,
    };

    it('has a testID on the container', () => {
        render(<CustomerNoShowSheet {...defaultProps} />);
        expect(screen.getByTestId('customer-no-show-sheet')).toBeTruthy();
    });

    it('shows reminder prompt at 10min state', () => {
        render(<CustomerNoShowSheet {...defaultProps} state="reminder_10min" />);
        expect(screen.getByText('Has the Tasker arrived?')).toBeTruthy();
        expect(screen.getByText('10 minutes past scheduled time. Please update the status.')).toBeTruthy();
    });

    it('shows "Yes, arrived" and "No, not yet" buttons at reminder state', () => {
        render(<CustomerNoShowSheet {...defaultProps} state="reminder_10min" />);
        expect(screen.getByText('Yes, arrived')).toBeTruthy();
        expect(screen.getByText('No, not yet')).toBeTruthy();
    });

    it('"Yes, arrived" dismisses the sheet', () => {
        const onClose = jest.fn();
        render(<CustomerNoShowSheet {...defaultProps} onClose={onClose} state="reminder_10min" />);
        fireEvent.press(screen.getByText('Yes, arrived'));
        expect(onClose).toHaveBeenCalled();
    });

    it('shows flag prompt at flag_available_15min state', () => {
        render(<CustomerNoShowSheet {...defaultProps} state="flag_available_15min" />);
        expect(screen.getByText('Tasker did not show up')).toBeTruthy();
        expect(
            screen.getByText('15 minutes past scheduled time. Flag as no-show? This will cancel the booking and trigger an admin review.')
        ).toBeTruthy();
    });

    it('shows "Flag No-Show" button at flag_available_15min state', () => {
        render(<CustomerNoShowSheet {...defaultProps} state="flag_available_15min" />);
        expect(screen.getByText('Flag No-Show')).toBeTruthy();
    });

    it('flag button calls flagNoShow API', async () => {
        mockFlagNoShow.mockResolvedValue(undefined);
        render(<CustomerNoShowSheet {...defaultProps} state="flag_available_15min" />);
        fireEvent.press(screen.getByText('Flag No-Show'));
        await waitFor(() => {
            expect(mockFlagNoShow).toHaveBeenCalledWith(
                expect.objectContaining({ bookingId: 'booking-123' })
            );
        });
    });

    it('shows dismiss button at flag state', () => {
        render(<CustomerNoShowSheet {...defaultProps} state="flag_available_15min" />);
        expect(screen.getByText('Dismiss')).toBeTruthy();
    });

    it('dismiss button closes the sheet', () => {
        const onClose = jest.fn();
        render(<CustomerNoShowSheet {...defaultProps} onClose={onClose} state="flag_available_15min" />);
        fireEvent.press(screen.getByText('Dismiss'));
        expect(onClose).toHaveBeenCalled();
    });

    it('shows strike warning note at flag state', () => {
        render(<CustomerNoShowSheet {...defaultProps} state="flag_available_15min" />);
        expect(screen.getByText('2 or more no-shows in 28 days triggers a strike review')).toBeTruthy();
    });

    it('shows flagged confirmation when state is flagged', () => {
        render(<CustomerNoShowSheet {...defaultProps} state="flagged" />);
        expect(screen.getByText('No-show flagged successfully')).toBeTruthy();
    });
});
