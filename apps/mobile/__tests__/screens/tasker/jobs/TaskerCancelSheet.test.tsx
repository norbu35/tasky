import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

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

let mockIsPending = false;
const mockCancelBooking = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useCancelBooking', () => ({
  useCancelBooking: () => ({
    mutate: mockCancelBooking,
    mutateAsync: mockCancelBooking,
    get isPending() {
      return mockIsPending;
    },
  }),
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef(function MockBottomSheet({ children, index }: any, ref: any) {
      React.useImperativeHandle(ref, () => ({
        snapToIndex: jest.fn(),
        close: jest.fn(),
      }));
      if (index === -1) return null;
      return <View>{children}</View>;
    }),
    BottomSheetBackdrop: ({ children }: any) => <View>{children}</View>,
    BottomSheetView: ({ children }: any) => <View>{children}</View>,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
  mockIsPending = false;
});

describe('TaskerCancelSheet (SCR-TASK-015)', () => {
  it('shows strike warning text', () => {
    const {
      TaskerCancelSheet,
    } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
    render(
      <TaskerCancelSheet
        isOpen={true}
        onClose={jest.fn()}
        bookingId="booking-123"
        strikeCount={0}
      />,
    );

    expect(screen.getByText('Захиалга цуцлах уу?')).toBeTruthy();
    expect(
      screen.getByText(
        'Захиалга цуцлагдвал даалгавар дахин нээлттэй болно. Цуцлалт таны найдвартай байдлын үзүүлэлтэд нөлөөлнө.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Цуцлах шалтгаан')).toBeTruthy();
  });

  it('confirm button calls cancelBooking', () => {
    const {
      TaskerCancelSheet,
    } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
    render(
      <TaskerCancelSheet
        isOpen={true}
        onClose={jest.fn()}
        bookingId="booking-123"
        strikeCount={0}
      />,
    );

    fireEvent.press(screen.getByText('Цагийн хуваарь таарахгүй болсон'));
    fireEvent.press(screen.getByText('Цуцлахыг баталгаажуулах'));
    expect(mockCancelBooking).toHaveBeenCalled();
  });

  it('shows loading state when confirming', () => {
    mockIsPending = true;

    const {
      TaskerCancelSheet,
    } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
    render(
      <TaskerCancelSheet
        isOpen={true}
        onClose={jest.fn()}
        bookingId="booking-123"
        strikeCount={0}
      />,
    );

    expect(screen.getByTestId('cancel-sheet-loading')).toBeTruthy();
  });

  it('go back button calls onClose', () => {
    const onClose = jest.fn();
    const {
      TaskerCancelSheet,
    } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
    render(
      <TaskerCancelSheet isOpen={true} onClose={onClose} bookingId="booking-123" strikeCount={0} />,
    );

    fireEvent.press(screen.getByText('Буцах'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows suspension warning at 2 strikes', () => {
    const {
      TaskerCancelSheet,
    } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
    render(
      <TaskerCancelSheet
        isOpen={true}
        onClose={jest.fn()}
        bookingId="booking-123"
        strikeCount={2}
      />,
    );

    expect(
      screen.getByText(
        'Анхааруулга: Та сүүлийн 30 хоногт 2 удаа цуцалсан байна. Дахин нэг удаа цуцалвал таны бүртгэл 7 хоногоор түдгэлзэнэ!',
      ),
    ).toBeTruthy();
  });

  it('requires a reason before enabling confirm', () => {
    const onClose = jest.fn();
    const {
      TaskerCancelSheet,
    } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
    render(
      <TaskerCancelSheet isOpen={true} onClose={onClose} bookingId="booking-123" strikeCount={0} />,
    );

    fireEvent.press(screen.getByText('Цуцлахыг баталгаажуулах'));
    expect(mockCancelBooking).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Цагийн хуваарь таарахгүй болсон'));
    fireEvent.press(screen.getByText('Цуцлахыг баталгаажуулах'));
    expect(mockCancelBooking).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: 'booking-123' }),
    );
  });
});
