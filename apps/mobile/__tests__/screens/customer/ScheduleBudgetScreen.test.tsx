import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../test-utils/mockI18n';

import ScheduleBudgetScreen from '../../../src/app/(customer)/tasks/new/schedule';
import {
  createScheduleDateOptions,
  createScheduleTimeOptions,
} from '../../../src/features/tasks/screens/TaskSchedule.model';

const mockPush = jest.fn();
const mockBack = jest.fn();

const baseDraft = {
  draftId: 'test-draft-id',
  categoryId: 'cat-123',
  description: 'Fix my sink',
  photos: [],
  location: { lat: 47.92123, lng: 106.91876, text: 'Behind State Dept Store' },
  currentStep: 3,
};
const mockDraftStoreState: any = {};

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
  Object.keys(mockDraftStoreState).forEach((key) => {
    delete mockDraftStoreState[key];
  });
  mockDraftStoreState['test-draft-id'] = { ...baseDraft };
  resetTestI18n();
  setTestLanguage('en');
});

function getPickedDateAndTime(): { date: Date; time: Date } {
  const date = createScheduleDateOptions()[0];
  const time = createScheduleTimeOptions(date)[7];
  return { date, time };
}

function pickDateAndTime() {
  fireEvent.press(screen.getByTestId('schedule-date-input'));
  fireEvent.press(screen.getByTestId('schedule-day-option-0'));
  fireEvent.press(screen.getByTestId('schedule-picker-time-tab'));
  fireEvent.press(screen.getByTestId('schedule-time-option-7'));
  fireEvent.press(screen.getByTestId('schedule-picker-save'));
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
    pickDateAndTime();

    fireEvent.changeText(screen.getByTestId('schedule-budget-input'), '1000');
    expect(screen.getByText('Budget must be at least ₮20,000')).toBeTruthy();
    expect(screen.getByTestId('SCR-CUST-006-next')).toBeDisabled();
  });

  it('shows schedule validation when a past date is selected', () => {
    const now = new Date();
    const pastDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0, 0, 0);
    mockDraftStoreState['test-draft-id'] = {
      ...baseDraft,
      scheduledAt: pastDate.toISOString(),
    };
    render(<ScheduleBudgetScreen />);

    fireEvent.press(screen.getByTestId('schedule-date-input'));

    fireEvent.changeText(screen.getByTestId('schedule-budget-input'), '50000');
    expect(screen.getByText('Cannot select a past date/time')).toBeTruthy();
    expect(screen.getByTestId('SCR-CUST-006-next')).toBeDisabled();
  });

  it('keeps next disabled until schedule and budget are valid', () => {
    render(<ScheduleBudgetScreen />);
    const nextButton = screen.getByTestId('SCR-CUST-006-next');
    expect(nextButton).toBeDisabled();

    pickDateAndTime();

    fireEvent.changeText(screen.getByTestId('schedule-budget-input'), '50000');

    expect(nextButton).not.toBeDisabled();
  });

  it('navigates to review when valid', () => {
    render(<ScheduleBudgetScreen />);
    const { date, time } = getPickedDateAndTime();
    const expectedScheduledAt = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      0,
      0,
    ).toISOString();
    pickDateAndTime();

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
    const { date, time } = getPickedDateAndTime();
    const expectedScheduledAt = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      0,
      0,
    ).toISOString();
    pickDateAndTime();

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

  it('selects a schedule through the Tasky calendar sheet picker', () => {
    render(<ScheduleBudgetScreen />);

    fireEvent.press(screen.getByTestId('schedule-date-input'));

    expect(screen.getByTestId('schedule-picker-sheet')).toBeTruthy();
    expect(screen.getByTestId('schedule-calendar-grid')).toBeTruthy();
    expect(screen.getByTestId('schedule-picker-date-tab')).toBeTruthy();
    expect(screen.getByTestId('schedule-picker-time-tab')).toBeTruthy();
    expect(screen.getByTestId('schedule-picker-reset')).toBeTruthy();
    expect(screen.getByTestId('schedule-picker-save')).toBeTruthy();
    expect(screen.queryByTestId('schedule-picker-confirm')).toBeNull();
    expect(screen.queryByTestId('schedule-picker-cancel')).toBeNull();

    fireEvent.press(screen.getByTestId('schedule-day-option-0'));
    fireEvent.press(screen.getByTestId('schedule-picker-time-tab'));
    fireEvent.press(screen.getByTestId('schedule-time-option-7'));
    fireEvent.press(screen.getByTestId('schedule-picker-save'));

    expect(screen.queryByTestId('schedule-picker-sheet')).toBeNull();
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
