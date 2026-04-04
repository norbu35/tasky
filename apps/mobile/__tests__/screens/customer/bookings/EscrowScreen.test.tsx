import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import EscrowScreen from '../../../../src/app/(customer)/bookings/[bookingId]/escrow';

let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: jest.fn(() => mockParams),
}));

beforeEach(() => {
  mockParams = {};
});

describe('EscrowScreen (SCR-P3-003)', () => {
  it('renders the escrow opt-in shell', () => {
    render(<EscrowScreen />);

    expect(screen.getByTestId('escrow-screen')).toBeTruthy();
    expect(screen.getByText('Escrow Payment')).toBeTruthy();
    expect(screen.getByText('Use Escrow')).toBeTruthy();
  });

  it('renders the escrowed confirmation state', () => {
    mockParams = { state: 'escrowed' };
    render(<EscrowScreen />);

    expect(screen.getByText('Payment confirmed')).toBeTruthy();
  });
});
