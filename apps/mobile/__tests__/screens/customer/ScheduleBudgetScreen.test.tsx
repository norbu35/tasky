import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';

import ScheduleBudgetScreen from '../../../src/app/(customer)/tasks/new/schedule';

const mockPush = jest.fn();
const mockBack = jest.fn();

const mockDraftStoreState: any = {
  'test-draft-id': {
    draftId: 'test-draft-id',
    categoryId: 'cat-123',
    description: 'Fix my sink',
    photos: [],
    location: { lat: 47.92123, lng: 106.91876, text: 'Behind State Dept Store' },
    currentStep: 3,
  },
};

const mockUpdateDraft = jest.fn();
jest.mock('../../../src/features/tasks/draft', () => ({
  useTaskDraftStore: (selector: any) =>
    selector({ drafts: mockDraftStoreState, updateDraft: mockUpdateDraft }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ draftId: 'test-draft-id' }),
}));

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../test-utils/mockI18n');
  return createReactI18nextMock('en');
});

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockDateTimePicker = ({ mode, testID, ...props }: any) => (
    <View testID={testID ?? `schedule-${mode}-picker`} {...props} />
  );
  MockDateTimePicker.displayName = 'MockDateTimePicker';

  return MockDateTimePicker;
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

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
});

function getFutureDate(days = 1): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(10, 0, 0, 0);
  return date;
}

function getFutureTimeFrom(base: Date): Date {
  const time = new Date(base);
  time.setHours(11, 30, 0, 0);
  return time;
}

function pickDateAndTime(date: Date, time: Date) {
  fireEvent.press(screen.getByTestId('schedule-date-input'));
  fireEvent(screen.getByTestId('schedule-date-picker'), 'onChange', { type: 'set' }, date);
  fireEvent.press(screen.getByTestId('schedule-picker-confirm'));

  fireEvent.press(screen.getByTestId('schedule-time-input'));
  fireEvent(screen.getByTestId('schedule-time-picker'), 'onChange', { type: 'set' }, time);
  fireEvent.press(screen.getByTestId('schedule-picker-confirm'));
}

