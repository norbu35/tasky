import { useMutation, useQuery } from '@tanstack/react-query';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

export function useVerificationStatus() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['verificationStatus', token],
    queryFn: () => api.getVerificationStatus(token!),
    enabled: !!token,
  });
}

export function useVerification() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  const mutation = useMutation({
    mutationFn: async (payload: {
      id_card_front_key: string;
      id_card_back_key: string;
      selfie_key: string;
    }) => {
      return api.submitVerification(token!, payload);
    },
  });

  return {
    submitVerification: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    submitError: mutation.error,
  };
}
