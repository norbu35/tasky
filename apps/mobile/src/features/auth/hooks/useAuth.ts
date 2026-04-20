import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { requestOtp, verifyOtp, devLogin } from '../api';
import { getMyProfile } from '../../profile/api';
import { useAppStore } from '../../../store/appStore';
import { useAuthStore } from '../../../store/authStore';
import { resolvePostAuthHref } from '../../../utils/authRouting';

export const DEV_LOGIN_CUSTOMER_PHONE = '+97692000001';
export const DEV_LOGIN_TASKER_PHONE = '+97693000001';

export function useRequestOtp() {
  return useMutation({
    mutationFn: async (phone: string) => {
      return requestOtp(phone);
    },
  });
}

export function useVerifyOtp() {
  const setSession = useAuthStore((state) => state.setSession);
  const setProfile = useAuthStore((state) => state.setProfile);

  return useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      return await verifyOtp(phone, code);
    },
    onSuccess: async (session) => {
      setSession(session);
      // Fetch profile immediately
      try {
        const profile = await getMyProfile(session.accessToken);
        setProfile(profile);
      } catch (e) {
        console.error('Failed to fetch profile after login', e);
        // Still navigate, profile might be fetched later or retry.
      }

      router.replace(resolvePostAuthHref(session, useAppStore.getState().hasSeenOnboarding));
    },
  });
}

export function useDevLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setRole = useAppStore((state) => state.setRole);

  return useMutation({
    mutationFn: async ({ phone, role }: { phone: string; role: 'CUSTOMER' | 'TASKER' }) => {
      return await devLogin(phone, role);
    },
    onSuccess: async (session, variables) => {
      setSession(session);
      setRole(variables.role.toLowerCase() as 'customer' | 'tasker');
      try {
        const profile = await getMyProfile(session.accessToken);
        setProfile(profile);
      } catch (e) {
        console.error('Failed to fetch profile after dev login', e);
      }

      router.replace(resolvePostAuthHref(session, useAppStore.getState().hasSeenOnboarding));
    },
  });
}
