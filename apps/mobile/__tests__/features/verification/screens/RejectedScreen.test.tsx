import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ reason: 'Photos are blurry' }),
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

describe('RejectedScreen (SCR-TASK-009)', () => {
  it('renders rejection heading', () => {
    const RejectedScreen =
      require('../../../../src/features/verification/screens/RejectedScreen').default;
    render(<RejectedScreen />);

    expect(screen.getByText('tasker.verification.rejectedTitle')).toBeTruthy();
  });

  it('shows rejection reason from search params', () => {
    const RejectedScreen =
      require('../../../../src/features/verification/screens/RejectedScreen').default;
    render(<RejectedScreen />);

    expect(screen.getByText('Photos are blurry')).toBeTruthy();
  });

  it('resubmit CTA navigates to upload screen', () => {
    const RejectedScreen =
      require('../../../../src/features/verification/screens/RejectedScreen').default;
    render(<RejectedScreen />);

    fireEvent.press(screen.getByTestId('rejected-screen-resubmit'));
    expect(mockPush).toHaveBeenCalledWith('/(tasker)/verification/upload');
  });

  it('renders rejection description', () => {
    const RejectedScreen =
      require('../../../../src/features/verification/screens/RejectedScreen').default;
    render(<RejectedScreen />);

    expect(screen.getByText('tasker.verification.rejectedBody')).toBeTruthy();
  });

  it('browse tasks CTA returns to the task feed', () => {
    const RejectedScreen =
      require('../../../../src/features/verification/screens/RejectedScreen').default;
    render(<RejectedScreen />);

    fireEvent.press(screen.getByTestId('rejected-screen-browse'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)');
  });
});
