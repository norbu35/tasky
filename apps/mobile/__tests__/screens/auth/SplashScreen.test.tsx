import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';
import { useAuthStore } from '../../../src/store/authStore';
import { useAppStore } from '../../../src/store/appStore';

import SplashScreen from '../../../src/app/index';

const mockSplashBootstrap = jest.fn();
jest.mock('../../../src/providers/SplashBootstrapProvider', () => ({
  useSplashBootstrap: () => mockSplashBootstrap(),
  SplashBootstrapProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text testID="redirect">{href}</Text>,
    useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  };
});

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

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
  resetTestI18n();
  setTestLanguage('mn');
  useAuthStore.setState({ session: null });
  useAppStore.setState({ hasSeenOnboarding: true, currentRole: 'customer' });
  mockSplashBootstrap.mockReturnValue({
    phase: 'ready',
    destination: 'auth',
    error: null,
  });
});

describe('SplashScreen (SCR-SHARED-001)', () => {
  it('renders the Tasky logo', () => {
    useAuthStore.setState({ session: null });
    render(<SplashScreen />);
    expect(screen.getByTestId('tasky-logo')).toBeTruthy();
  });

  it('renders the Figma splash tagline', () => {
    useAuthStore.setState({ session: null });
    render(<SplashScreen />);
    expect(screen.getByText('Итгэмжлэгдсэн ажилчид, хялбар захиалга')).toBeTruthy();
  });

  it('shows a loading indicator during bootstrap', () => {
    useAuthStore.setState({ session: null });
    mockSplashBootstrap.mockReturnValue({ phase: 'prefetching', destination: 'auth', error: null });
    render(<SplashScreen />);
    expect(screen.getByTestId('splash-loading')).toBeTruthy();
  });

  it('redirects authenticated customer users to my tasks', () => {
    useAuthStore.setState({
      session: {
        ...baseSession,
        user: { ...baseSession.user, role: 'CUSTOMER', primary_auth: 'FACEBOOK' },
      },
    });
    mockSplashBootstrap.mockReturnValue({ phase: 'ready', destination: 'tabs', error: null });
    render(<SplashScreen />);
    expectRedirectHref('/(tabs)');
  });

  it('redirects authenticated tasker users to task feed', () => {
    useAuthStore.setState({
      session: {
        ...baseSession,
        user: { ...baseSession.user, role: 'TASKER', primary_auth: 'FACEBOOK' },
      },
    });
    mockSplashBootstrap.mockReturnValue({ phase: 'ready', destination: 'tabs', error: null });
    render(<SplashScreen />);
    expectRedirectHref('/(tabs)');
  });

  it('redirects Facebook-authenticated users to the launch tab shell', () => {
    useAuthStore.setState({
      session: {
        ...baseSession,
        user: { ...baseSession.user, role: 'CUSTOMER', primary_auth: 'FACEBOOK' },
      },
    });
    mockSplashBootstrap.mockReturnValue({ phase: 'ready', destination: 'tabs', error: null });
    render(<SplashScreen />);
    expectRedirectHref('/(tabs)');
  });

  it('redirects unauthenticated users to login', () => {
    render(<SplashScreen />);
    expectRedirectHref('/(auth)');
  });
});
