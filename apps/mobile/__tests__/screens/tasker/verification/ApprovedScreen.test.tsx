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

describe('ApprovedScreen (SCR-TASK-008)', () => {
  it('renders "Verified!" headline', () => {
    const ApprovedScreen = require('../../../../src/app/(tasker)/verification/approved').default;
    render(<ApprovedScreen />);

    expect(screen.getByText('tasker.verification.approvedTitle')).toBeTruthy();
  });

  it('renders approval description', () => {
    const ApprovedScreen = require('../../../../src/app/(tasker)/verification/approved').default;
    render(<ApprovedScreen />);

    expect(screen.getByText('tasker.verification.approvedBody')).toBeTruthy();
  });

  it('renders next steps', () => {
    const ApprovedScreen = require('../../../../src/app/(tasker)/verification/approved').default;
    render(<ApprovedScreen />);

    expect(screen.getByTestId('approved-screen')).toBeTruthy();
  });

  it('CTA navigates to browse tasks via replace', () => {
    const ApprovedScreen = require('../../../../src/app/(tasker)/verification/approved').default;
    render(<ApprovedScreen />);

    fireEvent.press(screen.getByTestId('approved-screen-cta'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});
