import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { TaskFeedCard } from '@/features/tasks/components/TaskFeedCard';
import type { PublicTask } from '@/lib/api/types';

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

beforeEach(() => {
  jest.clearAllMocks();
  resetTestI18n();
  setTestLanguage('en');
});

function makeTask(overrides: Partial<PublicTask> = {}): PublicTask {
  return {
    id: 'task-1',
    category: {
      id: 'cat-cleaning',
      name: 'Cleaning',
      name_mn: 'Цэвэрлэгээ',
      icon_url: null,
      is_active: true,
      sort_order: 1,
      intake_enabled: true,
      assisted_distribution_enabled: false,
      intake_schema_version: 1,
    },
    customer: {
      id: 'customer-1',
      full_name: 'Ari Customer',
      avatar_url: null,
      rating_avg: 4.5,
    },
    description: 'Deep clean a two-bedroom apartment',
    budget: 75000,
    pricing_mode: 'BUDGET',
    approximate_location: 'Bayangol district',
    approximate_lat: 47.91,
    approximate_lng: 106.91,
    status: 'OPEN',
    scheduled_at: '2026-03-25T10:00:00Z',
    photo_urls: [],
    application_count: 2,
    created_at: '2026-03-23T00:00:00Z',
    ...overrides,
  } as PublicTask;
}

describe('TaskFeedCard', () => {
  it('renders fixed-budget task feed details without exposing application counts', () => {
    render(<TaskFeedCard task={makeTask()} onPress={jest.fn()} testID="task-feed-card" />);

    expect(screen.getByTestId('task-feed-card')).toBeTruthy();
    expect(screen.getByText('Cleaning')).toBeTruthy();
    expect(screen.getByLabelText('75,000 tugrik')).toBeTruthy();
    expect(screen.getByText('Deep clean a two-bedroom apartment')).toBeTruthy();
    expect(screen.getByText('Bayangol district')).toBeTruthy();
    expect(screen.getByText('Ari Customer')).toBeTruthy();
    expect(screen.queryByText(/2 applications/i)).toBeNull();
  });

  it('renders quote-mode pricing when budget is missing', () => {
    render(
      <TaskFeedCard
        task={makeTask({ budget: null, pricing_mode: 'QUOTE' })}
        onPress={jest.fn()}
        testID="task-feed-card"
      />,
    );

    expect(screen.getByText('Quote requested')).toBeTruthy();
    expect(screen.queryByLabelText(/tugrik/i)).toBeNull();
  });

  it('calls onPress when the card is pressed', () => {
    const onPress = jest.fn();
    render(<TaskFeedCard task={makeTask()} onPress={onPress} testID="task-feed-card" />);

    fireEvent.press(screen.getByTestId('task-feed-card'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
