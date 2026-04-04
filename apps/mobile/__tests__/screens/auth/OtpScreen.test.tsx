import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

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

    expect(screen.getByTestId('otp-heading')).toHaveTextContent('Код баталгаажуулах');
    expect(screen.getByTestId('otp-description')).toHaveTextContent(/9911\s+2233/);
    expect(screen.getByTestId('otp-description')).toHaveTextContent(/4 оронтой нууц код/);
    expect(screen.getAllByTestId('otp-code-cell')).toHaveLength(4);
    expect(screen.getByTestId('otp-code-input-field')).toBeTruthy();
    expect(screen.getByTestId('otp-resend-link')).toHaveTextContent('Код дахин илгээх (60с)');
    expect(screen.getByTestId('otp-security-card')).toBeTruthy();
    expect(screen.getByTestId('otp-fixed-cta')).toBeTruthy();
    expect(screen.getByTestId('otp-verify-button')).toBeDisabled();
  });

  it('enables verify after entering 4 digits', () => {
    render(<OtpScreen />);

    fireEvent.changeText(screen.getByTestId('otp-code-input-field'), '1234');

    expect(screen.getByTestId('otp-verify-button')).not.toBeDisabled();
  });

  it('renders a representative wrong-code error state', () => {
    mockLocalSearchParams.mockReturnValue({ state: 'wrong_code', phone: '9911 2233' });

    render(<OtpScreen />);

    expect(screen.getByText(/Буруу код/i)).toBeTruthy();
    expect(screen.getAllByTestId('otp-code-cell')).toHaveLength(4);
    expect(screen.getByTestId('otp-verify-button')).toBeDisabled();
  });
});
