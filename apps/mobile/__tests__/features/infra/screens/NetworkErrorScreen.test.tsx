import { render, screen, fireEvent, act } from '@testing-library/react-native';
import React from 'react';

import NetworkErrorScreen from '../../../../src/features/infra/screens/NetworkErrorScreen';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';
const mockBack = jest.fn();

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
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

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
    jest.useFakeTimers();
    jest.clearAllMocks();
    resetTestI18n();
    setTestLanguage('mn');
    mockParams = {};
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders no connection message by default', () => {
    render(<NetworkErrorScreen />);

    expect(screen.getByText('Интернэт холболт байхгүй байна')).toBeTruthy();
    expect(screen.getByText('Сүлжээний холболтоо шалгаад дахин оролдоно уу')).toBeTruthy();
  });

  it('shows retry button', () => {
    render(<NetworkErrorScreen />);

    expect(screen.getByText('Дахин оролдох')).toBeTruthy();
  });

  it('shows retry loading and then restored toast when retry button is pressed', () => {
    render(<NetworkErrorScreen />);

    const retryButton = screen.getByText('Дахин оролдох');
    fireEvent.press(retryButton);
    expect(screen.getByTestId('network-error-screen-retry')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(3999);
    });

    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.getByText('Холболт сэргэлээ')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(mockBack).toHaveBeenCalled();
  });

  it('shows slow connection variant when type param is slow_connection', () => {
    mockParams = { type: 'slow_connection' };

    render(<NetworkErrorScreen />);

    expect(screen.getByText('Холболт удаан байна')).toBeTruthy();
    expect(screen.getByText('Сүлжээний холболт удаан байна. Түр хүлээнэ үү')).toBeTruthy();
  });

  it('has correct testID on root container', () => {
    render(<NetworkErrorScreen />);

    expect(screen.getByTestId('SCR-INFRA-001')).toBeTruthy();
  });

  it('shows wifi off icon', () => {
    render(<NetworkErrorScreen />);

    expect(screen.getByTestId('icon-WifiOff')).toBeTruthy();
  });
});
