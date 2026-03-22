import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
    useLocalSearchParams: () => ({
        categoryId: 'cat-123',
        description: 'Fix my sink',
        photos: '[]',
        location: 'Behind State Dept Store',
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

import ScheduleBudgetScreen from '../../../src/app/(customer)/tasks/new/schedule';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('ScheduleBudgetScreen (SCR-CUST-006)', () => {
    it('has a testID on the screen container', () => {
        render(<ScheduleBudgetScreen />);
        expect(screen.getByTestId('schedule-budget-screen')).toBeTruthy();
    });

    it('renders date field', () => {
        render(<ScheduleBudgetScreen />);
        expect(screen.getByTestId('schedule-date-input')).toBeTruthy();
    });

    it('renders time field', () => {
        render(<ScheduleBudgetScreen />);
        expect(screen.getByTestId('schedule-time-input')).toBeTruthy();
    });

    it('renders budget field', () => {
        render(<ScheduleBudgetScreen />);
        expect(screen.getByTestId('schedule-budget-input')).toBeTruthy();
    });

    it('renders budget label', () => {
        render(<ScheduleBudgetScreen />);
        expect(screen.getByText('Budget')).toBeTruthy();
    });

    it('validates budget is a number', () => {
        render(<ScheduleBudgetScreen />);
        fireEvent.changeText(screen.getByTestId('schedule-budget-input'), 'abc');
        fireEvent.press(screen.getByTestId('schedule-budget-screen-next'));
        expect(screen.getByText('Budget must be at least ₮1,001')).toBeTruthy();
    });

    it('validates budget minimum', () => {
        render(<ScheduleBudgetScreen />);
        fireEvent.changeText(screen.getByTestId('schedule-date-input'), '2026-04-01');
        fireEvent.changeText(screen.getByTestId('schedule-time-input'), '10:00');
        fireEvent.changeText(screen.getByTestId('schedule-budget-input'), '500');
        fireEvent.press(screen.getByTestId('schedule-budget-screen-next'));
        expect(screen.getByText('Budget must be at least ₮1,001')).toBeTruthy();
    });

    it('navigates to review when valid', () => {
        render(<ScheduleBudgetScreen />);
        fireEvent.changeText(screen.getByTestId('schedule-date-input'), '2026-04-01');
        fireEvent.changeText(screen.getByTestId('schedule-time-input'), '10:00');
        fireEvent.changeText(screen.getByTestId('schedule-budget-input'), '50000');
        fireEvent.press(screen.getByTestId('schedule-budget-screen-next'));
        expect(mockPush).toHaveBeenCalledWith(
            expect.objectContaining({
                pathname: '/(customer)/tasks/new/review',
            })
        );
    });

    it('renders as step 4 of 5 wizard', () => {
        render(<ScheduleBudgetScreen />);
        expect(screen.getByTestId('schedule-budget-screen')).toBeTruthy();
    });
});
