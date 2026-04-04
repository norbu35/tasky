import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
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

describe('PendingScreen (SCR-TASK-007)', () => {
  it('renders the under review heading', () => {
    const PendingScreen = require('../../../../src/app/(tasker)/verification/pending').default;
    render(<PendingScreen />);

    expect(screen.getByText('tasker.verification.pendingTitle')).toBeTruthy();
  });

  it('renders pending description with SLA info', () => {
    const PendingScreen = require('../../../../src/app/(tasker)/verification/pending').default;
    render(<PendingScreen />);

    expect(screen.getByText('tasker.verification.pendingBody')).toBeTruthy();
    expect(screen.getByText('tasker.verification.pendingSla')).toBeTruthy();
  });

  it('CTA navigates to browse tasks', () => {
    const PendingScreen = require('../../../../src/app/(tasker)/verification/pending').default;
    render(<PendingScreen />);

    fireEvent.press(screen.getByTestId('pending-screen-cta'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('shows the verification progress indicator', () => {
    const PendingScreen = require('../../../../src/app/(tasker)/verification/pending').default;
    render(<PendingScreen />);

    expect(screen.getByTestId('pending-progress')).toBeTruthy();
  });

  it('renders with correct testID', () => {
    const PendingScreen = require('../../../../src/app/(tasker)/verification/pending').default;
    render(<PendingScreen />);

    expect(screen.getByTestId('SCR-TASK-007')).toBeTruthy();
  });
});
