import React from 'react';
import { render, screen } from '@testing-library/react-native';

import EscrowScreen from '../../../../src/app/(customer)/bookings/[bookingId]/escrow';

let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

beforeEach(() => {
  mockParams = { bookingId: 'booking-123' };
});

describe('EscrowScreen (SCR-P3-003)', () => {
  it('renders the escrow opt-in shell', () => {
    render(<EscrowScreen />);

    expect(screen.getByTestId('escrow-screen')).toBeTruthy();
    expect(screen.getByText('Эскроу төлбөр')).toBeTruthy();
    expect(screen.getByText('Эскроу ашиглах')).toBeTruthy();
  });

  it('renders the escrowed confirmation state', () => {
    mockParams = { bookingId: 'booking-123', state: 'escrowed' };
    render(<EscrowScreen />);

    expect(screen.getByText('Төлбөр баталгаажлаа')).toBeTruthy();
  });
});
