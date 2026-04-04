import React from 'react';
import { render, screen } from '@testing-library/react-native';

let mockRouteParams: { state?: string } = { state: undefined };

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockRouteParams,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>) =>
      typeof fallback === 'string' ? fallback : key,
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

describe('TaskerCreditsHistoryScreen', () => {
  it('renders the default transaction history shell', () => {
    const CreditsHistoryScreen = require('../../../../src/app/(tasker)/credits/history').default;
    render(<CreditsHistoryScreen />);

    expect(screen.getByTestId('SCR-P2-003')).toBeTruthy();
    expect(screen.getByText('Top-up')).toBeTruthy();
    expect(screen.getByText('Task payout')).toBeTruthy();
  });

  it('renders the representative empty state when state is empty', () => {
    mockRouteParams = { state: 'empty' };
    const CreditsHistoryScreen = require('../../../../src/app/(tasker)/credits/history').default;
    render(<CreditsHistoryScreen />);

    expect(screen.getByTestId('tasker-credits-history-empty')).toBeTruthy();
    expect(screen.getByText('No credit activity yet')).toBeTruthy();
  });
});
