import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import OtpMigrationScreen from '../../../src/app/(auth)/otp-migration';

const mockLocalSearchParams = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: mockReplace, push: mockPush }),
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
    expect(screen.getByText('Аюулгүй байдлыг сайжруулахын тулд утасны дугаараа нэмнэ үү')).toBeTruthy();
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

  it('submits a valid phone number into the OTP verification flow', () => {
    render(<OtpMigrationScreen />);

    fireEvent.changeText(screen.getByTestId('otp-migration-phone-input'), '99112233');
    fireEvent.press(screen.getByTestId('otp-migration-submit-button'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(auth)/otp',
      params: { phone: '99112233' },
    });
  });

  it('renders a representative invalid-phone error state', () => {
    mockLocalSearchParams.mockReturnValue({ state: 'invalid_phone' });

    render(<OtpMigrationScreen />);

    expect(screen.getByText(/Утасны дугаар буруу байна/i)).toBeTruthy();
    expect(screen.getByTestId('otp-migration-submit-button')).toBeDisabled();
  });

  it('hides the helper copy and skip action while verifying', () => {
    mockLocalSearchParams.mockReturnValue({ state: 'verifying', phone: '99112233' });

    render(<OtpMigrationScreen />);

    expect(
      screen.queryByText('Аюулгүй байдлыг сайжруулахын тулд утасны дугаараа нэмнэ үү'),
    ).toBeNull();
    expect(screen.queryByTestId('otp-migration-skip-button')).toBeNull();
    expect(screen.getByTestId('otp-migration-submit-button')).toBeDisabled();
  });

  it('renders a recoverable network error state', () => {
    mockLocalSearchParams.mockReturnValue({ state: 'error_network', phone: '99112233' });

    render(<OtpMigrationScreen />);

    expect(screen.getByText('Интернэт холболтоо шалгана уу')).toBeTruthy();
    expect(screen.getByTestId('otp-migration-submit-button')).not.toBeDisabled();
  });

  it('skip returns the user to the task feed shell', () => {
    render(<OtpMigrationScreen />);

    fireEvent.press(screen.getByTestId('otp-migration-skip-button'));

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});