describe('ScheduleBudgetScreen (SCR-CUST-006)', () => {
  it('has a testID on the screen container', () => {
    render(<ScheduleBudgetScreen />);
    expect(screen.getByTestId('SCR-CUST-006')).toBeTruthy();
  });

  it('renders date field', () => {
    render(<ScheduleBudgetScreen />);
    expect(screen.getByText('Schedule & Budget')).toBeTruthy();
    expect(screen.getByTestId('schedule-date-input')).toBeTruthy();
  });

  it('renders time field', () => {
    render(<ScheduleBudgetScreen />);
    expect(screen.getByTestId('schedule-time-input')).toBeTruthy();
  });

  it('renders budget field', () => {
    render(<ScheduleBudgetScreen />);
    expect(screen.getByTestId('schedule-budget-input')).toBeTruthy();
  });

  it('renders both Phase 1 pricing modes', () => {
    render(<ScheduleBudgetScreen />);
    expect(screen.getByText('I have a budget')).toBeTruthy();
    expect(screen.getByText('I want quotes')).toBeTruthy();
  });

  it('renders budget label', () => {
    render(<ScheduleBudgetScreen />);
    expect(screen.getByText('Budget')).toBeTruthy();
  });

  it('shows budget validation when amount is below minimum', () => {
    render(<ScheduleBudgetScreen />);
    const date = getFutureDate(1);
    const time = getFutureTimeFrom(date);
    pickDateAndTime(date, time);

    fireEvent.changeText(screen.getByTestId('schedule-budget-input'), '1000');
    expect(screen.getByText('Budget must be at least ₮20,000')).toBeTruthy();
    expect(screen.getByTestId('SCR-CUST-006-next')).toBeDisabled();
  });

  it('shows schedule validation when a past date is selected', () => {
    render(<ScheduleBudgetScreen />);
    const now = new Date();
    const pastDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0, 0, 0);
    const pastTime = new Date(pastDate);
    pickDateAndTime(pastDate, pastTime);

    fireEvent.changeText(screen.getByTestId('schedule-budget-input'), '50000');
    expect(screen.getByText('Cannot select a past date/time')).toBeTruthy();
    expect(screen.getByTestId('SCR-CUST-006-next')).toBeDisabled();
  });

  it('keeps next disabled until schedule and budget are valid', () => {
    render(<ScheduleBudgetScreen />);
    const nextButton = screen.getByTestId('SCR-CUST-006-next');
    expect(nextButton).toBeDisabled();

    const date = getFutureDate(1);
    const time = getFutureTimeFrom(date);
    pickDateAndTime(date, time);

    fireEvent.changeText(screen.getByTestId('schedule-budget-input'), '50000');

    expect(nextButton).not.toBeDisabled();
  });

  it('navigates to review when valid', () => {
    render(<ScheduleBudgetScreen />);
    const date = getFutureDate(1);
    const time = getFutureTimeFrom(date);
    const expectedScheduledAt = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      0,
      0,
    ).toISOString();
    pickDateAndTime(date, time);

    fireEvent.changeText(screen.getByTestId('schedule-budget-input'), '50000');
    fireEvent.press(screen.getByTestId('SCR-CUST-006-next'));
    expect(mockUpdateDraft).toHaveBeenCalledWith(
      'test-draft-id',
      expect.objectContaining({
        scheduledAt: expectedScheduledAt,
        budget: 50000,
        currentStep: 4,
      }),
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(customer)/tasks/new/review',
      params: { draftId: 'test-draft-id' },
    });
  });

  it('SCN-TASK-027: accepts quote mode without a posted budget', () => {
    render(<ScheduleBudgetScreen />);
    const date = getFutureDate(1);
    const time = getFutureTimeFrom(date);
    const expectedScheduledAt = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      0,
      0,
    ).toISOString();
    pickDateAndTime(date, time);

    fireEvent.press(screen.getByTestId('pricing-mode-quote'));

    expect(screen.queryByTestId('schedule-budget-input')).toBeNull();
    expect(
      screen.getByText('Taskers will send a structured price quote with their application.'),
    ).toBeTruthy();
    expect(screen.getByTestId('SCR-CUST-006-next')).not.toBeDisabled();

    fireEvent.press(screen.getByTestId('SCR-CUST-006-next'));

    expect(mockUpdateDraft).toHaveBeenCalledWith(
      'test-draft-id',
      expect.objectContaining({
        scheduledAt: expectedScheduledAt,
        pricingMode: 'QUOTE',
        budget: null,
        currentStep: 4,
      }),
    );
  });

  it('keeps iOS picker visible while scrolling until user confirms', () => {
    render(<ScheduleBudgetScreen />);
    const date = getFutureDate(1);

    fireEvent.press(screen.getByTestId('schedule-date-input'));
    fireEvent(screen.getByTestId('schedule-date-picker'), 'onChange', { type: 'set' }, date);

    expect(screen.getByTestId('schedule-ios-picker-card')).toBeTruthy();
    expect(screen.getByTestId('schedule-picker-confirm')).toBeTruthy();

    fireEvent.press(screen.getByTestId('schedule-picker-confirm'));

    expect(screen.queryByTestId('schedule-ios-picker-card')).toBeNull();
  });

  it('renders as step 5 of 7 wizard', () => {
    render(<ScheduleBudgetScreen />);
    expect(screen.getByLabelText('Step 5 of 7')).toBeTruthy();
  });

  it('back button returns to location pin', () => {
    render(<ScheduleBudgetScreen />);
    fireEvent.press(screen.getByTestId('SCR-CUST-006-back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('renders continue CTA copy from the wizard spec', () => {
    render(<ScheduleBudgetScreen />);
    expect(screen.getByText('Continue')).toBeTruthy();
  });
});
