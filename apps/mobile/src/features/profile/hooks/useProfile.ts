import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getMyProfile, updateMyProfile } from '../api';
import type { Profile } from '../../../lib/mobileApiClient';
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
  const setProfile = useAuthStore((s) => s.setProfile);

  return useMutation({
    mutationFn: (payload: { full_name?: string; avatar_url?: string; bio?: string }) =>
      updateMyProfile(token!, payload),
    onSuccess: (updatedProfile) => {
      setProfile(updatedProfile);
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useProfileSync() {
  const queryClient = useQueryClient();
  const setProfile = useAuthStore((s) => s.setProfile);

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query.queryKey[0] === 'me') {
        const data = event.query.state.data;
        if (data) setProfile(data as Profile);
      }
    });
    return unsubscribe;
  }, [queryClient, setProfile]);
}

export function useSignOut() {
  const signOut = useAuthStore((s) => s.signOut);
  return () => signOut();
}
