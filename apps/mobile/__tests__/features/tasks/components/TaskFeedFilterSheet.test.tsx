import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

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
      get: (_, name) => (props: any) => <Text testID={`icon-${String(name)}`} {...props} />,
    },
  );
});

const categories = [
  { id: 'all', label: 'All' },
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'moving', label: 'Moving' },
];

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
});

describe('TaskFeedFilterSheet', () => {
  it('renders result summary, category options, and sheet actions while visible', () => {
    render(
      <TaskFeedFilterSheet
        visible
        categories={categories}
        activeFilters={['cleaning']}
        resultCount={7}
        onToggleFilter={jest.fn()}
        onClearFilters={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId('task-feed-filter-sheet')).toBeTruthy();
    expect(screen.getByText('Filter tasks')).toBeTruthy();
    expect(screen.getByText('7 tasks available')).toBeTruthy();
    expect(
      screen.getByText('Choose categories and search terms before returning to the feed.'),
    ).toBeTruthy();
    expect(screen.getByText('Category')).toBeTruthy();
    expect(screen.getByText('Show 7 results')).toBeTruthy();
    expect(screen.getByText('Clear filters')).toBeTruthy();
    expect(screen.getByTestId('task-feed-filter-sheet-options-option-cleaning')).toBeTruthy();
    expect(
      screen.getByTestId('task-feed-filter-sheet-options-option-cleaning').props.accessibilityState
        ?.selected,
    ).toBe(true);
  });

  it('calls filter and action handlers from sheet controls', () => {
    const onToggleFilter = jest.fn();
    const onClearFilters = jest.fn();
    const onClose = jest.fn();

    render(
      <TaskFeedFilterSheet
        visible
        categories={categories}
        activeFilters={[]}
        resultCount={3}
        onToggleFilter={onToggleFilter}
        onClearFilters={onClearFilters}
        onClose={onClose}
      />,
    );

    fireEvent.press(screen.getByTestId('task-feed-filter-sheet-options-option-moving'));
    fireEvent.press(screen.getByText('Clear filters'));
    fireEvent.press(screen.getByTestId('task-feed-filter-sheet-show-results'));
    fireEvent.press(screen.getByTestId('task-feed-filter-sheet-close'));

    expect(onToggleFilter).toHaveBeenCalledWith('moving');
    expect(onClearFilters).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
