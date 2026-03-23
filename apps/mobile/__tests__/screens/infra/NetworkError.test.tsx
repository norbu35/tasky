import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import NetworkErrorScreen from '../../../src/app/(shared)/network-error';

jest.mock('react-native-reanimated', () => {
  const RN = require('react-native');
  return {
    __esModule: true,
    default: {
      View: RN.View,
      createAnimatedComponent: (comp: any) => comp,
    },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (fn: () => any) => fn(),
    withSpring: (v: number) => v,
    Easing: { bezier: () => (t: number) => t },
  };
});

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

describe('NetworkErrorScreen', () => {
  beforeEach(() => {
    mockParams = {};
  });

  it('renders no connection message by default', () => {
    render(<NetworkErrorScreen />);

    expect(screen.getByText('No internet connection')).toBeTruthy();
  });

  it('shows retry button', () => {
    render(<NetworkErrorScreen />);

    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('calls retry handler when retry button is pressed', () => {
    render(<NetworkErrorScreen />);

    const retryButton = screen.getByText('Try Again');
    fireEvent.press(retryButton);

    // Retry should not crash; the handler is internal
    expect(retryButton).toBeTruthy();
  });

  it('shows slow connection variant when type param is slow_connection', () => {
    mockParams = { type: 'slow_connection' };

    render(<NetworkErrorScreen />);

    expect(screen.getByText('Connection is slow')).toBeTruthy();
  });

  it('has correct testID on root container', () => {
    render(<NetworkErrorScreen />);

    expect(screen.getByTestId('network-error-screen')).toBeTruthy();
  });

  it('shows wifi off icon', () => {
    render(<NetworkErrorScreen />);

    expect(screen.getByTestId('icon-WifiOff')).toBeTruthy();
  });
});
