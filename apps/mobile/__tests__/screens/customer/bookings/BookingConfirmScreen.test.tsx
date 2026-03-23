import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
    useLocalSearchParams: () => ({
        taskId: 'task-1',
        applicationId: 'app-1',
        taskerId: 'tasker-1',
        taskTitle: 'Fix my sink',
        taskBudget: '50000',
        taskSchedule: '2026-04-01T10:00:00Z',
        taskerName: 'Bold',
        taskerAvatar: 'https://example.com/avatar.jpg',
        taskerRating: '4.7',
    }),
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

const mockAcceptApplication = jest.fn();
const mockMutate = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useAcceptApplication', () => ({
    useAcceptApplication: () => ({
        mutateAsync: mockAcceptApplication,
        mutate: mockMutate,
        isPending: false,
    }),
}));

import BookingConfirmScreen from '../../../../src/app/(customer)/bookings/confirm';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('BookingConfirmScreen (SCR-CUST-014)', () => {
    it('has a testID on the screen container', () => {
        render(<BookingConfirmScreen />);
        expect(screen.getByTestId('booking-confirm-screen')).toBeTruthy();
    });

    it('renders task summary info', () => {
        render(<BookingConfirmScreen />);
        expect(screen.getByText('Fix my sink')).toBeTruthy();
    });

    it('renders tasker info', () => {
        render(<BookingConfirmScreen />);
        expect(screen.getByText('Bold')).toBeTruthy();
    });

    it('renders disclaimer checkbox', () => {
        render(<BookingConfirmScreen />);
        expect(screen.getByTestId('booking-confirm-screen-disclaimer')).toBeTruthy();
    });

    it('CTA is disabled until disclaimer is checked', () => {
        render(<BookingConfirmScreen />);
        const cta = screen.getByTestId('booking-confirm-screen-cta');
        expect(cta).toBeDisabled();
    });

    it('CTA becomes enabled after disclaimer is checked', () => {
        render(<BookingConfirmScreen />);
        fireEvent.press(screen.getByTestId('booking-confirm-screen-disclaimer'));
        const cta = screen.getByTestId('booking-confirm-screen-cta');
        expect(cta).not.toBeDisabled();
    });

    it('confirm calls acceptApplication with idempotency key', async () => {
        mockAcceptApplication.mockResolvedValue({ id: 'booking-1' });
        render(<BookingConfirmScreen />);
        fireEvent.press(screen.getByTestId('booking-confirm-screen-disclaimer'));
        fireEvent.press(screen.getByTestId('booking-confirm-screen-cta'));
        await waitFor(() => {
            expect(mockAcceptApplication).toHaveBeenCalledWith(
                expect.objectContaining({
                    taskId: 'task-1',
                    applicationId: 'app-1',
                    liabilityDisclaimerAccepted: true,
                    idempotencyKey: expect.any(String),
                })
            );
        });
    });

    it('renders add-to-calendar option text', () => {
        render(<BookingConfirmScreen />);
        expect(screen.getByText('Add to calendar?')).toBeTruthy();
    });

    it('renders payment note', () => {
        render(<BookingConfirmScreen />);
        expect(screen.getByText('Payment is arranged directly with the Tasker')).toBeTruthy();
    });
});
