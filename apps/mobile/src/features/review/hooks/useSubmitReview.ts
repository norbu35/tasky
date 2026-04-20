import { useMutation, useQueryClient } from '@tanstack/react-query';

import { submitReview } from '../api';
import { useAuthStore } from '../../../store/authStore';

interface SubmitReviewPayload {
  bookingId: string;
  ratings: Record<string, number>;
  comment?: string | null;
}

export function useSubmitReview(onSuccessCb?: () => void) {
  const session = useAuthStore((state) => state.session);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitReviewPayload) => {
      if (!session?.accessToken) throw new Error('Unauthorized');
      const { bookingId, ratings, comment } = payload;
      return submitReview(session.accessToken, bookingId, {
        quality_rating: ratings['qualityOfWork'],
        punctuality_rating: ratings['punctuality'],
        communication_rating: ratings['communication'],
        clarity_rating: ratings['taskDescriptionClarity'],
        respectfulness_rating: ratings['respectfulness'],
        comment,
      });
    },
    onSuccess: () => {
      if (onSuccessCb) onSuccessCb();
      // Invalidate pending reviews to clear the gate
      queryClient.invalidateQueries({ queryKey: ['pendingReviews'] });
      // Invalidate the specific booking to show updated review state
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
  });
}
