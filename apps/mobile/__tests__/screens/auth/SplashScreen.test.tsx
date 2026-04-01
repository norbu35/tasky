import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useAuthStore } from '../../../src/store/authStore';

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

function expectRedirectHref(expectedHref: string) {
  const redirects = screen.getAllByTestId('redirect');
  expect(redirects.some((redirect) => redirect.props.children === expectedHref)).toBe(true);
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ session: null, profile: null, deviceToken: null });
});

describe('SplashScreen (SCR-SHARED-001)', () => {
  it('renders the Tasky logo', () => {
    useAuthStore.setState({ session: null });
    render(<SplashScreen />);
    expect(screen.getByText('Tasky')).toBeTruthy();
  });

  it('renders the Figma splash tagline', () => {
    useAuthStore.setState({ session: null });
    render(<SplashScreen />);
    expect(screen.getByText('Найдвартай гүйцэтгэгч')).toBeTruthy();
    expect(screen.getByText('хялбар захиалга')).toBeTruthy();
  });

  it('shows a loading indicator', () => {
    useAuthStore.setState({ session: null });
    render(<SplashScreen />);
    expect(screen.getByTestId('splash-loading')).toBeTruthy();
  });

  it('redirects authenticated customer users to my tasks', () => {
    useAuthStore.setState({
      session: {
        ...baseSession,
        user: { ...baseSession.user, role: 'CUSTOMER', primary_auth: 'PHONE_OTP' },
      },
    });
    render(<SplashScreen />);
    expectRedirectHref('/(customer)/tasks');
  });

  it('redirects authenticated tasker users to task feed', () => {
    useAuthStore.setState({
      session: {
        ...baseSession,
        user: { ...baseSession.user, role: 'TASKER', primary_auth: 'PHONE_OTP' },
      },
    });
    render(<SplashScreen />);
    expectRedirectHref('/(tabs)');
  });

  it('redirects Facebook-authenticated users to OTP migration', () => {
    useAuthStore.setState({
      session: {
        ...baseSession,
        user: { ...baseSession.user, role: 'CUSTOMER', primary_auth: 'FACEBOOK' },
      },
    });
    render(<SplashScreen />);
    expectRedirectHref('/(auth)/otp-migration');
  });

  it('redirects unauthenticated users to login', () => {
    render(<SplashScreen />);
    expectRedirectHref('/(auth)');
  });

  it('displays tagline text', () => {
    useAuthStore.setState({ session: null });
    render(<SplashScreen />);
    expect(screen.getByText('Найдвартай гүйцэтгэгч')).toBeTruthy();
    expect(screen.getByText('хялбар захиалга')).toBeTruthy();
  });
});
