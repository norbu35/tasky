import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

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

const mockFlagNoShow = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useFlagNoShow', () => ({
    useFlagNoShow: () => ({
        mutate: mockFlagNoShow,
        isPending: false,
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
});

describe('TaskerNoShowSheet (SCR-TASK-014)', () => {
    it('shows reminder content at 10min past schedule', () => {
        const { TaskerNoShowSheet } = require('../../../../src/features/bookings/components/TaskerNoShowSheet');
        render(
            <TaskerNoShowSheet
                isOpen={true}
                onClose={jest.fn()}
                bookingId="booking-123"
                minutesPastSchedule={10}
            />
        );

        expect(screen.getByText('Have you met the customer?')).toBeTruthy();
    });

    it('shows flag button available at 15min past schedule', () => {
        const { TaskerNoShowSheet } = require('../../../../src/features/bookings/components/TaskerNoShowSheet');
        render(
            <TaskerNoShowSheet
                isOpen={true}
                onClose={jest.fn()}
                bookingId="booking-123"
                minutesPastSchedule={15}
            />
        );

        expect(screen.getByText('Flag No-Show')).toBeTruthy();
    });

    it('flag button calls flagNoShow', () => {
        const { TaskerNoShowSheet } = require('../../../../src/features/bookings/components/TaskerNoShowSheet');
        render(
            <TaskerNoShowSheet
                isOpen={true}
                onClose={jest.fn()}
                bookingId="booking-123"
                minutesPastSchedule={15}
            />
        );

        fireEvent.press(screen.getByText('Flag No-Show'));
        expect(mockFlagNoShow).toHaveBeenCalledWith({ bookingId: 'booking-123' });
    });

    it('shows wait button to dismiss', () => {
        const onClose = jest.fn();
        const { TaskerNoShowSheet } = require('../../../../src/features/bookings/components/TaskerNoShowSheet');
        render(
            <TaskerNoShowSheet
                isOpen={true}
                onClose={onClose}
                bookingId="booking-123"
                minutesPastSchedule={15}
            />
        );

        expect(screen.getByText('Wait')).toBeTruthy();
        fireEvent.press(screen.getByText('Wait'));
        expect(onClose).toHaveBeenCalled();
    });
});
