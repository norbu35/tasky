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

describe('VerificationGate (SCR-TASK-003)', () => {
    it('renders verification benefits text', () => {
        const { VerificationGate } = require('../../../src/features/tasks/components/VerificationGate');
        render(<VerificationGate onStartVerification={jest.fn()} onMaybeLater={jest.fn()} />);

        expect(screen.getByText('tasker.verification.gateTitle')).toBeTruthy();
        expect(screen.getByText('tasker.verification.gateBody')).toBeTruthy();
    });

    it('CTA navigates to verification flow', () => {
        const onStart = jest.fn();
        const { VerificationGate } = require('../../../src/features/tasks/components/VerificationGate');
        render(<VerificationGate onStartVerification={onStart} onMaybeLater={jest.fn()} />);

        fireEvent.press(screen.getByText('tasker.verification.gateCta'));
        expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('maybe later dismisses the gate', () => {
        const onLater = jest.fn();
        const { VerificationGate } = require('../../../src/features/tasks/components/VerificationGate');
        render(<VerificationGate onStartVerification={jest.fn()} onMaybeLater={onLater} />);

        fireEvent.press(screen.getByTestId('verification-gate-secondary-cta'));
        expect(onLater).toHaveBeenCalledTimes(1);
    });

    it('renders benefit list items', () => {
        const { VerificationGate } = require('../../../src/features/tasks/components/VerificationGate');
        render(<VerificationGate onStartVerification={jest.fn()} onMaybeLater={jest.fn()} />);

        expect(screen.getByTestId('verification-gate')).toBeTruthy();
    });
});
