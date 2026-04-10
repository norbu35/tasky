import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import { TaskCancelSheet } from '../../../src/features/tasks/components/TaskCancelSheet';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockBottomSheet = React.forwardRef(function MockBottomSheet(props: any, ref: any) {
    React.useImperativeHandle(ref, () => ({
      snapToIndex: jest.fn(),
      close: jest.fn(),
    }));
    return <View {...props} />;
  });
  return {
    __esModule: true,
    default: MockBottomSheet,
    BottomSheetView: View,
    BottomSheetModal: View,
    BottomSheetModalProvider: View,
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

const mockCancelMutateAsync = jest.fn();
jest.mock('../../../src/features/bookings/hooks/useCancelBooking', () => ({
  useCancelBooking: () => ({
    mutateAsync: mockCancelMutateAsync,
    isPending: false,
  }),
}));

const mockReplace = jest.fn();

beforeEach(() => {
  const { resetTestI18n, setTestLanguage } = require('../../test-utils/mockI18n');
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
});

describe('TaskCancelSheet (SCR-CUST-010)', () => {
  it('has a testID on the container', () => {
    render(<TaskCancelSheet isOpen={true} onClose={jest.fn()} taskId="task-1" taskStatus="OPEN" />);
    expect(screen.getByTestId('task-cancel-sheet')).toBeTruthy();
  });

  it('shows cancel confirmation for open task', () => {
    render(<TaskCancelSheet isOpen={true} onClose={jest.fn()} taskId="task-1" taskStatus="OPEN" />);
    expect(screen.getByText('Cancel this task?')).toBeTruthy();
    expect(screen.getByText('Cancelling this task has no penalty')).toBeTruthy();
  });

  it('shows different copy for assigned task (free cancel)', () => {
    render(
      <TaskCancelSheet
        isOpen={true}
        onClose={jest.fn()}
        taskId="task-1"
        taskStatus="ASSIGNED"
        bookingId="booking-1"
        isLateCancellation={false}
      />,
    );
    expect(screen.getByText('Cancel this booking?')).toBeTruthy();
  });

  it('shows late cancellation warning for assigned task within 4 hours', () => {
    render(
      <TaskCancelSheet
        isOpen={true}
        onClose={jest.fn()}
        taskId="task-1"
        taskStatus="ASSIGNED"
        bookingId="booking-1"
        isLateCancellation={true}
      />,
    );
    expect(screen.getByText('Late Cancellation')).toBeTruthy();
    expect(screen.getByText(/reliability incident/)).toBeTruthy();
  });

  it('shows confirm and go back buttons', () => {
    render(<TaskCancelSheet isOpen={true} onClose={jest.fn()} taskId="task-1" taskStatus="OPEN" />);
    expect(screen.getByText('Yes, Cancel')).toBeTruthy();
    expect(screen.getByText('Go Back')).toBeTruthy();
  });

  it('go back button calls onClose', () => {
    const onClose = jest.fn();
    render(<TaskCancelSheet isOpen={true} onClose={onClose} taskId="task-1" taskStatus="OPEN" />);
    fireEvent.press(screen.getByText('Go Back'));
    expect(onClose).toHaveBeenCalled();
  });

  it('confirm cancel calls onClose for open task', async () => {
    const onClose = jest.fn();
    render(<TaskCancelSheet isOpen={true} onClose={onClose} taskId="task-1" taskStatus="OPEN" />);
    fireEvent.press(screen.getByText('Yes, Cancel'));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('confirm cancel calls cancel API for assigned booking', async () => {
    mockCancelMutateAsync.mockResolvedValue({});
    const onClose = jest.fn();
    render(
      <TaskCancelSheet
        isOpen={true}
        onClose={onClose}
        taskId="task-1"
        taskStatus="ASSIGNED"
        bookingId="booking-1"
      />,
    );
    fireEvent.press(screen.getByText('Yes, Cancel'));
    await waitFor(() => {
      expect(mockCancelMutateAsync).toHaveBeenCalled();
    });
  });
});
