import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

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

describe('ConsentScreen (SCR-TASK-004)', () => {
  it('renders consent heading and explanation text', () => {
    const ConsentScreen = require('../../../../src/app/(tasker)/verification/consent').default;
    render(<ConsentScreen />);

    expect(screen.getAllByText('tasker.verification.consentTitle').length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getByText('tasker.verification.consentBody')).toBeTruthy();
  });

  it('renders privacy policy link', () => {
    const ConsentScreen = require('../../../../src/app/(tasker)/verification/consent').default;
    render(<ConsentScreen />);

    expect(screen.getByTestId('consent-privacy-link')).toBeTruthy();
  });

  it('CTA is disabled until the user scrolls through the consent content', () => {
    const ConsentScreen = require('../../../../src/app/(tasker)/verification/consent').default;
    render(<ConsentScreen />);

    const cta = screen.getByTestId('consent-screen-cta');
    expect(cta).toBeDisabled();
  });

  it('scrolling to the end enables the CTA', async () => {
    const ConsentScreen = require('../../../../src/app/(tasker)/verification/consent').default;
    render(<ConsentScreen />);

    fireEvent.scroll(screen.getByTestId('consent-scroll'), {
      nativeEvent: {
        contentOffset: { y: 9999 },
        layoutMeasurement: { height: 400 },
        contentSize: { height: 4000 },
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('consent-screen-cta')).not.toBeDisabled();
    });
  });

  it('CTA navigates to upload screen after the scroll gate is satisfied', async () => {
    const ConsentScreen = require('../../../../src/app/(tasker)/verification/consent').default;
    render(<ConsentScreen />);

    fireEvent.scroll(screen.getByTestId('consent-scroll'), {
      nativeEvent: {
        contentOffset: { y: 9999 },
        layoutMeasurement: { height: 400 },
        contentSize: { height: 4000 },
      },
    });
    await waitFor(() => {
      expect(screen.getByTestId('consent-screen-cta')).not.toBeDisabled();
    });
    fireEvent.press(screen.getByTestId('consent-screen-cta'));

    expect(mockPush).toHaveBeenCalledWith('/(tasker)/verification/upload');
  });

  it('privacy policy link opens the privacy route', () => {
    const ConsentScreen = require('../../../../src/app/(tasker)/verification/consent').default;
    render(<ConsentScreen />);

    fireEvent.press(screen.getByTestId('consent-privacy-link'));
    expect(mockPush).toHaveBeenCalledWith('/(shared)/legal/privacy');
  });

  it('back button calls router.back', () => {
    const ConsentScreen = require('../../../../src/app/(tasker)/verification/consent').default;
    render(<ConsentScreen />);

    fireEvent.press(screen.getByTestId('consent-screen-back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
