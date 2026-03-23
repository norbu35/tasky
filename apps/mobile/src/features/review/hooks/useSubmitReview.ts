import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';

const api = createMobileApiClient();

const RATING_KEY_MAP: Record<string, string> = {
  qualityOfWork: 'quality_rating',
  punctuality: 'punctuality_rating',
  communication: 'communication_rating',
  taskDescriptionClarity: 'clarity_rating',
  respectfulness: 'respectfulness_rating',
};

interface ReviewFormInput {
  bookingId: string;
  ratings: Record<string, number>;
  comment?: string;
}

export function useSubmitReview() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReviewFormInput) => {
      const payload: Record<string, number | string | null> = {};
      for (const [key, value] of Object.entries(input.ratings)) {
        const mappedKey = RATING_KEY_MAP[key];
        if (mappedKey) {
          payload[mappedKey] = value;
        }
      }
      if (input.comment !== undefined) {
        payload['comment'] = input.comment;
      }
      return api.submitReview(
        token!,
        input.bookingId,
        payload as Parameters<typeof api.submitReview>[2],
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['booking'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['taskerProfile'] });
    },
  });
}
