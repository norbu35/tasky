import React from 'react';
import { render, screen } from '@testing-library/react-native';

const mockBack = jest.fn();
let mockRouteParams: { state?: string } = { state: undefined };

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
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

describe('TaskerCreditsPayScreen', () => {
  it('renders the default top-up shell', () => {
    const CreditsPayScreen = require('../../../../src/app/(tasker)/credits/pay').default;
    render(<CreditsPayScreen />);

    expect(screen.getByTestId('tasker-credits-pay')).toBeTruthy();
    expect(screen.getByText('Choose an amount')).toBeTruthy();
    expect(screen.getByText('20,000 ₮')).toBeTruthy();
    expect(screen.getByText('Confirm top up')).toBeTruthy();
  });

  it('renders the representative error state when state is error', () => {
    mockRouteParams = { state: 'error' };
    const CreditsPayScreen = require('../../../../src/app/(tasker)/credits/pay').default;
    render(<CreditsPayScreen />);

    expect(screen.getByTestId('tasker-credits-pay-error')).toBeTruthy();
    expect(screen.getByText('Could not load top-up options')).toBeTruthy();
  });
});
