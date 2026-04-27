import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { getMyProfile } from '@/features/profile';
import { listMyTasks } from '@/features/tasks';
import type { AuthTokens } from '@/lib/api/types';
import { queryKeys } from '@/lib/queryKeys';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { resolvePostAuthHref } from '@/utils/authRouting';

import { requestOtp, verifyOtp, devLogin } from '../api';

export const DEV_LOGIN_CUSTOMER_PHONE = '+97692000001';
export const DEV_LOGIN_TASKER_PHONE = '+97693000001';

function prefetchPostAuthHome(queryClient: QueryClient, session: AuthTokens): void {
  if (session.user.role !== 'CUSTOMER') return;

  void queryClient.prefetchQuery({
    queryKey: queryKeys.tasks.my(session.accessToken),
    queryFn: () => listMyTasks(session.accessToken),
  });
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: async (phone: string) => {
      return requestOtp(phone);
    },
  });
}

export function useVerifyOtp() {
  const setSession = useAuthStore((state) => state.setSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      return await verifyOtp(phone, code);
    },
    onSuccess: async (session) => {
      setSession(session);
      prefetchPostAuthHome(queryClient, session);
      try {
        const profile = await getMyProfile(session.accessToken);
        queryClient.setQueryData(queryKeys.me.all(session.accessToken), profile);
      } catch (e) {
        console.error('Failed to fetch profile after login', e);
      }

      router.replace(resolvePostAuthHref(session, useAppStore.getState().hasSeenOnboarding));
    },
  });
}

export function useDevLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  const setRole = useAppStore((state) => state.setRole);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phone, role }: { phone: string; role: 'CUSTOMER' | 'TASKER' }) => {
      return await devLogin(phone, role);
    },
    onSuccess: async (session, variables) => {
      setSession(session);
      setRole(variables.role.toLowerCase() as 'customer' | 'tasker');
      prefetchPostAuthHome(queryClient, session);
      try {
        const profile = await getMyProfile(session.accessToken);
        queryClient.setQueryData(queryKeys.me.all(session.accessToken), profile);
      } catch (e) {
        console.error('Failed to fetch profile after dev login', e);
      }

      router.replace(resolvePostAuthHref(session, useAppStore.getState().hasSeenOnboarding));
    },
  });
}
