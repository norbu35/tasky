import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { BookingSupportSheet } from '../../../../src/features/bookings/components/BookingSupportSheet';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_target, name) => (props: React.ComponentProps<typeof Text>) => (
        <Text testID={`icon-${String(name)}`} {...props} />
      ),
    },
  );
});

beforeEach(() => {
  resetTestI18n();
  setTestLanguage('en');
});

describe('BookingSupportSheet', () => {
  it('does not render when closed', () => {
    render(<BookingSupportSheet isOpen={false} onClose={jest.fn()} onPrimary={jest.fn()} />);

    expect(screen.queryByTestId('booking-support-sheet')).toBeNull();
  });

  it('renders support reasons and keeps the first reason selected by default', () => {
    render(<BookingSupportSheet isOpen onClose={jest.fn()} onPrimary={jest.fn()} />);

    expect(screen.getByText('Report or get help')).toBeTruthy();
    expect(screen.getByText("What's happening?")).toBeTruthy();
    expect(
      screen.getByText('Shared only with Tasky support when review is required.'),
    ).toBeTruthy();
    expect(
      screen.getByTestId('booking-support-reason-reasonArrival').props.accessibilityState,
    ).toEqual({
      selected: true,
    });
    expect(screen.getByText('Schedule change')).toBeTruthy();
    expect(screen.getByText('Safety or conduct concern')).toBeTruthy();
  });

  it('updates the selected reason and forwards close and primary actions', () => {
    const onClose = jest.fn();
    const onPrimary = jest.fn();
    render(<BookingSupportSheet isOpen onClose={onClose} onPrimary={onPrimary} />);

    fireEvent.press(screen.getByTestId('booking-support-reason-reasonSafety'));
    fireEvent.press(screen.getByTestId('booking-support-sheet-close'));
    fireEvent.press(screen.getByTestId('booking-support-sheet-primary'));

    expect(
      screen.getByTestId('booking-support-reason-reasonSafety').props.accessibilityState,
    ).toEqual({
      selected: true,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });
});
