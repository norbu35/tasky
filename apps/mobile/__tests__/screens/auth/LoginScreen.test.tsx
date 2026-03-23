import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();

jest.mock('expo-router', () => {
    const { Text } = require('react-native');
    return {
        Redirect: ({ href }: { href: string }) => <Text testID="redirect">{href}</Text>,
        useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
        router: { replace: jest.fn() },
    };
});

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string) => fallback || key,
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

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(() => Promise.resolve(null)),
        setItem: jest.fn(() => Promise.resolve()),
        removeItem: jest.fn(() => Promise.resolve()),
        mergeItem: jest.fn(() => Promise.resolve()),
        clear: jest.fn(() => Promise.resolve()),
        getAllKeys: jest.fn(() => Promise.resolve([])),
        multiGet: jest.fn(() => Promise.resolve([])),
        multiSet: jest.fn(() => Promise.resolve()),
        multiRemove: jest.fn(() => Promise.resolve()),
        multiMerge: jest.fn(() => Promise.resolve()),
    },
}));

import LoginScreen from '../../../src/app/(auth)/index';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('LoginScreen (SCR-SHARED-002)', () => {
    it('renders the login title', () => {
        render(<LoginScreen />);
        expect(screen.getByText('Welcome to Tasky')).toBeTruthy();
    });

    it('renders the login subtitle', () => {
        render(<LoginScreen />);
        expect(screen.getByText("Mongolia's trusted service marketplace")).toBeTruthy();
    });

    it('renders the Facebook login button', () => {
        render(<LoginScreen />);
        expect(screen.getByTestId('facebook-login-button')).toBeTruthy();
    });

    it('shows error state on login failure', async () => {
        render(<LoginScreen />);
        fireEvent.press(screen.getByTestId('facebook-login-button'));
        await waitFor(() => {
            expect(screen.getByTestId('login-error')).toBeTruthy();
        });
    });

    it('displays the Tasky logo', () => {
        render(<LoginScreen />);
        expect(screen.getByText('Tasky')).toBeTruthy();
    });

    it('has a testID on the screen container', () => {
        render(<LoginScreen />);
        expect(screen.getByTestId('login-screen')).toBeTruthy();
    });

    it('shows Facebook button label text', () => {
        render(<LoginScreen />);
        expect(screen.getByText('Continue with Facebook')).toBeTruthy();
    });
});
