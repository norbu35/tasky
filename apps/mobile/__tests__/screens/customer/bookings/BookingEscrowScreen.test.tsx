import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

let mockParams: Record<string, string> = { bookingId: 'booking-1' };
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
  mockParams = { bookingId: 'booking-1' };
});

describe('BookingEscrowScreen (SCR-P3-003)', () => {
  it('shows the default opt-in escrow shell', () => {
    const BookingEscrowScreen =
      require('../../../../src/app/(customer)/bookings/[bookingId]/escrow').default;
    render(<BookingEscrowScreen />);

    expect(screen.getByTestId('booking-escrow-screen')).toBeTruthy();
    expect(screen.getByText('Escrow Payment')).toBeTruthy();
    expect(screen.getByText('Use Escrow')).toBeTruthy();
    expect(screen.getByText('Money protection')).toBeTruthy();
    expect(screen.getByText('Dispute resolution')).toBeTruthy();
    expect(screen.getByText('Automatic transfer')).toBeTruthy();
  });

  it('opens a confirmation sheet before confirming escrow', () => {
    const BookingEscrowScreen =
      require('../../../../src/app/(customer)/bookings/[bookingId]/escrow').default;
    render(<BookingEscrowScreen />);

    fireEvent.press(screen.getByTestId('booking-escrow-screen-cta'));
    expect(screen.getByText('Confirm')).toBeTruthy();
    expect(screen.getByText('Use Escrow')).toBeTruthy();
  });

  it('shows the demo error state when requested', () => {
    mockParams = { bookingId: 'booking-1', demoState: 'error' };
    const BookingEscrowScreen =
      require('../../../../src/app/(customer)/bookings/[bookingId]/escrow').default;
    render(<BookingEscrowScreen />);

    expect(screen.getByTestId('booking-escrow-screen-error')).toBeTruthy();
    expect(screen.getByText('Payment failed')).toBeTruthy();
  });

  it('lands on the success state after confirming escrow', async () => {
    const BookingEscrowScreen =
      require('../../../../src/app/(customer)/bookings/[bookingId]/escrow').default;
    render(<BookingEscrowScreen />);

    fireEvent.press(screen.getByTestId('booking-escrow-screen-cta'));
    fireEvent.press(screen.getByTestId('booking-escrow-confirm'));

    await waitFor(() => {
      expect(screen.getByText('Escrow successful!')).toBeTruthy();
    });
  });
});
