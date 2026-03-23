import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
    useLocalSearchParams: () => ({}),
}));

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

beforeEach(() => {
    jest.clearAllMocks();
});

describe('ConsentScreen (SCR-TASK-004)', () => {
    it('renders consent heading and explanation text', () => {
        const ConsentScreen = require('../../../../src/app/(tasker)/verification/consent').default;
        render(<ConsentScreen />);

        expect(screen.getAllByText('tasker.verification.consentTitle').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('tasker.verification.consentBody')).toBeTruthy();
    });

    it('renders checkbox for agreement', () => {
        const ConsentScreen = require('../../../../src/app/(tasker)/verification/consent').default;
        render(<ConsentScreen />);

        expect(screen.getByTestId('consent-checkbox')).toBeTruthy();
    });

    it('CTA is disabled until user agrees', () => {
        const ConsentScreen = require('../../../../src/app/(tasker)/verification/consent').default;
        render(<ConsentScreen />);

        const cta = screen.getByTestId('consent-screen-cta');
        // Button should be disabled (opacity 0.5 is applied by Button when disabled)
        expect(cta).toBeDisabled();
    });

    it('checkbox toggles agreement state', () => {
        const ConsentScreen = require('../../../../src/app/(tasker)/verification/consent').default;
        render(<ConsentScreen />);

        const checkbox = screen.getByTestId('consent-checkbox');
        fireEvent.press(checkbox);

        // After checking, CTA should be enabled
        const cta = screen.getByTestId('consent-screen-cta');
        expect(cta).not.toBeDisabled();
    });

    it('CTA navigates to upload screen after agreement', () => {
        const ConsentScreen = require('../../../../src/app/(tasker)/verification/consent').default;
        render(<ConsentScreen />);

        // First agree
        fireEvent.press(screen.getByTestId('consent-checkbox'));

        // Then press CTA
        fireEvent.press(screen.getByTestId('consent-screen-cta'));

        expect(mockPush).toHaveBeenCalledWith('/(tasker)/verification/upload');
    });

    it('renders data items list', () => {
        const ConsentScreen = require('../../../../src/app/(tasker)/verification/consent').default;
        render(<ConsentScreen />);

        expect(screen.getByTestId('consent-data-items')).toBeTruthy();
    });

    it('back button calls router.back', () => {
        const ConsentScreen = require('../../../../src/app/(tasker)/verification/consent').default;
        render(<ConsentScreen />);

        fireEvent.press(screen.getByTestId('consent-screen-back'));
        expect(mockBack).toHaveBeenCalledTimes(1);
    });
});
