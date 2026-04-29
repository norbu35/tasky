import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import {
  TaskFeedStickyHeader,
  TaskFeedSubHeader,
} from '@/features/tasks/components/TaskFeedHeader';

import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

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

beforeEach(() => {
  resetTestI18n();
  setTestLanguage('en');
  jest.clearAllMocks();
});

describe('TaskFeedStickyHeader', () => {
  it('renders search and opens the filter sheet', () => {
    const props = {
      categories: [
        { id: 'all', label: 'All' },
        { id: 'cleaning', label: 'Cleaning' },
      ],
      activeFilters: [],
      activeFilterCount: 0,
      searchQuery: '',
      onOpenFilters: jest.fn(),
      onSearchChange: jest.fn(),
      onToggleFilter: jest.fn(),
    };

    render(<TaskFeedStickyHeader {...props} />);

    fireEvent.press(screen.getByTestId('task-feed-open-filters'));
    fireEvent.changeText(screen.getByTestId('task-feed-search'), 'paint');

    expect(props.onOpenFilters).toHaveBeenCalledTimes(1);
    expect(props.onSearchChange).toHaveBeenCalledWith('paint');
    expect(screen.queryByTestId('task-feed-filter-count')).toBeNull();
  });
});

describe('TaskFeedSubHeader', () => {
  it('renders active filters and clears them', () => {
    const props = {
      resultCount: 3,
      hasActiveBrowseFilters: true,
      selectedFilterItems: [{ id: 'cleaning', label: 'Cleaning' }],
      trimmedSearchQuery: 'home',
      onClearFilters: jest.fn(),
      onClearSearch: jest.fn(),
      onToggleFilter: jest.fn(),
    };

    render(<TaskFeedSubHeader {...props} />);

    expect(screen.getByTestId('task-feed-active-filters')).toBeTruthy();

    fireEvent.press(screen.getByTestId('task-feed-active-filter-clear'));
    fireEvent.press(screen.getByTestId('task-feed-active-filter-search'));
    fireEvent.press(screen.getByTestId('task-feed-active-filter-cleaning'));

    expect(props.onClearFilters).toHaveBeenCalledTimes(1);
    expect(props.onClearSearch).toHaveBeenCalledTimes(1);
    expect(props.onToggleFilter).toHaveBeenCalledWith('cleaning');
  });
});
