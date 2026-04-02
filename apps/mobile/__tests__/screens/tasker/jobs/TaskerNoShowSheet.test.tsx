import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react-native';

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

const mockFlagNoShow = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useFlagNoShow', () => ({
  useFlagNoShow: () => ({
    mutate: mockFlagNoShow,
    mutateAsync: mockFlagNoShow,
    isPending: false,
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
});

describe('TaskerNoShowSheet (SCR-TASK-014)', () => {
  it('shows reminder content at 10min past schedule', () => {
    const {
      TaskerNoShowSheet,
    } = require('../../../../src/features/bookings/components/TaskerNoShowSheet');
    render(
      <TaskerNoShowSheet
        isOpen={true}
        onClose={jest.fn()}
        bookingId="booking-123"
        minutesPastSchedule={10}
      />,
    );

    expect(screen.getByText('Захиалагчтайгаа уулзсан уу?')).toBeTruthy();
  });

  it('shows flag button available at 15min past schedule', () => {
    const {
      TaskerNoShowSheet,
    } = require('../../../../src/features/bookings/components/TaskerNoShowSheet');
    render(
      <TaskerNoShowSheet
        isOpen={true}
        onClose={jest.fn()}
        bookingId="booking-123"
        minutesPastSchedule={15}
      />,
    );

    expect(screen.getByText('Ирээгүй гэж тэмдэглэх')).toBeTruthy();
  });

  it('flag button calls flagNoShow', () => {
    const {
      TaskerNoShowSheet,
    } = require('../../../../src/features/bookings/components/TaskerNoShowSheet');
    render(
      <TaskerNoShowSheet
        isOpen={true}
        onClose={jest.fn()}
        bookingId="booking-123"
        minutesPastSchedule={15}
      />,
    );

    fireEvent.press(screen.getByText('Ирээгүй гэж тэмдэглэх'));
    expect(mockFlagNoShow).toHaveBeenCalledWith({ bookingId: 'booking-123' });
  });

  it('shows wait button to dismiss', () => {
    const onClose = jest.fn();
    const {
      TaskerNoShowSheet,
    } = require('../../../../src/features/bookings/components/TaskerNoShowSheet');
    render(
      <TaskerNoShowSheet
        isOpen={true}
        onClose={onClose}
        bookingId="booking-123"
        minutesPastSchedule={15}
      />,
    );

    expect(screen.getByText('Хүлээх')).toBeTruthy();
    fireEvent.press(screen.getByText('Хүлээх'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows success confirmation after flagging', async () => {
    mockFlagNoShow.mockResolvedValueOnce(undefined);
    const {
      TaskerNoShowSheet,
    } = require('../../../../src/features/bookings/components/TaskerNoShowSheet');
    render(
      <TaskerNoShowSheet
        isOpen={true}
        onClose={jest.fn()}
        bookingId="booking-123"
        minutesPastSchedule={15}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByText('Ирээгүй гэж тэмдэглэх'));
      await Promise.resolve();
    });
    expect(screen.getByText('Ирээгүй тэмдэглэгдлээ')).toBeTruthy();
  });
});
