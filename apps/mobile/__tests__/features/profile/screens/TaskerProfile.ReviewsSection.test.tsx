import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { TaskerProfileReviewsSection } from '@/features/profile/screens/TaskerProfile.ReviewsSection';
import type { Profile, Review } from '@/lib/api/types';

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
  resetTestI18n();
  setTestLanguage('en');
});

function makeReviewer(id: string, fullName: string): Profile {
  return {
    id,
    phone_masked: null,
    role: 'CUSTOMER',
    status: 'VERIFIED',
    full_name: fullName,
    avatar_url: null,
    bio: null,
    rating_avg: 0,
    completed_tasks: 0,
    is_pro: false,
    created_at: '2026-01-01T00:00:00Z',
    last_active_at: null,
  };
}

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'review-1',
    booking_id: 'booking-1',
    reviewer_id: 'customer-1',
    reviewee_id: 'tasker-1',
    quality_rating: 5,
    communication_rating: 5,
    punctuality_rating: 5,
    comment: 'Great work!',
    created_at: '2026-03-01T00:00:00Z',
    reviewer: makeReviewer('customer-1', 'Customer A'),
    ...overrides,
  } as Review;
}

const reviews: Review[] = [
  makeReview(),
  makeReview({
    id: 'review-2',
    quality_rating: 4,
    comment: 'Careful and reliable.',
    reviewer: makeReviewer('customer-2', 'Customer B'),
  }),
  makeReview({
    id: 'review-3',
    quality_rating: 5,
    comment: 'Would book again.',
    reviewer: makeReviewer('customer-3', 'Customer C'),
  }),
];

describe('TaskerProfileReviewsSection', () => {
  it('shows the threshold summary instead of public reputation when ratings are hidden', () => {
    render(
      <TaskerProfileReviewsSection
        publicRatingVisible={false}
        completedTasks={12}
        rating={4.8}
        reviews={reviews.slice(0, 2)}
      />,
    );

    expect(screen.getByText('Reviews')).toBeTruthy();
    expect(screen.getByTestId('tasker-profile-low-review-summary')).toBeTruthy();
    expect(screen.getByText('Not enough reviews yet')).toBeTruthy();
    expect(screen.queryByTestId('tasker-profile-review-summary')).toBeNull();
    expect(screen.queryByText('Great work!')).toBeNull();
  });

  it('renders public reputation metrics and review list once the threshold is met', () => {
    render(
      <TaskerProfileReviewsSection
        publicRatingVisible
        completedTasks={12}
        rating={4.76}
        reviews={reviews}
      />,
    );

    expect(screen.getByTestId('tasker-profile-review-summary')).toBeTruthy();
    expect(screen.getByText('Public reputation')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('3 reviews')).toBeTruthy();
    expect(screen.getAllByText('4.8').length).toBeGreaterThan(0);
    expect(screen.getByText('Great work!')).toBeTruthy();
    expect(screen.getByText('Careful and reliable.')).toBeTruthy();
    expect(screen.getByText('Would book again.')).toBeTruthy();
  });

  it('filters public reviews by five-star reviews', () => {
    render(
      <TaskerProfileReviewsSection
        publicRatingVisible
        completedTasks={12}
        rating={4.76}
        reviews={reviews}
      />,
    );

    fireEvent.press(screen.getByTestId('tasker-profile-review-filter-five-star'));

    expect(screen.getByText('Great work!')).toBeTruthy();
    expect(screen.queryByText('Careful and reliable.')).toBeNull();
    expect(screen.getByText('Would book again.')).toBeTruthy();
    expect(
      screen.getByTestId('tasker-profile-review-filter-five-star').props.accessibilityState
        ?.selected,
    ).toBe(true);
  });

  it('filters public reviews by customer name or review text and shows no-results copy', () => {
    render(
      <TaskerProfileReviewsSection
        publicRatingVisible
        completedTasks={12}
        rating={4.76}
        reviews={reviews}
      />,
    );

    fireEvent.changeText(screen.getByTestId('tasker-profile-review-search'), 'customer b');

    expect(screen.queryByText('Great work!')).toBeNull();
    expect(screen.getByText('Careful and reliable.')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('tasker-profile-review-search'), 'does-not-match');

    expect(screen.getByTestId('tasker-profile-review-no-results')).toBeTruthy();
    expect(screen.getByText('No search results')).toBeTruthy();
    expect(screen.getByText('Try another customer name or review keyword.')).toBeTruthy();
  });
});
