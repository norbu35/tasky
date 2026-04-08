import React from 'react';
import { Dimensions, FlatList, StyleSheet } from 'react-native';
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
  it('renders the first slide content from Figma', () => {
    render(<OnboardingScreen />);
    expect(screen.getByText('Найдвартай гүйцэтгэгч олох')).toBeTruthy();
    expect(screen.getByText('Баталгаажсан, итгэлтэй гүйцэтгэгчидтэй холбогдоорой')).toBeTruthy();
  });

  it('renders a hero illustration and compact dash pagination', () => {
    render(<OnboardingScreen />);

    // Pagination dots are rendered with inline styles (not NativeWind className)
    const activeDash = StyleSheet.flatten(screen.getByTestId('pagination-dot-0').props.style);
    const inactiveDash = StyleSheet.flatten(screen.getByTestId('pagination-dot-1').props.style);

    expect(activeDash.width).toBeLessThan(20);
    expect(activeDash.height).toBeLessThan(6);
    expect(inactiveDash.width).toBeLessThan(12);
    expect(inactiveDash.height).toBeLessThan(6);
  });

  it('shows Skip button on first slide', () => {
    render(<OnboardingScreen />);
    expect(screen.getByTestId('onboarding-skip')).toBeTruthy();
  });

  it('renders the Figma top bar skip label', () => {
    render(<OnboardingScreen />);
    expect(screen.getByText('Алгасах')).toBeTruthy();
  });

  it('skip navigates to role selection', () => {
    render(<OnboardingScreen />);
    fireEvent.press(screen.getByTestId('onboarding-skip'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/role-select');
  });

  it('does not mark onboarding complete before the permission primer flow finishes', () => {
    render(<OnboardingScreen />);
    fireEvent.press(screen.getByTestId('onboarding-skip'));
    expect(useAppStore.getState().hasSeenOnboarding).toBe(false);
  });

  it('hides Skip on the final slide and switches the CTA label', () => {
    render(<OnboardingScreen />);

    fireEvent.scroll(screen.UNSAFE_getByType(FlatList), {
      nativeEvent: {
        contentOffset: { x: Dimensions.get('window').width * 2, y: 0 },
        contentSize: { width: Dimensions.get('window').width * 3, height: 0 },
        layoutMeasurement: { width: Dimensions.get('window').width, height: 0 },
      },
    });

    expect(screen.queryByTestId('onboarding-skip')).toBeNull();
    expect(screen.getByText('Эхлэх')).toBeTruthy();
  });

  it('shows Next button on first slide', () => {
    render(<OnboardingScreen />);
    expect(screen.getByTestId('onboarding-next')).toHaveTextContent('Дараагийх');
  });

  it('has a testID on the screen container', () => {
    render(<OnboardingScreen />);
    expect(screen.getByTestId('SCR-SHARED-005')).toBeTruthy();
  });
});
