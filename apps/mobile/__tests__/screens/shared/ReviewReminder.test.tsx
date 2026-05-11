import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockBottomSheet = React.forwardRef(function MockBottomSheet(props: any, ref: any) {
    React.useImperativeHandle(ref, () => ({
      snapToIndex: jest.fn(),
      close: jest.fn(),
    }));
    return <View {...props} />;
  });
  return {
    __esModule: true,
    default: MockBottomSheet,
    BottomSheetView: View,
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

const mockPush = jest.fn();
const mockOnDismiss = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
});

describe('ReviewReminder (SCR-SHARED-018)', () => {
  it('renders reminder text', () => {
    const { ReviewReminder } = require('../../../src/features/review/components/ReviewReminder');
    render(<ReviewReminder isOpen={true} onDismiss={mockOnDismiss} bookingId="booking-123" />);

    expect(screen.getByText('Туршлага ямар байсан бэ?')).toBeTruthy();
    expect(screen.getByText('Таны үнэлгээ нийгэмлэгт итгэлцэл бий болгоход тусалдаг')).toBeTruthy();
  });

  it('renders "Leave a Review" CTA button', () => {
    const { ReviewReminder } = require('../../../src/features/review/components/ReviewReminder');
    render(<ReviewReminder isOpen={true} onDismiss={mockOnDismiss} bookingId="booking-123" />);

    const cta = screen.getByText('Үнэлгээ үлдээх');
    expect(cta).toBeTruthy();
  });

  it('renders "Later" dismiss button', () => {
    const { ReviewReminder } = require('../../../src/features/review/components/ReviewReminder');
    render(<ReviewReminder isOpen={true} onDismiss={mockOnDismiss} bookingId="booking-123" />);

    const laterBtn = screen.getByText('Дараа нь');
    expect(laterBtn).toBeTruthy();

    fireEvent.press(laterBtn);
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('navigates to the shared review route with booking context', () => {
    const { ReviewReminder } = require('../../../src/features/review/components/ReviewReminder');
    render(<ReviewReminder isOpen={true} onDismiss={mockOnDismiss} bookingId="booking-123" />);

    fireEvent.press(screen.getByText('Үнэлгээ үлдээх'));

    expect(mockPush).toHaveBeenCalledWith('/(shared)/review/booking-123');
    expect(mockOnDismiss).toHaveBeenCalled();
  });
});
