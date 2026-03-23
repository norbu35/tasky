import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

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
    return new Proxy({}, {
        get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    });
});

let mockIsPending = false;
const mockCancelBooking = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useCancelBooking', () => ({
    useCancelBooking: () => ({
        mutate: mockCancelBooking,
        get isPending() { return mockIsPending; },
    }),
}));

jest.mock('@gorhom/bottom-sheet', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        __esModule: true,
        default: React.forwardRef(({ children, index }: any, ref: any) => {
            React.useImperativeHandle(ref, () => ({
                snapToIndex: jest.fn(),
                close: jest.fn(),
            }));
            if (index === -1) return null;
            return <View>{children}</View>;
        }),
        BottomSheetBackdrop: ({ children }: any) => <View>{children}</View>,
        BottomSheetView: ({ children }: any) => <View>{children}</View>,
    };
});

beforeEach(() => {
    jest.clearAllMocks();
    mockIsPending = false;
});

describe('TaskerCancelSheet (SCR-TASK-015)', () => {
    it('shows strike warning text', () => {
        const { TaskerCancelSheet } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
        render(
            <TaskerCancelSheet
                isOpen={true}
                onClose={jest.fn()}
                bookingId="booking-123"
                strikeCount={0}
            />
        );

        expect(screen.getByText('Cancel this booking?')).toBeTruthy();
        expect(screen.getByText('Cancelling will reopen the task. Cancellations affect your reliability score.')).toBeTruthy();
    });

    it('confirm button calls cancelBooking', () => {
        const { TaskerCancelSheet } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
        render(
            <TaskerCancelSheet
                isOpen={true}
                onClose={jest.fn()}
                bookingId="booking-123"
                strikeCount={0}
            />
        );

        fireEvent.press(screen.getByText('Confirm Cancellation'));
        expect(mockCancelBooking).toHaveBeenCalled();
    });

    it('shows loading state when confirming', () => {
        mockIsPending = true;

        const { TaskerCancelSheet } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
        render(
            <TaskerCancelSheet
                isOpen={true}
                onClose={jest.fn()}
                bookingId="booking-123"
                strikeCount={0}
            />
        );

        expect(screen.getByTestId('cancel-sheet-loading')).toBeTruthy();
    });

    it('go back button calls onClose', () => {
        const onClose = jest.fn();
        const { TaskerCancelSheet } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
        render(
            <TaskerCancelSheet
                isOpen={true}
                onClose={onClose}
                bookingId="booking-123"
                strikeCount={0}
            />
        );

        fireEvent.press(screen.getByText('Go Back'));
        expect(onClose).toHaveBeenCalled();
    });

    it('shows suspension warning at 2 strikes', () => {
        const { TaskerCancelSheet } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
        render(
            <TaskerCancelSheet
                isOpen={true}
                onClose={jest.fn()}
                bookingId="booking-123"
                strikeCount={2}
            />
        );

        expect(screen.getByText('Warning: You have 2 cancellations in 30 days. One more will result in a 7-day suspension!')).toBeTruthy();
    });
});
