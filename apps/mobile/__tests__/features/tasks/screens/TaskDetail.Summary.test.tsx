import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';
import type { PublicTask } from '@/lib/api/types';

import { TaskDetailSummary } from '@/features/tasks/screens/TaskDetail.Summary';

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

const baseTask: PublicTask = {
  id: 'task-123',
  category: {
    id: 'cat-cleaning',
    name: 'Cleaning',
    name_mn: 'Цэвэрлэгээ',
    icon_url: 'https://example.test/icon.png',
    is_active: true,
    sort_order: 1,
    intake_enabled: false,
    assisted_distribution_enabled: false,
    intake_schema_version: 0,
  },
  customer: {
    id: 'customer-1',
    full_name: 'John Customer',
    avatar_url: null,
    rating_avg: 4.5,
  },
  description: 'Deep clean a 3-bedroom apartment',
  budget: 75000,
  pricing_mode: 'BUDGET',
  approximate_location: 'Bayangol district',
  approximate_lat: 47.91,
  approximate_lng: 106.91,
  status: 'OPEN',
  scheduled_at: '2026-03-25T10:00:00Z',
  photo_urls: ['https://example.test/task-photo.jpg'],
  application_count: 3,
  created_at: '2026-03-23T00:00:00Z',
};

beforeEach(() => {
  resetTestI18n();
  setTestLanguage('en');
});

describe('TaskDetailSummary', () => {
  it('renders fixed-budget task details with the posted budget', () => {
    render(<TaskDetailSummary task={baseTask} isQuoteMode={false} />);

    expect(screen.getByText('John Customer')).toBeTruthy();
    expect(screen.getByText('Deep clean a 3-bedroom apartment')).toBeTruthy();
    expect(screen.getByText('Cleaning')).toBeTruthy();
    expect(screen.getByText('₮75,000')).toBeTruthy();
    expect(screen.getByText('Bayangol district')).toBeTruthy();
  });

  it('renders quote-mode task details without a posted budget amount', () => {
    render(
      <TaskDetailSummary
        task={{
          ...baseTask,
          budget: null,
          pricing_mode: 'QUOTE',
        }}
        isQuoteMode
      />,
    );

    expect(screen.getByText('Quote requested')).toBeTruthy();
    expect(screen.queryByText('₮75,000')).toBeNull();
  });
});
