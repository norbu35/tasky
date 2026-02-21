import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { router } from 'expo-router';

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
        mutationFn: async ({phone, code}: { phone: string; code: string }) => {
            return await api.verifyOtp(phone, code);
        },
        onSuccess: async (session) => {
            setSession(session);
            // Fetch profile immediately
            try {
                const profile = await api.getMyProfile(session.accessToken);
                setProfile(profile);
                router.replace('/(tabs)');
            } catch (e) {
                console.error("Failed to fetch profile after login", e);
                // Still navigate, profile might be fetched later or retry
                router.replace('/(tabs)');
            }
        },
    });
}

export function useDevLogin() {
    const setSession = useAuthStore((state) => state.setSession);
    const setProfile = useAuthStore((state) => state.setProfile);

    return useMutation({
        mutationFn: async ({phone, role}: { phone: string; role: string }) => {
            return await api.devLogin(phone, role);
        },
        onSuccess: async (session) => {
            setSession(session);
            try {
                const profile = await api.getMyProfile(session.accessToken);
                setProfile(profile);
                router.replace('/(tabs)');
            } catch (e) {
                console.error("Failed to fetch profile after dev login", e);
                router.replace('/(tabs)');
            }
        },
    });
}
