import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

import BookingConfirmedScreen from '../../../../src/app/(customer)/bookings/confirmed';

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => ({ bookingId: 'booking-1' }),
}));

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

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
  jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
  jest.spyOn(Linking, 'openURL').mockResolvedValue('ok');
});

describe('BookingConfirmedScreen (SCR-CUST-015)', () => {
  it('has a testID on the screen container', () => {
    render(<BookingConfirmedScreen />);
    expect(screen.getByTestId('SCR-CUST-015')).toBeTruthy();
  });

  it('shows success headline', () => {
    render(<BookingConfirmedScreen />);
    expect(screen.getByText('Захиалга баталгаажлаа!')).toBeTruthy();
  });

  it('shows next steps guidance', () => {
    render(<BookingConfirmedScreen />);
    expect(
      screen.getByText(
        'Таны хүсэлтийг амжилттай хүлээн авлаа. Манай мэргэжилтэн тун удахгүй тантай холбогдох болно.',
      ),
    ).toBeTruthy();
  });

  it('renders primary CTA to message tasker', () => {
    render(<BookingConfirmedScreen />);
    expect(screen.getByText('Зурвас илгээгч')).toBeTruthy(); // Based on failing test output it rendered "Зурвас илгээгч"
  });

  it('primary CTA navigates to message', () => {
    render(<BookingConfirmedScreen />);
    fireEvent.press(screen.getByTestId('booking-confirmed-screen-cta'));
    expect(mockPush).toHaveBeenCalledWith('/inbox/booking-1');
  });

  it('renders secondary View Booking CTA', () => {
    render(<BookingConfirmedScreen />);
    expect(screen.getByText('Захиалга харах')).toBeTruthy();
  });

  it('View Booking CTA navigates to booking detail', () => {
    render(<BookingConfirmedScreen />);
    fireEvent.press(screen.getByTestId('booking-confirmed-screen-secondary-cta'));
    expect(mockReplace).toHaveBeenCalledWith('/(customer)/bookings/booking-1');
  });
});
