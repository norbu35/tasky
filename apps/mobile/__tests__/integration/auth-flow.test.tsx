import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../test-utils/mockI18n';
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
const mockDevLoginMutate = jest.fn();

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

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});
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
jest.mock('../../src/features/auth/hooks/useAuth', () => ({
  useDevLogin: () => ({
    mutate: mockDevLoginMutate,
    isPending: false,
    error: null,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  resetStores();
  resetTestI18n();
  setTestLanguage('mn');
});

describe('Auth flow integration', () => {
  it('first-time unauthenticated user lands on auth from splash', () => {
    setFirstTimeUser();
    render(<SplashScreen />);
    expect(screen.getByTestId('redirect')).toHaveTextContent('/(auth)');
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

  it('onboarding skip navigates to role-select without completing onboarding yet', () => {
    setFirstTimeUser();
    render(<OnboardingScreen />);
    const skipButton = screen.getByTestId('onboarding-skip');
    fireEvent.press(skipButton);

    expect(useAppStore.getState().hasSeenOnboarding).toBe(false);
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/role-select');
  });

  it('role selection confirms before navigating to permissions', () => {
    render(<RoleSelectScreen />);
    fireEvent.press(screen.getByTestId('role-card-customer'));
    fireEvent.press(screen.getByTestId('role-confirm-button'));

    expect(screen.getByText('Та итгэлтэй байна уу?')).toBeTruthy();
    fireEvent.press(screen.getByTestId('role-sheet-confirm'));
    expect(useAppStore.getState().currentRole).toBe('customer');
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/permission-camera');
  });

  it('role selection works for tasker', () => {
    render(<RoleSelectScreen />);
    fireEvent.press(screen.getByTestId('role-card-tasker'));
    fireEvent.press(screen.getByTestId('role-confirm-button'));
    fireEvent.press(screen.getByTestId('role-sheet-confirm'));

    expect(useAppStore.getState().currentRole).toBe('tasker');
  });

  it('login screen renders after auth redirect', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Tasky-д тавтай морилно уу')).toBeTruthy();
    expect(screen.getByText('Facebook-ээр нэвтрэх')).toBeTruthy();
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
