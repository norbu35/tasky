import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
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

describe('TaskerCreditsIndexScreen', () => {
  it('renders the default credits shell with the low balance alert', () => {
    const CreditsIndexScreen = require('../../../../src/app/(tasker)/credits/index').default;
    render(<CreditsIndexScreen />);

    expect(screen.getByTestId('tasker-credits-index')).toBeTruthy();
    expect(screen.getByText('Credits')).toBeTruthy();
    expect(screen.getByText('Balance running low')).toBeTruthy();
    expect(screen.getByText('Top up now')).toBeTruthy();
    expect(screen.getByText('View history')).toBeTruthy();
  });

  it('navigates to pay and history from the shell actions', () => {
    const CreditsIndexScreen = require('../../../../src/app/(tasker)/credits/index').default;
    render(<CreditsIndexScreen />);

    fireEvent.press(screen.getByTestId('tasker-credits-topup'));
    fireEvent.press(screen.getByTestId('tasker-credits-history'));

    expect(mockPush).toHaveBeenCalledWith('/(tasker)/credits/pay');
    expect(mockPush).toHaveBeenCalledWith('/(tasker)/credits/history');
  });
});
