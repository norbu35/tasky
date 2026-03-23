import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
    useLocalSearchParams: () => ({ bookingId: 'booking-123' }),
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

const mockRaiseDispute = jest.fn();
let mockIsPending = false;
jest.mock('../../../../src/features/disputes/hooks/useDisputeCreate', () => ({
    useDisputeCreate: () => ({
        mutateAsync: mockRaiseDispute,
        isPending: mockIsPending,
    }),
}));

import DisputeRaiseScreen from '../../../../src/app/(customer)/bookings/[bookingId]/dispute';

beforeEach(() => {
    jest.clearAllMocks();
    mockIsPending = false;
});

describe('DisputeRaiseScreen (SCR-CUST-024)', () => {
    it('has a testID on the screen container', () => {
        render(<DisputeRaiseScreen />);
        expect(screen.getByTestId('dispute-raise-screen')).toBeTruthy();
    });

    it('renders reason selection on step 0', () => {
        render(<DisputeRaiseScreen />);
        expect(screen.getByText('Issue Type')).toBeTruthy();
    });

    it('renders predefined reason options', () => {
        render(<DisputeRaiseScreen />);
        expect(screen.getByText('Poor quality work')).toBeTruthy();
        expect(screen.getByText('Tasker was late')).toBeTruthy();
        expect(screen.getByText('Incomplete work')).toBeTruthy();
        expect(screen.getByText('Other')).toBeTruthy();
    });

    it('advances to evidence step after selecting reason and pressing Next', () => {
        render(<DisputeRaiseScreen />);
        fireEvent.press(screen.getByText('Poor quality work'));
        fireEvent.press(screen.getByTestId('dispute-raise-screen-next'));
        expect(screen.getByText('Evidence')).toBeTruthy();
    });

    it('renders photo upload area on evidence step', () => {
        render(<DisputeRaiseScreen />);
        fireEvent.press(screen.getByText('Poor quality work'));
        fireEvent.press(screen.getByTestId('dispute-raise-screen-next'));
        expect(screen.getByTestId('dispute-evidence-photos')).toBeTruthy();
    });

    it('advances to description step after evidence', () => {
        render(<DisputeRaiseScreen />);
        // Step 0 -> select reason
        fireEvent.press(screen.getByText('Poor quality work'));
        fireEvent.press(screen.getByTestId('dispute-raise-screen-next'));
        // Step 1 -> evidence (skip, just press next)
        fireEvent.press(screen.getByTestId('dispute-raise-screen-next'));
        // Step 2 -> description
        expect(screen.getByText('Description')).toBeTruthy();
        expect(screen.getByPlaceholderText('Describe the issue in detail...')).toBeTruthy();
    });

    it('submit calls raiseDispute with correct params', async () => {
        mockRaiseDispute.mockResolvedValue({ id: 'dispute-456', status: 'OPEN' });
        render(<DisputeRaiseScreen />);
        // Step 0 -> select reason
        fireEvent.press(screen.getByText('Poor quality work'));
        fireEvent.press(screen.getByTestId('dispute-raise-screen-next'));
        // Step 1 -> evidence
        fireEvent.press(screen.getByTestId('dispute-raise-screen-next'));
        // Step 2 -> description + submit
        fireEvent.changeText(
            screen.getByPlaceholderText('Describe the issue in detail...'),
            'The work was not done properly'
        );
        fireEvent.press(screen.getByTestId('dispute-raise-screen-next'));
        await waitFor(() => {
            expect(mockRaiseDispute).toHaveBeenCalledWith(
                expect.objectContaining({
                    bookingId: 'booking-123',
                    reason: 'Poor quality work',
                    idempotencyKey: expect.any(String),
                })
            );
        });
    });

    it('success navigates to dispute status screen', async () => {
        mockRaiseDispute.mockResolvedValue({ id: 'dispute-456', status: 'OPEN' });
        render(<DisputeRaiseScreen />);
        // Step 0
        fireEvent.press(screen.getByText('Poor quality work'));
        fireEvent.press(screen.getByTestId('dispute-raise-screen-next'));
        // Step 1
        fireEvent.press(screen.getByTestId('dispute-raise-screen-next'));
        // Step 2
        fireEvent.changeText(
            screen.getByPlaceholderText('Describe the issue in detail...'),
            'Issue description'
        );
        fireEvent.press(screen.getByTestId('dispute-raise-screen-next'));
        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith(
                expect.stringContaining('/disputes/dispute-456')
            );
        });
    });

    it('shows back button on step 1+', () => {
        render(<DisputeRaiseScreen />);
        fireEvent.press(screen.getByText('Poor quality work'));
        fireEvent.press(screen.getByTestId('dispute-raise-screen-next'));
        expect(screen.getByTestId('dispute-raise-screen-back')).toBeTruthy();
    });

    it('shows evidence deadline note', () => {
        render(<DisputeRaiseScreen />);
        fireEvent.press(screen.getByText('Poor quality work'));
        fireEvent.press(screen.getByTestId('dispute-raise-screen-next'));
        expect(screen.getByText('Dispute auto-closes if evidence is not provided within 24 hours')).toBeTruthy();
    });
});
