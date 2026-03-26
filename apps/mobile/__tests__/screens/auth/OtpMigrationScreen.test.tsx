import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import OtpMigrationScreen from '../../../src/app/(auth)/otp-migration';

const mockLocalSearchParams = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), push: jest.fn() }),
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

describe('OtpMigrationScreen (SCR-SHARED-004)', () => {
  it('renders the default migration shell', () => {
    render(<OtpMigrationScreen />);

    expect(screen.getByText('Утасны дугаараа бүртгүүлнэ үү')).toBeTruthy();
    expect(screen.getByText(/утасны дугаараа баталгаажуулна уу/i)).toBeTruthy();
    expect(screen.getByTestId('otp-migration-phone-input')).toBeTruthy();
    expect(screen.getByTestId('otp-migration-submit-button')).toBeDisabled();
    expect(screen.getByTestId('otp-migration-skip-button')).toBeTruthy();
  });

  it('enables submit only after a valid 8-digit phone number', () => {
    render(<OtpMigrationScreen />);

    const input = screen.getByTestId('otp-migration-phone-input');
    fireEvent.changeText(input, '99112233');

    expect(screen.getByTestId('otp-migration-submit-button')).not.toBeDisabled();
  });

  it('renders a representative invalid-phone error state', () => {
    mockLocalSearchParams.mockReturnValue({ state: 'invalid_phone' });

    render(<OtpMigrationScreen />);

    expect(screen.getByText(/Утасны дугаар буруу байна/i)).toBeTruthy();
    expect(screen.getByTestId('otp-migration-submit-button')).toBeDisabled();
  });
});
