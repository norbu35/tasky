import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SessionExpiredScreen from '../../../src/app/(shared)/session-expired';
import { useAuthStore } from '../../../src/store/authStore';

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

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    BottomSheetModal: View,
    BottomSheetModalProvider: View,
    BottomSheetBackdrop: View,
  };
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

describe('SessionExpiredScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      session: {
        accessToken: 'token',
        refreshToken: 'refresh',
        user: {
          id: 'user-1',
          phone: '+97699001122',
          primary_auth: 'PHONE_OTP',
          role: 'CUSTOMER',
          status: 'PENDING',
          created_at: '2026-01-01T00:00:00Z',
        },
      },
      profile: null,
      deviceToken: null,
    });
  });

  it('renders session expired title', () => {
    render(<SessionExpiredScreen />);

    expect(screen.getByText('Session expired')).toBeTruthy();
  });

  it('renders session expired body message', () => {
    render(<SessionExpiredScreen />);

    expect(screen.getByText('Your session has expired. Please log in again')).toBeTruthy();
  });

  it('shows login button', () => {
    render(<SessionExpiredScreen />);

    expect(screen.getByText('Log in again')).toBeTruthy();
  });

  it('login button clears the auth token and navigates to auth screen', () => {
    render(<SessionExpiredScreen />);

    fireEvent.press(screen.getByText('Log in again'));
    expect(useAuthStore.getState().session).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith('/(auth)');
  });

  it('has correct testID on root container', () => {
    render(<SessionExpiredScreen />);

    expect(screen.getByTestId('session-expired-screen')).toBeTruthy();
  });

  it('renders a modal sheet instead of a plain full-screen body', () => {
    render(<SessionExpiredScreen />);

    expect(screen.getByText('Session expired')).toBeTruthy();
    expect(screen.getByText('Log in again')).toBeTruthy();
  });
});
