import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      return typeof fallback === 'string' ? fallback : key;
    },
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
});

describe('VerificationIndex (SCR-TASK-003)', () => {
  it('renders the verification gate copy', () => {
    const VerificationIndex = require('../../../../src/app/(tasker)/verification/index').default;
    render(<VerificationIndex />);

    expect(screen.getByText('tasker.verification.gateTitle')).toBeTruthy();
    expect(screen.getByText('tasker.verification.gateBody')).toBeTruthy();
  });

  it('starts the verification flow from the gate', () => {
    const VerificationIndex = require('../../../../src/app/(tasker)/verification/index').default;
    render(<VerificationIndex />);

    fireEvent.press(screen.getByText('tasker.verification.gateCta'));
    expect(mockPush).toHaveBeenCalledWith('/(tasker)/verification/consent');
  });

  it('returns to the previous screen from maybe later', () => {
    const VerificationIndex = require('../../../../src/app/(tasker)/verification/index').default;
    render(<VerificationIndex />);

    fireEvent.press(screen.getByTestId('verification-gate-secondary-cta'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
