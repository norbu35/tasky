import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

import { getMyProfile, updateMyProfile } from '../api';

export function useMyProfile() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useQuery({
    queryKey: queryKeys.me.all(token!),
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
    onSuccess: (updatedProfile) => {
      if (token) {
        queryClient.setQueryData(queryKeys.me.all(token), updatedProfile);
      }
    },
  });
}

/** Returns the current user's ID from the React Query cache. */
export function useMyUserId(): string | undefined {
  const { data } = useMyProfile();
  return data?.id;
}

/** Returns current user's status fields for guards and UI checks. */
export function useCurrentUserStatus() {
  const { data: profile, isLoading } = useMyProfile();
  return {
    status: profile?.status,
    isBanned: profile?.status === 'BANNED',
    isSuspended: profile?.status === 'SUSPENDED',
    isVerified: profile?.status === 'VERIFIED',
    isLoading,
  };
}

export function useSignOut() {
  const signOut = useAuthStore((s) => s.signOut);
  return () => signOut();
}
