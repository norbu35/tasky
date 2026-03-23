import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useAppStore } from '../../../src/store/appStore';

import OnboardingScreen from '../../../src/app/onboarding';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en', changeLanguage: jest.fn() },
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

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

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

beforeEach(() => {
  jest.clearAllMocks();
  useAppStore.setState({ hasSeenOnboarding: false, currentRole: 'customer' });
});

describe('OnboardingScreen (SCR-SHARED-005)', () => {
  it('renders the first slide content', () => {
    render(<OnboardingScreen />);
    expect(screen.getByText('auth.onboarding.slide1Title')).toBeTruthy();
    expect(screen.getByText('auth.onboarding.slide1Body')).toBeTruthy();
  });

  it('shows 3 pagination dots', () => {
    render(<OnboardingScreen />);
    expect(screen.getByTestId('pagination-dot-0')).toBeTruthy();
    expect(screen.getByTestId('pagination-dot-1')).toBeTruthy();
    expect(screen.getByTestId('pagination-dot-2')).toBeTruthy();
  });

  it('shows Skip button on first slide', () => {
    render(<OnboardingScreen />);
    expect(screen.getByTestId('onboarding-skip')).toBeTruthy();
  });

  it('skip navigates to role selection', () => {
    render(<OnboardingScreen />);
    fireEvent.press(screen.getByTestId('onboarding-skip'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/role-select');
  });

  it('shows Next button on first slide', () => {
    render(<OnboardingScreen />);
    expect(screen.getByTestId('onboarding-next')).toBeTruthy();
  });

  it('has a testID on the screen container', () => {
    render(<OnboardingScreen />);
    expect(screen.getByTestId('onboarding-screen')).toBeTruthy();
  });
});
