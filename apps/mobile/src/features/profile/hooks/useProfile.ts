import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getMyProfile, updateMyProfile } from '../api';
import { useAuthStore } from '../../../store/authStore';

export function useMyProfile() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['me', token],
    queryFn: () => getMyProfile(token!),
    enabled: !!token,
  });
}

export function useUpdateProfile() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { full_name?: string; avatar_url?: string; bio?: string }) =>
      updateMyProfile(token!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useSignOut() {
  const signOut = useAuthStore((s) => s.signOut);
  return () => signOut();
}
