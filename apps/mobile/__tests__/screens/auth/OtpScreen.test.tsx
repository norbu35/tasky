import React from 'react';
import { render, screen } from '@testing-library/react-native';

import OtpScreen from '../../../src/app/(auth)/otp';

const mockBack = jest.fn();
const mockLocalSearchParams = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => mockLocalSearchParams(),
}));

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
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

beforeEach(() => {
  jest.clearAllMocks();
  mockLocalSearchParams.mockReturnValue({});
});

describe('OtpScreen (SCR-SHARED-003)', () => {
  it('renders the default OTP shell', () => {
    render(<OtpScreen />);

    expect(screen.getByTestId('otp-heading')).toHaveTextContent('Баталгаажуулах код');
    expect(screen.getByTestId('otp-description')).toHaveTextContent(/9911\s+2233/);
    expect(screen.getByTestId('otp-description')).toHaveTextContent(/4 оронтой нууц код/);
    expect(screen.getByTestId('otp-code-input')).toBeTruthy();
    expect(screen.getByTestId('otp-verify-button')).toBeDisabled();
    expect(screen.getByTestId('otp-resend-button')).toBeTruthy();
    expect(screen.getByTestId('otp-back-button')).toBeTruthy();
  });

  it('renders a representative wrong-code error state', () => {
    mockLocalSearchParams.mockReturnValue({ state: 'wrong_code', phone: '9911 2233' });

    render(<OtpScreen />);

    expect(screen.getByText(/Буруу код/i)).toBeTruthy();
    expect(screen.getByTestId('otp-code-input')).toBeTruthy();
    expect(screen.getByTestId('otp-verify-button')).toBeDisabled();
  });
});
