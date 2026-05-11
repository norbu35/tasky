import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';

import mnTranslation from '../../../../src/locales/mn/translation.json';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

const translation = mnTranslation as Record<string, unknown>;
const t = (key: string) =>
  key.split('.').reduce<unknown>((node, segment) => {
    if (!node || typeof node !== 'object') {
      return undefined;
    }
    return (node as Record<string, unknown>)[segment];
  }, translation) as string;

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

let mockIsPending = false;
const mockCancelBooking = jest.fn();
jest.mock('../../../../src/features/bookings/hooks/useCancelBooking', () => ({
  useCancelBooking: () => ({
    mutate: mockCancelBooking,
    mutateAsync: mockCancelBooking,
    get isPending() {
      return mockIsPending;
    },
  }),
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef(function MockBottomSheet({ children, index }: any, ref: any) {
      React.useImperativeHandle(ref, () => ({
        snapToIndex: jest.fn(),
        close: jest.fn(),
      }));
      if (index === -1) return null;
      return <View>{children}</View>;
    }),
    BottomSheetBackdrop: ({ children }: any) => <View>{children}</View>,
    BottomSheetView: ({ children }: any) => <View>{children}</View>,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('mn');
  mockIsPending = false;
});

describe('TaskerCancelSheet (SCR-TASK-015)', () => {
  it('shows strike warning text', () => {
    const {
      TaskerCancelSheet,
    } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
    render(
      <TaskerCancelSheet
        isOpen={true}
        onClose={jest.fn()}
        bookingId="booking-123"
        strikeCount={0}
      />,
    );

    expect(screen.getByText(t('tasker.jobs.cancel.heading'))).toBeTruthy();
    expect(screen.getByText(t('tasker.jobs.cancel.description'))).toBeTruthy();
    expect(screen.getByText(t('tasker.jobs.cancel.reasonLabel'))).toBeTruthy();
  });

  it('confirm button calls cancelBooking', () => {
    const {
      TaskerCancelSheet,
    } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
    render(
      <TaskerCancelSheet
        isOpen={true}
        onClose={jest.fn()}
        bookingId="booking-123"
        strikeCount={0}
      />,
    );

    fireEvent.press(screen.getByText(t('tasker.jobs.cancel.reasonScheduleConflict')));
    fireEvent.press(screen.getByText(t('tasker.jobs.cancel.confirmButton')));
    expect(mockCancelBooking).toHaveBeenCalled();
  });

  it('shows loading state when confirming', () => {
    mockIsPending = true;

    const {
      TaskerCancelSheet,
    } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
    render(
      <TaskerCancelSheet
        isOpen={true}
        onClose={jest.fn()}
        bookingId="booking-123"
        strikeCount={0}
      />,
    );

    expect(screen.getByTestId('cancel-sheet-loading')).toBeTruthy();
  });

  it('go back button calls onClose', () => {
    const onClose = jest.fn();
    const {
      TaskerCancelSheet,
    } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
    render(
      <TaskerCancelSheet isOpen={true} onClose={onClose} bookingId="booking-123" strikeCount={0} />,
    );

    fireEvent.press(screen.getByText(t('tasker.jobs.cancel.backButton')));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows suspension warning at 2 strikes', () => {
    const {
      TaskerCancelSheet,
    } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
    render(
      <TaskerCancelSheet
        isOpen={true}
        onClose={jest.fn()}
        bookingId="booking-123"
        strikeCount={2}
      />,
    );

    expect(screen.getByText(t('TaskerCancelSheet.copy2'))).toBeTruthy();
  });

  it('requires a reason before enabling confirm', () => {
    const onClose = jest.fn();
    const {
      TaskerCancelSheet,
    } = require('../../../../src/features/bookings/components/TaskerCancelSheet');
    render(
      <TaskerCancelSheet isOpen={true} onClose={onClose} bookingId="booking-123" strikeCount={0} />,
    );

    fireEvent.press(screen.getByText(t('tasker.jobs.cancel.confirmButton')));
    expect(mockCancelBooking).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText(t('tasker.jobs.cancel.reasonScheduleConflict')));
    fireEvent.press(screen.getByText(t('tasker.jobs.cancel.confirmButton')));
    expect(mockCancelBooking).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: 'booking-123' }),
    );
  });
});
