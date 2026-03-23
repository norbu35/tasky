import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
    useLocalSearchParams: () => ({ categoryId: 'cat-123' }),
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

import IntakeFormScreen from '../../../src/app/(customer)/tasks/new/intake';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('IntakeFormScreen (SCR-CUST-003)', () => {
    it('has a testID on the screen container', () => {
        render(<IntakeFormScreen />);
        expect(screen.getByTestId('intake-form-screen')).toBeTruthy();
    });

    it('renders the description field label', () => {
        render(<IntakeFormScreen />);
        expect(screen.getByText('Description')).toBeTruthy();
    });

    it('renders the description text input', () => {
        render(<IntakeFormScreen />);
        expect(screen.getByTestId('intake-description-input')).toBeTruthy();
    });

    it('shows validation error when next pressed with empty description', () => {
        render(<IntakeFormScreen />);
        fireEvent.press(screen.getByTestId('intake-form-screen-next'));
        expect(screen.getByText('This field is required')).toBeTruthy();
    });

    it('navigates to photos when description is valid', () => {
        render(<IntakeFormScreen />);
        fireEvent.changeText(screen.getByTestId('intake-description-input'), 'Fix my leaky faucet');
        fireEvent.press(screen.getByTestId('intake-form-screen-next'));
        expect(mockPush).toHaveBeenCalledWith({
            pathname: '/(customer)/tasks/new/photos',
            params: { categoryId: 'cat-123', description: 'Fix my leaky faucet' },
        });
    });

    it('renders as step 1 of 5 wizard', () => {
        render(<IntakeFormScreen />);
        // FormWizardTemplate renders step dots; currentStep=0, totalSteps=5
        expect(screen.getByTestId('intake-form-screen')).toBeTruthy();
    });
});
