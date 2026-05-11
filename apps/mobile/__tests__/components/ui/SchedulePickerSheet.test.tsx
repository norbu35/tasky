import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { SchedulePickerSheet } from '../../../src/components/ui/SchedulePickerSheet';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
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

const baseDate = new Date(2026, 3, 28, 10, 0, 0, 0);
const dateOptions = [0, 1, 2].map((offset) => {
  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() + offset);
  return date;
});
const timeOptions = [9, 10, 11].map((hour) => new Date(2026, 3, 28, hour, 30, 0, 0));

function renderSheet(overrides: Partial<React.ComponentProps<typeof SchedulePickerSheet>> = {}) {
  const props: React.ComponentProps<typeof SchedulePickerSheet> = {
    mode: 'date',
    draftDate: dateOptions[1],
    draftTime: timeOptions[1],
    dateOptions,
    timeOptions,
    onModeChange: jest.fn(),
    onDateChange: jest.fn(),
    onTimeChange: jest.fn(),
    onReset: jest.fn(),
    onClose: jest.fn(),
    onSave: jest.fn(),
    ...overrides,
  };

  render(<SchedulePickerSheet {...props} />);
  return props;
}

beforeEach(() => {
  resetTestI18n();
  setTestLanguage('en');
});

describe('SchedulePickerSheet', () => {
  it('renders translated schedule controls and marks the selected date', () => {
    renderSheet();

    expect(screen.getByTestId('schedule-picker-sheet')).toBeTruthy();
    expect(screen.getByText('Choose schedule')).toBeTruthy();
    expect(screen.getByText('Date')).toBeTruthy();
    expect(screen.getByText('Time')).toBeTruthy();
    expect(screen.getByTestId('schedule-calendar-grid')).toBeTruthy();
    expect(screen.getByTestId('schedule-day-option-1').props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('calls date, reset, close, and save handlers from stable test targets', () => {
    const props = renderSheet();

    fireEvent.press(screen.getByTestId('schedule-day-option-2'));
    fireEvent.press(screen.getByTestId('schedule-picker-reset'));
    fireEvent.press(screen.getByTestId('schedule-picker-close'));
    fireEvent.press(screen.getByTestId('schedule-picker-save'));

    expect(props.onDateChange).toHaveBeenCalledWith(dateOptions[2]);
    expect(props.onReset).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSave).toHaveBeenCalledTimes(1);
  });

  it('switches modes and marks the selected time option', () => {
    const props = renderSheet({ mode: 'time' });

    expect(screen.getByTestId('schedule-time-grid')).toBeTruthy();
    expect(screen.getByText('10:30')).toBeTruthy();
    expect(screen.getByTestId('schedule-time-option-1').props.accessibilityState).toEqual({
      selected: true,
    });

    fireEvent.press(screen.getByTestId('schedule-picker-date-tab'));
    fireEvent.press(screen.getByTestId('schedule-time-option-2'));

    expect(props.onModeChange).toHaveBeenCalledWith('date');
    expect(props.onTimeChange).toHaveBeenCalledWith(timeOptions[2]);
  });
});
