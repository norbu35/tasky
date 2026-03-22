import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
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

describe('SubmittedScreen (SCR-TASK-010)', () => {
    it('renders success headline', () => {
        const SubmittedScreen = require('../../../../src/app/(tasker)/verification/submitted').default;
        render(<SubmittedScreen />);

        expect(screen.getByText('tasker.verification.submittedTitle')).toBeTruthy();
    });

    it('renders submitted description', () => {
        const SubmittedScreen = require('../../../../src/app/(tasker)/verification/submitted').default;
        render(<SubmittedScreen />);

        expect(screen.getByText('tasker.verification.submittedBody')).toBeTruthy();
    });

    it('CTA navigates to pending via replace', () => {
        const SubmittedScreen = require('../../../../src/app/(tasker)/verification/submitted').default;
        render(<SubmittedScreen />);

        fireEvent.press(screen.getByTestId('submitted-screen-cta'));
        expect(mockReplace).toHaveBeenCalledWith('/(tasker)/verification/pending');
    });

    it('renders with correct testID', () => {
        const SubmittedScreen = require('../../../../src/app/(tasker)/verification/submitted').default;
        render(<SubmittedScreen />);

        expect(screen.getByTestId('submitted-screen')).toBeTruthy();
    });
});
