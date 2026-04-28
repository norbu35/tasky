import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';

import LoginScreen from '../../../src/app/(auth)/index';

const mockReplace = jest.fn();
const mockDevLoginMutate = jest.fn();

jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text testID="redirect">{href}</Text>,
    useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
    router: { replace: jest.fn() },
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

jest.mock('../../../src/features/auth/hooks/useAuth', () => {
  const actual = jest.requireActual('../../../src/features/auth/hooks/useAuth');
  return {
    ...actual,
    useDevLogin: () => ({
      mutate: mockDevLoginMutate,
      isPending: false,
      error: null,
    }),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
});

describe('LoginScreen (SCR-SHARED-002)', () => {
  it('uses the seeded customer persona for dev quick login', () => {
    process.env['EXPO_PUBLIC_DEV_AUTH_ENABLED'] = 'true';

    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId('dev-login-customer'));

    expect(mockDevLoginMutate).toHaveBeenCalledWith({
      phone: '+97692000002',
      role: 'CUSTOMER',
    });
  });

  it('uses the seeded tasker persona for dev quick login', () => {
    process.env['EXPO_PUBLIC_DEV_AUTH_ENABLED'] = 'true';

    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId('dev-login-tasker'));

    expect(mockDevLoginMutate).toHaveBeenCalledWith({
      phone: '+97693000001',
      role: 'TASKER',
    });
  });

  it('renders the Figma login title', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Tasky-д тавтай морилно уу')).toBeTruthy();
  });

  it('renders the Figma login subtitle', () => {
    render(<LoginScreen />);
    expect(
      screen.getByText('Найдвартай гүйцэтгэгчтэй холбогдож, ажлаа хялбар захиалаарай'),
    ).toBeTruthy();
  });

  it('renders the Facebook login button copy from Figma', () => {
    render(<LoginScreen />);
    expect(screen.getByTestId('facebook-login-button')).toBeTruthy();
    expect(screen.getByText('Facebook-ээр нэвтрэх')).toBeTruthy();
  });

  it('hides the Phase 2 OTP login CTA in the default auth state', () => {
    render(<LoginScreen />);
    expect(screen.queryByTestId('secondary-login-button')).toBeNull();
    expect(screen.queryByText('Утасны дугаараар нэвтрэх')).toBeNull();
  });

  it('shows error state on login failure', async () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId('facebook-login-button'));
    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toBeTruthy();
    });
  });

  it('displays the auth hero badge icon container', () => {
    render(<LoginScreen />);
    expect(screen.getByTestId('SCR-SHARED-002')).toBeTruthy();
  });

  it('renders the Figma footer links', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Үйлчилгээний нөхцөл')).toBeTruthy();
    expect(screen.getByText('Нууцлалын бодлого')).toBeTruthy();
    expect(screen.getByText('© 2026 Tasky. Бүх эрх хуулиар хамгаалагдсан.')).toBeTruthy();
  });
});
