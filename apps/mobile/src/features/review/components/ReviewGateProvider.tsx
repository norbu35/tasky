import React, { createContext, useContext, useMemo } from 'react';

import type { PendingReview } from '@/lib/api/types';
import { usePendingReviews } from '../hooks/usePendingReviews';

interface ReviewGateContextValue {
  isLocked: boolean;
  hasPending: boolean;
  oldestPending: PendingReview | null;
}

const ReviewGateContext = createContext<ReviewGateContextValue>({
  isLocked: false,
  hasPending: false,
  oldestPending: null,
});

export function ReviewGateProvider({ children }: { children: React.ReactNode }) {
  const { data: pendingReviews = [] } = usePendingReviews();

  const value = useMemo(() => {
    if (pendingReviews.length === 0) {
      return { isLocked: false, hasPending: false, oldestPending: null };
    }

    // Sort by triggered_at to find the oldest
    const sorted = [...pendingReviews].sort(
      (a, b) => new Date(a.triggered_at).getTime() - new Date(b.triggered_at).getTime(),
    );
    const oldestPending = sorted[0];

    // Locked if oldest pending is older than 72 hours
    const isLocked =
      Date.now() - new Date(oldestPending.triggered_at).getTime() > 72 * 60 * 60 * 1000;

    return { isLocked, hasPending: true, oldestPending };
  }, [pendingReviews]);

  return <ReviewGateContext.Provider value={value}>{children}</ReviewGateContext.Provider>;
}

export function useReviewGate() {
  return useContext(ReviewGateContext);
}
