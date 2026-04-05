import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import DanVerificationScreen from '../../../../src/app/(tasker)/verification/dan';

const mockPush = jest.fn();
const mockBack = jest.fn();

let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback || _key,
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
  mockParams = {};
});

describe('DanVerificationScreen (SCR-TASK-006)', () => {
  it('renders the default DAN fast-path shell', () => {
    render(<DanVerificationScreen />);

    expect(screen.getByTestId('dan-verification-screen')).toBeTruthy();
    expect(screen.getByText('Fast-track verification')).toBeTruthy();
    expect(
      screen.getByText(
        'E-Mongolia (DAN) will automatically verify your identity. No photos required.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Verify with E-Mongolia')).toBeTruthy();
    expect(screen.getByText('Verify manually')).toBeTruthy();
  });

  it('renders the success shell state', () => {
    mockParams = { state: 'success' };
    render(<DanVerificationScreen />);

    expect(screen.getByText('Verification successful!')).toBeTruthy();
    expect(
      screen.getByText(
        'Your address has been verified via E-Mongolia. You can now apply for tasks.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Find tasks')).toBeTruthy();
  });

  it('manual fallback routes to upload flow', () => {
    render(<DanVerificationScreen />);

    fireEvent.press(screen.getByTestId('dan-manual-fallback'));
    expect(mockPush).toHaveBeenCalledWith('/(tasker)/verification/upload');
  });
});
