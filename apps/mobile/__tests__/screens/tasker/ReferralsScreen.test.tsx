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

describe('TaskerReferralsScreen', () => {
  it('renders the referral shell and actions', () => {
    const ReferralsScreen = require('../../../src/app/(tasker)/referrals').default;
    render(<ReferralsScreen />);

    expect(screen.getByTestId('tasker-referrals-screen')).toBeTruthy();
    expect(screen.getByText('Referrals')).toBeTruthy();
    expect(screen.getByText('Invite a tasker')).toBeTruthy();
    expect(screen.getByText('Copy invite code')).toBeTruthy();
  });

  it('navigates to the credit top-up lane from the referral shell', () => {
    const ReferralsScreen = require('../../../src/app/(tasker)/referrals').default;
    render(<ReferralsScreen />);

    fireEvent.press(screen.getByTestId('tasker-referrals-view-credits'));

    expect(mockPush).toHaveBeenCalledWith('/(tasker)/credits');
  });
});
