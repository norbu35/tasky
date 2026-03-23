import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useAuthStore } from '../../../src/store/authStore';
import { useAppStore } from '../../../src/store/appStore';

import SplashScreen from '../../../src/app/index';

jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text testID="redirect">{href}</Text>,
    useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
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
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
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

const baseSession = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: {
    id: 'user-1',
    phone: '+97699001122',
    primary_auth: 'PHONE_OTP' as const,
    role: 'CUSTOMER' as const,
    status: 'PENDING' as const,
    created_at: '2026-02-14T00:00:00Z',
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ session: null, profile: null, deviceToken: null });
  useAppStore.setState({ hasSeenOnboarding: false, currentRole: 'customer' });
});

describe('SplashScreen (SCR-SHARED-001)', () => {
  it('renders the Tasky logo', () => {
    useAppStore.setState({ hasSeenOnboarding: true });
    useAuthStore.setState({ session: null });
    render(<SplashScreen />);
    expect(screen.getByText('Tasky')).toBeTruthy();
  });

  it('shows a loading indicator', () => {
    useAppStore.setState({ hasSeenOnboarding: true });
    useAuthStore.setState({ session: null });
    render(<SplashScreen />);
    expect(screen.getByTestId('splash-loading')).toBeTruthy();
  });

  it('redirects authenticated users to tabs', () => {
    useAppStore.setState({ hasSeenOnboarding: true });
    useAuthStore.setState({ session: baseSession });
    render(<SplashScreen />);
    expect(screen.getByTestId('redirect')).toHaveTextContent('/(tabs)');
  });

  it('redirects unauthenticated users to auth', () => {
    useAppStore.setState({ hasSeenOnboarding: true });
    useAuthStore.setState({ session: null });
    render(<SplashScreen />);
    const redirects = screen.getAllByTestId('redirect');
    const authRedirect = redirects.find((el) => el.props.children === '/(auth)');
    expect(authRedirect).toBeTruthy();
  });

  it('redirects first-launch users to onboarding', () => {
    useAppStore.setState({ hasSeenOnboarding: false });
    useAuthStore.setState({ session: null });
    render(<SplashScreen />);
    expect(screen.getByTestId('redirect')).toHaveTextContent('/onboarding');
  });

  it('displays tagline text', () => {
    useAppStore.setState({ hasSeenOnboarding: true });
    useAuthStore.setState({ session: null });
    render(<SplashScreen />);
    expect(screen.getByText('Trusted taskers, easy booking')).toBeTruthy();
  });
});
