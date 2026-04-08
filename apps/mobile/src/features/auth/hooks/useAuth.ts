import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { useAppStore } from '../../../store/appStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { router } from 'expo-router';
import { resolvePostAuthHref } from '../../../utils/authRouting';

const api = createMobileApiClient();

export function useRequestOtp() {
  return useMutation({
    mutationFn: async (phone: string) => {
      return api.requestOtp(phone);
    },
  });
}

export function useVerifyOtp() {
  const setSession = useAuthStore((state) => state.setSession);
  const setProfile = useAuthStore((state) => state.setProfile);

  return useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      return await api.verifyOtp(phone, code);
    },
    onSuccess: async (session) => {
      setSession(session);
      // Fetch profile immediately
      try {
        const profile = await api.getMyProfile(session.accessToken);
        setProfile(profile);
      } catch (e) {
        console.error('Failed to fetch profile after login', e);
        // Still navigate, profile might be fetched later or retry.
      }
      router.replace(
        resolvePostAuthHref(session, useAppStore.getState().hasSeenOnboarding),
      );
    },
  });
}

export function useDevLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setRole = useAppStore((state) => state.setRole);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phone, role }: { phone: string; role: 'CUSTOMER' | 'TASKER' }) => {
      const runtimeEnv = typeof process !== 'undefined' ? process.env : undefined;
      if (runtimeEnv?.EXPO_PUBLIC_DEV_AUTH_ENABLED === 'true') {
        return {
          accessToken: 'dev-access-token',
          refreshToken: 'dev-refresh-token',
          user: {
            id: role === 'CUSTOMER' ? 'dev-customer-00000000' : 'dev-tasker-00000000',
            phone,
            primary_auth: 'PHONE_OTP' as const,
            role,
            status: 'VERIFIED' as const,
            created_at: new Date().toISOString(),
          },
        };
      }
      return await api.devLogin(phone, role);
    },
    onSuccess: async (session, variables) => {
      setSession(session);
      setRole(variables.role.toLowerCase() as 'customer' | 'tasker');
      const runtimeEnv = typeof process !== 'undefined' ? process.env : undefined;
      if (runtimeEnv?.EXPO_PUBLIC_DEV_AUTH_ENABLED === 'true') {
        const fakeProfile = {
          id: session.user.id,
          phone_masked: variables.phone.replace(/(\+976\d{2})\d{4}(\d{2})/, '$1****$2'),
          role: variables.role,
          status: 'VERIFIED' as const,
          full_name: variables.role === 'CUSTOMER' ? 'Dev Customer' : 'Dev Tasker',
          avatar_url: null,
          rating_avg: 4.5,
          completed_tasks: 3,
          is_pro: false,
          created_at: new Date().toISOString(),
        };
        setProfile(fakeProfile);
        queryClient.setQueryData(['me'], fakeProfile);
        // Seed empty task/feed lists so API-dependent screens render empty state (not error)
        const emptyPage = { data: [], cursor: { next: null, has_more: false } };
        queryClient.setQueryData(['myTasks'], emptyPage);
        queryClient.setQueryData(['tasks'], emptyPage);
        queryClient.setQueryData(['bookings'], emptyPage);
        // Seed fake categories so the task-creation category screen renders the grid
        const fakeCategories = {
          data: [
            {
              id: 'dev-cat-001',
              name: 'Cleaning',
              name_mn: 'Цэвэрлэгээ',
              icon_url: '',
              is_active: true,
              sort_order: 1,
              intake_enabled: false,
              intake_schema_version: 0,
            },
            {
              id: 'dev-cat-002',
              name: 'Delivery',
              name_mn: 'Хүргэлт',
              icon_url: '',
              is_active: true,
              sort_order: 2,
              intake_enabled: false,
              intake_schema_version: 0,
            },
          ],
          cursor: { next: null, has_more: false },
        };
        queryClient.setQueryData(['categories'], fakeCategories);
      } else {
        try {
          const profile = await api.getMyProfile(session.accessToken);
          setProfile(profile);
        } catch (e) {
          console.error('Failed to fetch profile after dev login', e);
        }
      }

      router.replace(
        resolvePostAuthHref(session, useAppStore.getState().hasSeenOnboarding),
      );
    },
  });
}
