import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
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

describe('ReviewHardLock (SCR-SHARED-019)', () => {
  it('renders the lock message', () => {
    const { ReviewHardLock } = require('../../../src/features/review/components/ReviewHardLock');
    render(<ReviewHardLock bookingId="booking-123" />);

    expect(screen.getByText('Үнэлгээ өгөх шаардлагатай')).toBeTruthy();
    expect(
      screen.getByText(
        'Та үргэлжлүүлэн ашиглахын тулд өмнөх захиалгын үнэлгээгээ өгөх шаардлагатай.',
      ),
    ).toBeTruthy();
  });

  it('has no dismiss option — no close or back button', () => {
    const { ReviewHardLock } = require('../../../src/features/review/components/ReviewHardLock');
    render(<ReviewHardLock bookingId="booking-123" />);

    expect(screen.queryByTestId('hard-lock-dismiss')).toBeNull();
    expect(screen.queryByTestId('hard-lock-back')).toBeNull();
  });

  it('renders the review CTA to resolve the lock', () => {
    const { ReviewHardLock } = require('../../../src/features/review/components/ReviewHardLock');
    render(<ReviewHardLock bookingId="booking-123" />);

    expect(screen.getByTestId('review-hard-lock')).toBeTruthy();
    expect(screen.getByText('Үнэлгээ өгөх')).toBeTruthy();
  });

  it('routes to the shared review screen when the CTA is tapped', () => {
    const { ReviewHardLock } = require('../../../src/features/review/components/ReviewHardLock');
    render(<ReviewHardLock bookingId="booking-123" />);

    fireEvent.press(screen.getByTestId('review-hard-lock-cta'));
    expect(mockPush).toHaveBeenCalledWith('/(shared)/review/booking-123');
  });
});
