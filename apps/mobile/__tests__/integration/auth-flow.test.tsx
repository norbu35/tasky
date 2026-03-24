import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useAppStore } from '../../src/store/appStore';
import { baseSession, resetStores, setFirstTimeUser, setAuthenticated } from './fixtures';
import SplashScreen from '../../src/app/index';
import OnboardingScreen from '../../src/app/onboarding';
import RoleSelectScreen from '../../src/app/(auth)/role-select';
import LoginScreen from '../../src/app/(auth)/index';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text testID="redirect">{href}</Text>,
    Stack: ({ children }: { children?: React.ReactNode }) => {
      const { View } = require('react-native');
      return <View testID="stack-layout">{children}</View>;
    },
    useRouter: () => ({ replace: mockReplace, push: mockPush, back: mockBack }),
    router: { replace: mockReplace, push: mockPush },
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
    { get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} /> },
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
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    SafeAreaProvider: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  resetStores();
});

describe('Auth flow integration', () => {
  it('first-time user is redirected to onboarding', () => {
    setFirstTimeUser();
    render(<SplashScreen />);
    expect(screen.getByTestId('redirect')).toHaveTextContent('/onboarding');
  });

  it('returning guest is redirected to auth', () => {
    resetStores(); // hasSeenOnboarding=true, session=null
    render(<SplashScreen />);
    const redirects = screen.getAllByTestId('redirect');
    const authRedirect = redirects.find((el) => el.props.children === '/(auth)');
    expect(authRedirect).toBeTruthy();
  });

  it('authenticated user is redirected to tabs', () => {
    setAuthenticated();
    render(<SplashScreen />);
    expect(screen.getByTestId('redirect')).toHaveTextContent('/(tabs)');
  });

  it('onboarding skip completes onboarding and navigates to role-select', () => {
    render(<OnboardingScreen />);
    const skipButton = screen.getByTestId('onboarding-skip');
    fireEvent.press(skipButton);

    expect(useAppStore.getState().hasSeenOnboarding).toBe(true);
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/role-select');
  });

  it('role selection sets role and navigates to permissions', () => {
    render(<RoleSelectScreen />);
    fireEvent.press(screen.getByTestId('role-card-customer'));
    fireEvent.press(screen.getByTestId('role-confirm-button'));

    expect(useAppStore.getState().currentRole).toBe('customer');
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/permission-camera');
  });

  it('role selection works for tasker', () => {
    render(<RoleSelectScreen />);
    fireEvent.press(screen.getByTestId('role-card-tasker'));
    fireEvent.press(screen.getByTestId('role-confirm-button'));

    expect(useAppStore.getState().currentRole).toBe('tasker');
  });

  it('login screen renders after auth redirect', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Welcome to Tasky')).toBeTruthy();
    expect(screen.getByTestId('facebook-login-button')).toBeTruthy();
  });

  it('full auth state transition: guest -> authenticated', () => {
    resetStores();
    const { unmount } = render(<SplashScreen />);
    const redirects = screen.getAllByTestId('redirect');
    const authRedirect = redirects.find((el) => el.props.children === '/(auth)');
    expect(authRedirect).toBeTruthy();

    unmount();

    // Simulate login completing
    useAuthStore.setState({ session: baseSession });
    render(<SplashScreen />);
    expect(screen.getByTestId('redirect')).toHaveTextContent('/(tabs)');
  });
});
