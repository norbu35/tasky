import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import BookingConfirmedScreen from '../../../../src/app/(customer)/bookings/confirmed';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => ({ bookingId: 'booking-1' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fb?: string) => fb || key,
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

describe('BookingConfirmedScreen (SCR-CUST-015)', () => {
  it('has a testID on the screen container', () => {
    render(<BookingConfirmedScreen />);
    expect(screen.getByTestId('booking-confirmed-screen')).toBeTruthy();
  });

  it('shows success headline', () => {
    render(<BookingConfirmedScreen />);
    expect(screen.getByText('Захиалга баталгаажлаа!')).toBeTruthy();
  });

  it('shows next steps guidance', () => {
    render(<BookingConfirmedScreen />);
    expect(
      screen.getByText('Таны хүсэлтийг амжилттай хүлээн авлаа. Манай мэргэжилтэн тун удахгүй тантай холбогдох болно.'),
    ).toBeTruthy();
  });

  it('renders primary CTA to view booking', () => {
    render(<BookingConfirmedScreen />);
    expect(screen.getByText('Захиалга харах')).toBeTruthy();
  });

  it('primary CTA navigates to booking detail', () => {
    render(<BookingConfirmedScreen />);
    fireEvent.press(screen.getByTestId('booking-confirmed-screen-cta'));
    expect(mockReplace).toHaveBeenCalledWith('/(customer)/bookings/booking-1');
  });

  it('renders secondary Done CTA', () => {
    render(<BookingConfirmedScreen />);
    expect(screen.getByText('Дууслаа')).toBeTruthy();
  });

  it('Done CTA navigates to bookings list', () => {
    render(<BookingConfirmedScreen />);
    fireEvent.press(screen.getByTestId('booking-confirmed-screen-secondary-cta'));
    expect(mockReplace).toHaveBeenCalledWith('/(customer)/bookings');
  });
});
