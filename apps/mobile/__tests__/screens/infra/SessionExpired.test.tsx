import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';
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

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

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
    resetTestI18n();
    setTestLanguage('mn');
    useAuthStore.setState({
      session: {
        accessToken: 'token',
        refreshToken: 'refresh',
        user: {
          id: 'user-1',
          phone: '+97699001122',
          primary_auth: 'FACEBOOK',
          role: 'CUSTOMER',
          status: 'PENDING',
          created_at: '2026-01-01T00:00:00Z',
        },
      },
    });
  });

  it('renders session expired title', () => {
    render(<SessionExpiredScreen />);

    expect(screen.getByText('Сесс дууссан')).toBeTruthy();
  });

  it('renders session expired body message', () => {
    render(<SessionExpiredScreen />);

    expect(screen.getByText('Таны нэвтрэх хугацаа дууссан байна. Дахин нэвтэрнэ үү')).toBeTruthy();
  });

  it('shows login button', () => {
    render(<SessionExpiredScreen />);

    expect(screen.getByText('Нэвтрэх')).toBeTruthy();
  });

  it('login button clears the auth token and navigates to auth screen', () => {
    render(<SessionExpiredScreen />);

    fireEvent.press(screen.getByText('Нэвтрэх'));
    expect(useAuthStore.getState().session).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith('/(auth)');
  });

  it('has correct testID on root container', () => {
    render(<SessionExpiredScreen />);

    expect(screen.getByTestId('SCR-INFRA-003')).toBeTruthy();
  });

  it('renders a modal sheet instead of a plain full-screen body', () => {
    render(<SessionExpiredScreen />);

    expect(screen.getByText('Сесс дууссан')).toBeTruthy();
    expect(screen.getByText('Нэвтрэх')).toBeTruthy();
  });
});
