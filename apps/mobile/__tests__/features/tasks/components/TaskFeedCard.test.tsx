import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Image } from 'react-native';

import { TaskFeedCard } from '@/features/tasks/components/TaskFeedCard';
import type { TaskFeedItem } from '@/lib/api/types';

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

function makeTask(overrides: Partial<TaskFeedItem> = {}): TaskFeedItem {
  return {
    id: 'task-1',
    category: {
      id: 'cat-cleaning',
      name: 'Cleaning',
      name_mn: 'Цэвэрлэгээ',
      icon_url: null,
    },
    description: 'Deep clean a two-bedroom apartment',
    budget: 75000,
    pricing_mode: 'BUDGET',
    approximate_location: 'Bayangol district',
    approximate_lat: 47.91,
    approximate_lng: 106.91,
    status: 'OPEN',
    scheduled_at: '2026-03-25T10:00:00Z',
    created_at: '2026-03-23T00:00:00Z',
    ...overrides,
  } as TaskFeedItem;
}

describe('TaskFeedCard', () => {
  it('renders fixed-budget task feed details without exposing application counts', () => {
    render(<TaskFeedCard task={makeTask()} onPress={jest.fn()} testID="task-feed-card" />);

    expect(screen.getByTestId('task-feed-card')).toBeTruthy();
    expect(screen.getByText('Cleaning')).toBeTruthy();
    expect(screen.getByText('Fixed budget')).toBeTruthy();
    expect(screen.getByLabelText('75,000 tugrik')).toBeTruthy();
    expect(screen.getByText('Deep clean a two-bedroom apartment')).toBeTruthy();
    expect(screen.getByText(/Bayangol district/)).toBeTruthy();
    expect(
      screen.getByText('Apply with a structured response. Exact address comes after confirmation.'),
    ).toBeTruthy();
    expect(screen.queryByText('Ari Customer')).toBeNull();
    expect(screen.queryByText(/2 applications/i)).toBeNull();
  });

  it('uses compact operational card anatomy instead of external hero imagery', () => {
    const result = render(
      <TaskFeedCard task={makeTask()} onPress={jest.fn()} testID="task-feed-card" />,
    );

    expect(result.UNSAFE_queryAllByType(Image)).toHaveLength(0);
    expect(screen.getByTestId('task-feed-card-category-mark')).toBeTruthy();
  });

  it('renders quote-mode pricing when budget is missing', () => {
    render(
      <TaskFeedCard
        task={makeTask({
          budget: null,
          pricing_mode: 'QUOTE',
          category: {
            id: 'cat-moving',
            name: 'Moving &amp; Hauling',
            name_mn: 'Нүүлгэлт',
            icon_url: null,
          },
        })}
        onPress={jest.fn()}
        testID="task-feed-card"
      />,
    );

    expect(screen.getByText('Moving & Hauling')).toBeTruthy();
    expect(screen.getByText('Quote requested')).toBeTruthy();
    expect(screen.queryByLabelText(/tugrik/i)).toBeNull();
  });

  it('uses the localized category name when Mongolian is active', () => {
    setTestLanguage('mn');

    render(<TaskFeedCard task={makeTask()} onPress={jest.fn()} testID="task-feed-card" />);

    expect(screen.getByText('Цэвэрлэгээ')).toBeTruthy();
    expect(screen.queryByText('Cleaning')).toBeNull();
  });

  it('calls onPress when the card is pressed', () => {
    const onPress = jest.fn();
    render(<TaskFeedCard task={makeTask()} onPress={onPress} testID="task-feed-card" />);

    fireEvent.press(screen.getByTestId('task-feed-card'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
