import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

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
            get: (_, name) => (props: any) => (
                <Text testID={`icon-${String(name)}`} {...props} />
            ),
        }
    );
});

const mockReschedule = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useReschedule', () => ({
    useReschedule: () => ({
        mutateAsync: mockReschedule,
        isPending: false,
    }),
}));

import RescheduleScreen from '../../../../src/app/(customer)/bookings/[bookingId]/reschedule';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RescheduleScreen (SCR-CUST-020)', () => {
    it('has a testID on the screen container', () => {
        render(<RescheduleScreen />);
        expect(screen.getByTestId('reschedule-screen')).toBeTruthy();
    });

    it('renders date/time picker field', () => {
        render(<RescheduleScreen />);
        expect(screen.getByTestId('reschedule-screen-date-picker')).toBeTruthy();
    });

    it('renders reason field', () => {
        render(<RescheduleScreen />);
        expect(screen.getByText('Reason')).toBeTruthy();
        expect(screen.getByPlaceholderText('Reason for rescheduling...')).toBeTruthy();
    });

    it('submit calls reschedule with ISO date', async () => {
        mockReschedule.mockResolvedValue({ id: 'rs-1' });
        render(<RescheduleScreen />);
        // Simulate date selection by pressing the date picker
        fireEvent.press(screen.getByTestId('reschedule-screen-date-picker'));
        // Fill reason
        fireEvent.changeText(screen.getByPlaceholderText('Reason for rescheduling...'), 'Schedule conflict');
        // Submit
        fireEvent.press(screen.getByTestId('reschedule-screen-next'));
        await waitFor(() => {
            expect(mockReschedule).toHaveBeenCalledWith(
                expect.objectContaining({
                    bookingId: 'b-1',
                    proposed_scheduled_at: expect.any(String),
                    reason: 'Schedule conflict',
                    idempotencyKey: expect.any(String),
                })
            );
        });
    });

    it('shows schedule authority note', () => {
        render(<RescheduleScreen />);
        expect(screen.getByText('Schedule changes take effect only after counterparty acceptance')).toBeTruthy();
    });
});
