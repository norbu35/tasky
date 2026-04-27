import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ScheduleFields } from '../../../../../src/features/bookings/screens/BookingReschedule/ScheduleFields';
import { resetTestI18n, setTestLanguage } from '../../../../test-utils/mockI18n';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../../test-utils/mockI18n');
  return createReactI18nextMock('mn');
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

const selectedDate = new Date(2026, 3, 28, 10, 0, 0, 0);
const selectedTime = new Date(2026, 3, 28, 14, 30, 0, 0);

function renderFields(overrides: Partial<React.ComponentProps<typeof ScheduleFields>> = {}) {
  const props: React.ComponentProps<typeof ScheduleFields> = {
    selectedDate,
    selectedTime,
    activePicker: null,
    onOpenPicker: jest.fn(),
    onPickerModeChange: jest.fn(),
    onPickerDateChange: jest.fn(),
    onPickerTimeChange: jest.fn(),
    onPickerReset: jest.fn(),
    onPickerCancel: jest.fn(),
    onPickerConfirm: jest.fn(),
    ...overrides,
  };

  render(<ScheduleFields {...props} />);
  return props;
}

beforeEach(() => {
  resetTestI18n();
  setTestLanguage('mn');
});

describe('ScheduleFields', () => {
  it('renders the selected proposed schedule using the reschedule display format', () => {
    renderFields();

    expect(screen.getAllByText('Шинэ хуваарь')).toHaveLength(2);
    expect(screen.getByText('2026.04.28')).toBeTruthy();
    expect(screen.getByText('14:30')).toBeTruthy();
    expect(screen.queryByTestId('schedule-picker-sheet')).toBeNull();
  });

  it('opens the correct picker mode from each schedule field', () => {
    const props = renderFields();

    fireEvent.press(screen.getByTestId('reschedule-date-input'));
    fireEvent.press(screen.getByTestId('reschedule-time-input'));

    expect(props.onOpenPicker).toHaveBeenNthCalledWith(1, 'date');
    expect(props.onOpenPicker).toHaveBeenNthCalledWith(2, 'time');
  });

  it('renders the shared schedule picker with the active draft and forwards picker actions', () => {
    const draftDate = new Date(2026, 3, 29, 10, 0, 0, 0);
    const draftTime = new Date(2026, 3, 29, 15, 30, 0, 0);
    const props = renderFields({
      activePicker: { mode: 'time', draftDate, draftTime },
    });

    expect(screen.getByTestId('schedule-picker-sheet')).toBeTruthy();
    expect(screen.getByTestId('schedule-time-grid')).toBeTruthy();

    fireEvent.press(screen.getByTestId('schedule-picker-date-tab'));
    fireEvent.press(screen.getByTestId('schedule-time-option-1'));
    fireEvent.press(screen.getByTestId('schedule-picker-reset'));
    fireEvent.press(screen.getByTestId('schedule-picker-close'));
    fireEvent.press(screen.getByTestId('schedule-picker-save'));

    expect(props.onPickerModeChange).toHaveBeenCalledWith('date');
    expect(props.onPickerTimeChange).toHaveBeenCalledWith(expect.any(Date));
    expect(props.onPickerReset).toHaveBeenCalledTimes(1);
    expect(props.onPickerCancel).toHaveBeenCalledTimes(1);
    expect(props.onPickerConfirm).toHaveBeenCalledTimes(1);
  });
});
