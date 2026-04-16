import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

import { CustomerCancelSheet } from '../../../../src/features/bookings/components/CustomerCancelSheet';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ bookingId: 'booking-123' }),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
});

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockBottomSheet = React.forwardRef(function MockBottomSheet(
    { children, ...props }: any,
    ref: any,
  ) {
    React.useImperativeHandle(ref, () => ({
      snapToIndex: jest.fn(),
      close: jest.fn(),
    }));
    return <View {...props}>{children}</View>;
  });
  MockBottomSheet.displayName = 'MockBottomSheet';
  return {
    __esModule: true,
    default: MockBottomSheet,
    BottomSheetView: View,
    BottomSheetBackdrop: View,
  };
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

const mockCancelBooking = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useCancelBooking', () => ({
  useCancelBooking: () => ({
    mutateAsync: mockCancelBooking,
    isPending: false,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
});

describe('CustomerCancelSheet (SCR-CUST-022)', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    bookingId: 'booking-123',
    cancelType: 'free_cancel' as const,
  };

  it('has a testID on the container', () => {
    render(<CustomerCancelSheet {...defaultProps} />);
    expect(screen.getByTestId('customer-cancel-sheet')).toBeTruthy();
  });

  it('shows title "Cancel Booking"', () => {
    render(<CustomerCancelSheet {...defaultProps} />);
    expect(screen.getAllByText('Захиалга цуцлах').length).toBeGreaterThanOrEqual(1);
  });

  it('shows free cancel copy when cancelType is free_cancel', () => {
    render(<CustomerCancelSheet {...defaultProps} cancelType="free_cancel" />);
    expect(screen.getByText('Та энэ захиалгыг торгуулгүйгээр цуцлах боломжтой.')).toBeTruthy();
  });

  it('shows late cancel warning when cancelType is late_cancel_warning', () => {
    render(<CustomerCancelSheet {...defaultProps} cancelType="late_cancel_warning" />);
    expect(
      screen.getByText(
        'Товлосон цаг хүртэл 4 цагаас бага хугацаа үлдлээ. Энэ цуцлалт таны найдвартай байдлын бүртгэлд тэмдэглэгдэнэ.',
      ),
    ).toBeTruthy();
  });

  it('shows cancellation policy note', () => {
    render(<CustomerCancelSheet {...defaultProps} />);
    expect(
      screen.getByText(
        'Цуцлалтын бодлого: 4+ цагийн өмнө — торгуулгүй. 4 цагийн дотор — найдвартай байдлын зөрчил.',
      ),
    ).toBeTruthy();
  });

  it('confirm button calls cancelBooking with idempotency key', async () => {
    mockCancelBooking.mockResolvedValue({ id: 'booking-123', status: 'CANCELLED' });
    render(<CustomerCancelSheet {...defaultProps} />);
    fireEvent.press(screen.getByTestId('cancel-confirm-btn'));
    await waitFor(() => {
      expect(mockCancelBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: 'booking-123',
          idempotencyKey: expect.any(String),
        }),
      );
    });
  });

  it('Go Back button closes the sheet', () => {
    const onClose = jest.fn();
    render(<CustomerCancelSheet {...defaultProps} onClose={onClose} />);
    fireEvent.press(screen.getByText('Буцах'));
    expect(onClose).toHaveBeenCalled();
  });
});
