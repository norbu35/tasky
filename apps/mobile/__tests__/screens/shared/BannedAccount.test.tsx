import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) => {
      const fb = typeof fallback === 'string' ? fallback : key;
      return fb;
    },
    i18n: { language: 'en' },
  }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

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
    { get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} /> },
  );
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BannedAccountScreen (SCR-SHARED-021)', () => {
  it('renders the banned message', () => {
    const BannedScreen = require('../../../src/app/(shared)/account/banned').default;
    render(<BannedScreen />);

    expect(screen.getByText('shared.account.bannedTitle')).toBeTruthy();
    expect(screen.getByText('shared.account.bannedBody')).toBeTruthy();
  });

  it('has no action buttons (terminal state)', () => {
    const BannedScreen = require('../../../src/app/(shared)/account/banned').default;
    render(<BannedScreen />);

    // No appeal, no retry - only the ban message
    expect(screen.queryByTestId('banned-screen-retry')).toBeNull();
    expect(screen.queryByText('shared.account.suspendedAppeal')).toBeNull();
  });

  it('has correct testID on root container', () => {
    const BannedScreen = require('../../../src/app/(shared)/account/banned').default;
    render(<BannedScreen />);

    expect(screen.getByTestId('banned-screen')).toBeTruthy();
  });
});
