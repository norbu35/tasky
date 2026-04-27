import {
  canShowPublicRating,
  formatPublicRating,
  getReviewThresholdRemaining,
  MIN_PUBLIC_REVIEW_COUNT,
} from '@/features/profile/model';

describe('profile model', () => {
  it('keeps the public review threshold explicit', () => {
    expect(MIN_PUBLIC_REVIEW_COUNT).toBe(3);
  });

  it.each([
    { reviewCount: 3, rating: 4.6, expected: true },
    { reviewCount: 2, rating: 4.6, expected: false },
    { reviewCount: 3, rating: 0, expected: false },
    { reviewCount: null, rating: 4.6, expected: false },
    { reviewCount: 3, rating: null, expected: false },
  ])(
    'returns $expected for reviewCount=$reviewCount rating=$rating',
    ({ reviewCount, rating, expected }) => {
      expect(canShowPublicRating(reviewCount, rating)).toBe(expected);
    },
  );

  it.each([
    { rating: 4.64, expected: '4.6' },
    { rating: 4.65, expected: '4.7' },
    { rating: null, expected: '0.0' },
    { rating: undefined, expected: '0.0' },
  ])('formats public rating $rating as $expected', ({ rating, expected }) => {
    expect(formatPublicRating(rating)).toBe(expected);
  });

  it.each([
    { reviewCount: undefined, expected: 3 },
    { reviewCount: 1, expected: 2 },
    { reviewCount: 3, expected: 0 },
    { reviewCount: 8, expected: 0 },
  ])('returns $expected remaining reviews for count $reviewCount', ({ reviewCount, expected }) => {
    expect(getReviewThresholdRemaining(reviewCount)).toBe(expected);
  });
});
