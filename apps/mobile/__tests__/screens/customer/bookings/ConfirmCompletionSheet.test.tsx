import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import { ConfirmCompletionSheet } from '../../../../src/features/bookings/components/ConfirmCompletionSheet';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fb?: string) => fb || key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@gorhom/bottom-sheet', () => {
  const { View } = require('react-native');
  const MockBottomSheet = ({ children, ...props }: any) => <View {...props}>{children}</View>;
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

const mockCompleteBooking = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useCompleteBooking', () => ({
  useCompleteBooking: () => ({
    mutateAsync: mockCompleteBooking,
    isPending: false,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ConfirmCompletionSheet (SCR-CUST-018)', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    bookingId: 'b-1',
  };

  it('has a testID on the container', () => {
    render(<ConfirmCompletionSheet {...defaultProps} />);
    expect(screen.getByTestId('confirm-completion-sheet')).toBeTruthy();
  });

  it('shows "Confirm the work is complete?" prompt', () => {
    render(<ConfirmCompletionSheet {...defaultProps} />);
    expect(screen.getByText('Confirm the work is complete?')).toBeTruthy();
  });

  it('shows description text', () => {
    render(<ConfirmCompletionSheet {...defaultProps} />);
    expect(
      screen.getByText(
        'After confirming, you can leave a review. Payment is settled directly with the Tasker.',
      ),
    ).toBeTruthy();
  });

  it('Yes/Confirm calls completeBooking', async () => {
    mockCompleteBooking.mockResolvedValue({ id: 'b-1', status: 'COMPLETED' });
    render(<ConfirmCompletionSheet {...defaultProps} />);
    fireEvent.press(screen.getByText('Confirm Complete'));
    await waitFor(() => {
      expect(mockCompleteBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: 'b-1',
          idempotencyKey: expect.any(String),
        }),
      );
    });
  });

  it('successful completion routes to the shared review screen', async () => {
    mockCompleteBooking.mockResolvedValue({ id: 'b-1', status: 'COMPLETED' });
    render(<ConfirmCompletionSheet {...defaultProps} />);

    fireEvent.press(screen.getByText('Confirm Complete'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/(shared)/review/[bookingId]',
        params: { bookingId: 'b-1', role: 'customer' },
      });
    });
  });

  it('Go Back button closes the sheet', () => {
    const onClose = jest.fn();
    render(<ConfirmCompletionSheet {...defaultProps} onClose={onClose} />);
    fireEvent.press(screen.getByText('Go Back'));
    expect(onClose).toHaveBeenCalled();
  });
});
