import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { ReviewGateProvider, useReviewGate } from '@/features/review/components/ReviewGateProvider';
import { usePendingReviews } from '@/features/review/hooks/usePendingReviews';

jest.mock('@/features/review/hooks/usePendingReviews', () => ({
  usePendingReviews: jest.fn(),
}));

const mockUsePendingReviews = usePendingReviews as jest.MockedFunction<typeof usePendingReviews>;

function GateStateProbe() {
  const { isLocked, hasPending, oldestPending } = useReviewGate();
  return (
    <>
      <Text testID="is-locked">{String(isLocked)}</Text>
      <Text testID="has-pending">{String(hasPending)}</Text>
      <Text testID="oldest-booking">{oldestPending?.booking_id ?? 'none'}</Text>
    </>
  );
}

describe('ReviewGateProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('locks posting immediately when any pending review exists', () => {
    mockUsePendingReviews.mockReturnValue({
      data: [
        {
          id: 'case-1',
          booking_id: 'booking-1',
          user_id: 'customer-1',
          status: 'PENDING',
          triggered_at: new Date().toISOString(),
        },
      ],
    } as unknown as ReturnType<typeof usePendingReviews>);

    render(
      <ReviewGateProvider>
        <GateStateProbe />
      </ReviewGateProvider>,
    );

    expect(screen.getByTestId('has-pending')).toHaveTextContent('true');
    expect(screen.getByTestId('is-locked')).toHaveTextContent('true');
    expect(screen.getByTestId('oldest-booking')).toHaveTextContent('booking-1');
  });
});
