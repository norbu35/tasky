import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

import BookingConfirmScreen from '../../../../src/app/(customer)/bookings/confirm';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockLocalSearchParams: Record<string, string> = {
  taskId: 'task-1',
  applicationId: 'app-1',
  taskerId: 'tasker-1',
  taskTitle: 'Fix my sink',
  taskBudget: '50000',
  taskSchedule: '2026-04-01T10:00:00Z',
  taskerName: 'Bold',
  taskerAvatar: 'https://example.com/avatar.jpg',
  taskerRating: '4.7',
};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => mockLocalSearchParams,
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('en');
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

const mockAcceptApplication = jest.fn();
const mockMutate = jest.fn();
const mockConfirmBookingIntent = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useAcceptApplication', () => ({
  useAcceptApplication: () => ({
    mutateAsync: mockAcceptApplication,
    mutate: mockMutate,
    isPending: false,
  }),
}));
jest.mock('../../../../src/features/bookings/hooks/useConfirmBookingIntent', () => ({
  useConfirmBookingIntent: () => ({
    mutateAsync: mockConfirmBookingIntent,
    isPending: false,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
  mockLocalSearchParams = {
    taskId: 'task-1',
    applicationId: 'app-1',
    taskerId: 'tasker-1',
    taskTitle: 'Fix my sink',
    taskBudget: '50000',
    taskSchedule: '2026-04-01T10:00:00Z',
    taskerName: 'Bold',
    taskerAvatar: 'https://example.com/avatar.jpg',
    taskerRating: '4.7',
  };
});

describe('BookingConfirmScreen (SCR-CUST-014)', () => {
  it('has a testID on the screen container', () => {
    render(<BookingConfirmScreen />);
    expect(screen.getByTestId('SCR-CUST-014')).toBeTruthy();
  });

  it('renders task summary info', () => {
    render(<BookingConfirmScreen />);
    expect(screen.getByText('Fix my sink')).toBeTruthy();
  });

  it('renders tasker info', () => {
    render(<BookingConfirmScreen />);
    expect(screen.getByText('Bold')).toBeTruthy();
  });

  it('renders disclaimer checkbox', () => {
    render(<BookingConfirmScreen />);
    expect(screen.getByTestId('booking-confirm-screen-disclaimer')).toBeTruthy();
  });

  it('CTA is disabled until disclaimer is checked', () => {
    render(<BookingConfirmScreen />);
    const cta = screen.getByTestId('SCR-CUST-014-cta');
    expect(cta).toBeDisabled();
  });

  it('CTA becomes enabled after disclaimer is checked', () => {
    render(<BookingConfirmScreen />);
    fireEvent.press(screen.getByTestId('booking-confirm-screen-disclaimer'));
    const cta = screen.getByTestId('SCR-CUST-014-cta');
    expect(cta).not.toBeDisabled();
  });

  it('confirm calls acceptApplication with idempotency key', async () => {
    mockAcceptApplication.mockResolvedValue({
      id: 'intent-1',
      task_id: 'task-1',
      tasker_id: 'tasker-1',
      customer_id: 'customer-1',
      source: 'APPLICATION_SELECTION',
      status: 'PENDING',
      selected_application_id: 'app-1',
      expires_at: '2026-04-01T14:00:00Z',
      confirmed_booking_id: null,
      confirmed_at: null,
      created_at: '2026-04-01T10:00:00Z',
      updated_at: '2026-04-01T10:00:00Z',
    });
    render(<BookingConfirmScreen />);
    fireEvent.press(screen.getByTestId('booking-confirm-screen-disclaimer'));
    fireEvent.press(screen.getByTestId('SCR-CUST-014-cta'));
    await waitFor(() => {
      expect(mockAcceptApplication).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          applicationId: 'app-1',
          liabilityDisclaimerAccepted: true,
          idempotencyKey: expect.any(String),
        }),
      );
    });
    expect(await screen.findByText('Selection request sent')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/(customer)/bookings/confirmed' }),
    );
  });

  it('renders add-to-calendar option text', () => {
    render(<BookingConfirmScreen />);
    expect(screen.getByText('Add to calendar?')).toBeTruthy();
  });

  it('renders payment note', () => {
    render(<BookingConfirmScreen />);
    expect(screen.getByText('Payment is settled directly with the Tasker')).toBeTruthy();
  });

  it('confirm uses booking intent flow when source is rebook', async () => {
    mockLocalSearchParams = {
      taskId: 'task-1',
      applicationId: '',
      source: 'rebook',
      bookingIntentId: 'intent-1',
      taskerId: 'tasker-1',
      taskTitle: 'Fix my sink',
      taskBudget: '50000',
      taskSchedule: '2026-04-01T10:00:00Z',
      taskerName: 'Bold',
      taskerAvatar: 'https://example.com/avatar.jpg',
      taskerRating: '4.7',
    };
    mockConfirmBookingIntent.mockResolvedValue({ id: 'booking-2' });
    render(<BookingConfirmScreen />);
    fireEvent.press(screen.getByTestId('booking-confirm-screen-disclaimer'));
    fireEvent.press(screen.getByTestId('SCR-CUST-014-cta'));
    await waitFor(() => {
      expect(mockConfirmBookingIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingIntentId: 'intent-1',
          liabilityDisclaimerAccepted: true,
          idempotencyKey: expect.any(String),
        }),
      );
      expect(mockAcceptApplication).not.toHaveBeenCalled();
    });
  });
});
