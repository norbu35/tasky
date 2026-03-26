import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import WalletPayoutScreen from '../../../../src/app/(tasker)/wallet/payout';

let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

beforeEach(() => {
  mockParams = {};
});

describe('WalletPayoutScreen (SCR-P3-002)', () => {
  it('renders the payout request form shell', () => {
    render(<WalletPayoutScreen />);

    expect(screen.getByTestId('wallet-payout-screen')).toBeTruthy();
    expect(screen.getByText('Мөнгө татах')).toBeTruthy();
    expect(screen.getByPlaceholderText('₮0')).toBeTruthy();
  });

  it('renders the submitted success shell state', () => {
    mockParams = { state: 'submitted' };
    render(<WalletPayoutScreen />);

    expect(screen.getByText('Хүсэлт амжилттай илгээгдлээ')).toBeTruthy();
  });

  it('shows below-minimum validation', () => {
    render(<WalletPayoutScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('₮0'), '5000');
    fireEvent.press(screen.getByTestId('wallet-payout-submit'));
    expect(screen.getByText('Хамгийн бага дүн: ₮10,000')).toBeTruthy();
  });
});
