import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { TaskFeedHeader } from '@/features/tasks/components/TaskFeedHeader';

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

jest.mock('@/features/review/components/ReviewGateBanner', () => {
  const { Text } = require('react-native');
  return {
    ReviewGateBanner: ({ pendingReview }: { pendingReview: { booking_id?: string } }) => (
      <Text testID="review-gate-banner">{pendingReview.booking_id}</Text>
    ),
  };
});

function renderHeader(overrides: Partial<React.ComponentProps<typeof TaskFeedHeader>> = {}) {
  const props: React.ComponentProps<typeof TaskFeedHeader> = {
    activeFilterCount: 0,
    hasActiveBrowseFilters: false,
    hasPending: false,
    oldestPending: null,
    resultCount: 3,
    searchQuery: '',
    selectedFilterItems: [],
    trimmedSearchQuery: '',
    onClearFilters: jest.fn(),
    onClearSearch: jest.fn(),
    onOpenFilters: jest.fn(),
    onSearchChange: jest.fn(),
    onToggleFilter: jest.fn(),
    ...overrides,
  };

  render(<TaskFeedHeader {...props} />);
  return props;
}

beforeEach(() => {
  resetTestI18n();
  setTestLanguage('en');
  jest.clearAllMocks();
});

describe('TaskFeedHeader', () => {
  it('renders search and opens the filter sheet', () => {
    const props = renderHeader();

    fireEvent.press(screen.getByTestId('task-feed-open-filters'));
    fireEvent.changeText(screen.getByTestId('task-feed-search'), 'paint');

    expect(props.onOpenFilters).toHaveBeenCalledTimes(1);
    expect(props.onSearchChange).toHaveBeenCalledWith('paint');
    expect(screen.queryByTestId('task-feed-filter-count')).toBeNull();
  });

  it('renders active filters and clears them', () => {
    const props = renderHeader({
      activeFilterCount: 2,
      hasActiveBrowseFilters: true,
      selectedFilterItems: [{ id: 'cleaning', label: 'Cleaning' }],
      trimmedSearchQuery: 'home',
    });

    expect(screen.getByTestId('task-feed-filter-count')).toBeTruthy();
    expect(screen.getByTestId('task-feed-active-filters')).toBeTruthy();

    fireEvent.press(screen.getByTestId('task-feed-active-filter-clear'));
    fireEvent.press(screen.getByTestId('task-feed-active-filter-search'));
    fireEvent.press(screen.getByTestId('task-feed-active-filter-cleaning'));

    expect(props.onClearFilters).toHaveBeenCalledTimes(1);
    expect(props.onClearSearch).toHaveBeenCalledTimes(1);
    expect(props.onToggleFilter).toHaveBeenCalledWith('cleaning');
  });
});
