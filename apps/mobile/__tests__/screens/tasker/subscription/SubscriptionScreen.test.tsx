import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

let mockParams: Record<string, string> = {};
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => mockParams,
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

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef(function MockBottomSheet({ children, index }: any, ref: any) {
      React.useImperativeHandle(ref, () => ({ snapToIndex: jest.fn(), close: jest.fn() }));
      if (index === -1) return null;
      return <View>{children}</View>;
    }),
    BottomSheetBackdrop: ({ children }: any) => <View>{children}</View>,
    BottomSheetView: ({ children }: any) => <View>{children}</View>,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
});

describe('SubscriptionScreen (SCR-P3-004)', () => {
  it('shows the default plan shell', () => {
    const SubscriptionScreen = require('../../../../src/app/(tasker)/subscription').default;
    render(<SubscriptionScreen />);

    expect(screen.getByTestId('subscription-screen')).toBeTruthy();
    expect(screen.getByText('Tasker Pro')).toBeTruthy();
    expect(screen.getByText('Become a Tasker Pro')).toBeTruthy();
    expect(screen.getByText('Standard')).toBeTruthy();
    expect(screen.getByText('Premium')).toBeTruthy();
    expect(screen.getByText('Subscribe')).toBeTruthy();
  });

  it('shows the confirmation sheet and active success state after subscribe', async () => {
    const SubscriptionScreen = require('../../../../src/app/(tasker)/subscription').default;
    render(<SubscriptionScreen />);

    fireEvent.press(screen.getByTestId('subscription-screen-cta'));
    expect(screen.getByText('Confirm')).toBeTruthy();

    fireEvent.press(screen.getByTestId('subscription-confirm'));

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeTruthy();
    });
  });

  it('lets the user dismiss the confirmation sheet without subscribing', () => {
    const SubscriptionScreen = require('../../../../src/app/(tasker)/subscription').default;
    render(<SubscriptionScreen />);

    fireEvent.press(screen.getByTestId('subscription-screen-cta'));
    expect(screen.getByTestId('subscription-confirm-sheet')).toBeTruthy();

    fireEvent.press(screen.getByText('Cancel'));

    expect(screen.queryByTestId('subscription-confirm-sheet')).toBeNull();
    expect(screen.getByTestId('subscription-screen-cta')).toBeTruthy();
  });

  it('shows the locked demo state when requested', () => {
    mockParams = { demoState: 'locked' };
    const SubscriptionScreen = require('../../../../src/app/(tasker)/subscription').default;
    render(<SubscriptionScreen />);

    expect(screen.getByTestId('subscription-screen-locked')).toBeTruthy();
    expect(screen.getByText('Not eligible')).toBeTruthy();
  });
});
