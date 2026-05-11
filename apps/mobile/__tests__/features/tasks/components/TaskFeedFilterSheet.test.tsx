import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { TaskFeedFilterSheet } from '@/features/tasks/components/TaskFeedFilterSheet';

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
      get: (_, name) => (props: React.ComponentProps<typeof Text>) => (
        <Text testID={`icon-${String(name)}`} {...props} />
      ),
    },
  );
});

const categories = [
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'moving', label: 'Moving' },
];

function renderSheet(overrides: Partial<React.ComponentProps<typeof TaskFeedFilterSheet>> = {}) {
  const props: React.ComponentProps<typeof TaskFeedFilterSheet> = {
    visible: true,
    resultCount: 7,
    categories,
    activeFilters: ['cleaning'],
    onToggleFilter: jest.fn(),
    scheduleWindow: 'any',
    onScheduleWindowChange: jest.fn(),
    pricingMode: 'any',
    onPricingModeChange: jest.fn(),
    minBudget: null,
    maxBudget: null,
    onBudgetChange: jest.fn(),
    onClearFilters: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
  return { ...render(<TaskFeedFilterSheet {...props} />), props };
}

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
});

describe('TaskFeedFilterSheet', () => {
  it('renders header, sections, result count, and footer actions', () => {
    renderSheet();

    expect(screen.getByTestId('task-feed-filter-sheet')).toBeTruthy();
    expect(screen.getByText('Filter tasks')).toBeTruthy();
    expect(screen.getByText('7 tasks available')).toBeTruthy();
    expect(screen.getByText('Schedule')).toBeTruthy();
    expect(screen.getByText('Pricing')).toBeTruthy();
    expect(screen.getByText('Category')).toBeTruthy();
    expect(screen.getByText('Show 7 results')).toBeTruthy();
    expect(screen.getByText('Clear filters')).toBeTruthy();
    expect(screen.getByTestId('task-feed-filter-sheet-options-option-cleaning')).toBeTruthy();
    expect(
      screen.getByTestId('task-feed-filter-sheet-options-option-cleaning').props.accessibilityState
        ?.selected,
    ).toBe(true);
  });

  it('invokes filter handlers from category, schedule, pricing, close, clear, and show buttons', () => {
    const { props } = renderSheet({
      onToggleFilter: jest.fn(),
      onScheduleWindowChange: jest.fn(),
      onPricingModeChange: jest.fn(),
      onClearFilters: jest.fn(),
      onClose: jest.fn(),
    });

    fireEvent.press(screen.getByTestId('task-feed-filter-sheet-options-option-moving'));
    fireEvent.press(screen.getByTestId('task-feed-filter-sheet-schedule-today'));
    fireEvent.press(screen.getByTestId('task-feed-filter-sheet-pricing-BUDGET'));
    fireEvent.press(screen.getByTestId('task-feed-filter-sheet-clear'));
    fireEvent.press(screen.getByTestId('task-feed-filter-sheet-show-results'));
    fireEvent.press(screen.getByTestId('task-feed-filter-sheet-close'));

    expect(props.onToggleFilter).toHaveBeenCalledWith('moving');
    expect(props.onScheduleWindowChange).toHaveBeenCalledWith('today');
    expect(props.onPricingModeChange).toHaveBeenCalledWith('BUDGET');
    expect(props.onClearFilters).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(2);
  });

  it('hides the budget input row when pricing mode is QUOTE-only', () => {
    renderSheet({ pricingMode: 'QUOTE' });

    expect(screen.queryByTestId('task-feed-filter-sheet-budget-min')).toBeNull();
    expect(screen.queryByTestId('task-feed-filter-sheet-budget-max')).toBeNull();
  });

  it('reports parsed numeric budget bounds when typed into the budget inputs', () => {
    const onBudgetChange = jest.fn();
    renderSheet({ onBudgetChange, minBudget: null, maxBudget: null });

    fireEvent.changeText(screen.getByTestId('task-feed-filter-sheet-budget-min'), '50000');
    fireEvent.changeText(screen.getByTestId('task-feed-filter-sheet-budget-max'), '₮200,000');

    expect(onBudgetChange).toHaveBeenCalledWith({ min: 50000, max: null });
    expect(onBudgetChange).toHaveBeenCalledWith({ min: null, max: 200000 });
  });
});
