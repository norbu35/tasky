import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { TaskerJobDetailSections } from '../../../../src/features/bookings/screens/TaskerJobDetail.Sections';
import type { Booking } from '../../../../src/lib/api/types';
import { resetTestI18n, setTestLanguage } from '../../../test-utils/mockI18n';

jest.mock('react-i18next', () => {
  const { createReactI18nextMock } = require('../../../test-utils/mockI18n');
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

const booking: Booking = {
  id: 'booking-1',
  task_id: 'task-1',
  tasker_id: 'tasker-1',
  customer_id: 'customer-1',
  price: 75000,
  status: 'ASSIGNED',
  confirmed_scheduled_at: '2026-04-28T06:30:00Z',
  created_at: '2026-04-26T01:00:00Z',
  customer: {
    id: 'customer-1',
    phone_masked: '+97699****01',
    role: 'CUSTOMER',
    status: 'VERIFIED',
    full_name: 'John Customer',
    avatar_url: null,
    rating_avg: 4.7,
    completed_tasks: 12,
    is_pro: false,
    created_at: '2026-01-01T00:00:00Z',
  },
  task: {
    id: 'task-1',
    category_id: 'cat-cleaning',
    category: {
      id: 'cat-cleaning',
      name: 'Cleaning',
      name_mn: 'Цэвэрлэгээ',
      icon_url: '',
      is_active: true,
      sort_order: 1,
      intake_enabled: false,
      assisted_distribution_enabled: false,
      intake_schema_version: 0,
    },
    customer_id: 'customer-1',
    description: 'Deep clean a 3-bedroom apartment',
    budget: 60000,
    location_lat: 47.91,
    location_lng: 106.91,
    location_text: 'Bayangol district, apartment 12',
    status: 'ASSIGNED',
    scheduled_at: '2026-04-28T06:30:00Z',
    intake_schema_version: 0,
    photos: [],
    created_at: '2026-04-24T01:00:00Z',
    updated_at: '2026-04-24T01:00:00Z',
  },
};

beforeEach(() => {
  resetTestI18n();
  setTestLanguage('mn');
});

describe('TaskerJobDetailSections', () => {
  it('renders customer, task, schedule, budget, and direct-settlement sections', () => {
    render(<TaskerJobDetailSections booking={booking} showExactAddress />);

    expect(screen.getByText('Захиалагч')).toBeTruthy();
    expect(screen.getByText('John Customer')).toBeTruthy();
    expect(screen.getByText('Зурвас болон захиалгын түүх Tasky дотор хадгалагдана.')).toBeTruthy();
    expect(screen.getAllByText('Даалгаврын тайлбар').length).toBeGreaterThan(0);
    expect(screen.getByText('Deep clean a 3-bedroom apartment')).toBeTruthy();
    expect(screen.getByText('Хуваарь')).toBeTruthy();
    expect(screen.getByText('Төсөв')).toBeTruthy();
    expect(screen.getByText('₮75,000')).toBeTruthy();
    expect(screen.getByTestId('booking-detail-tasker-payment-note')).toBeTruthy();
    expect(screen.getByText('Tasky-р урьдчилгаа эсвэл нэмэлт төлбөр авахгүй.')).toBeTruthy();
  });

  it('hides the exact address until the confirmed booking should reveal it', () => {
    render(<TaskerJobDetailSections booking={booking} showExactAddress={false} />);

    expect(screen.queryByTestId('booking-detail-tasker-address-section')).toBeNull();
    expect(screen.queryByText('Bayangol district, apartment 12')).toBeNull();
  });

  it('shows the exact address and its privacy note when reveal is allowed', () => {
    render(<TaskerJobDetailSections booking={booking} showExactAddress />);

    expect(screen.getByTestId('booking-detail-tasker-address-section')).toBeTruthy();
    expect(screen.getByText('Тодорхой хаяг')).toBeTruthy();
    expect(screen.getByText('Bayangol district, apartment 12')).toBeTruthy();
    expect(screen.getByText('Энэ хаяг зөвхөн танд харагдана')).toBeTruthy();
  });
});
