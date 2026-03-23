import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
    useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string | Record<string, unknown>) => {
            const fb = typeof fallback === 'string' ? fallback : key;
            return fb;
        },
        i18n: { language: 'en' },
    }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@gorhom/bottom-sheet', () => {
    const React = require('react');
    const { View } = require('react-native');
    const MockBottomSheet = React.forwardRef((props: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            snapToIndex: jest.fn(),
            close: jest.fn(),
        }));
        return <View {...props} />;
    });
    return { __esModule: true, default: MockBottomSheet, BottomSheetView: View, BottomSheetModal: View, BottomSheetModalProvider: View, BottomSheetBackdrop: View };
});

jest.mock('lucide-react-native', () => {
    const { Text } = require('react-native');
    return new Proxy({}, { get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} /> });
});

const mockPush = jest.fn();
const mockOnDismiss = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
});

describe('ReviewReminder (SCR-SHARED-018)', () => {
    it('renders reminder text', () => {
        const { ReviewReminder } = require('../../../src/features/review/components/ReviewReminder');
        render(
            <ReviewReminder
                isOpen={true}
                onDismiss={mockOnDismiss}
                bookingId="booking-123"
            />,
        );

        expect(screen.getByText('shared.review.reminderTitle')).toBeTruthy();
        expect(screen.getByText('shared.review.reminderBody')).toBeTruthy();
    });

    it('renders "Leave a Review" CTA button', () => {
        const { ReviewReminder } = require('../../../src/features/review/components/ReviewReminder');
        render(
            <ReviewReminder
                isOpen={true}
                onDismiss={mockOnDismiss}
                bookingId="booking-123"
            />,
        );

        const cta = screen.getByText('shared.review.reminderCta');
        expect(cta).toBeTruthy();
    });

    it('renders "Later" dismiss button', () => {
        const { ReviewReminder } = require('../../../src/features/review/components/ReviewReminder');
        render(
            <ReviewReminder
                isOpen={true}
                onDismiss={mockOnDismiss}
                bookingId="booking-123"
            />,
        );

        const laterBtn = screen.getByText('shared.review.reminderLater');
        expect(laterBtn).toBeTruthy();

        fireEvent.press(laterBtn);
        expect(mockOnDismiss).toHaveBeenCalled();
    });
});
