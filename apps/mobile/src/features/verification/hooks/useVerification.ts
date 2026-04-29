import { useMutation, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { getVerificationStatus, submitVerification } from '../api';

export function useVerificationStatus() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const uid = session?.user.id;

  return useQuery({
    queryKey: queryKeys.verification.status(uid!),
    queryFn: () => getVerificationStatus(token!),
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
      return submitVerification(token!, payload);
    },
  });

  return {
    submitVerification: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    submitError: mutation.error,
  };
}
