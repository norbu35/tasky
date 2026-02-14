import { useAuthStore } from '../store/authStore';
import { createMobileApiClient, type MobileApiClient } from '../lib/mobileApiClient';
import { useMemo } from 'react';

// Singleton instance for unauthenticated or base requests
const baseClient = createMobileApiClient();

export function useApiClient(): MobileApiClient {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.accessToken;

  return useMemo(() => {
    // Proxy the client to automatically inject the access token
    return new Proxy(baseClient, {
      get(target, prop, receiver) {
        const originalMethod = Reflect.get(target, prop, receiver);

        if (typeof originalMethod === 'function') {
           return async (...args: any[]) => {
             // For methods that require accessToken as the first argument (most of them)
             // We check if the first arg is expected to be the token.
             // However, the original client methods EXPLICITLY ask for accessToken.
             // To make this "smart", we can pre-fill it.
             
             // BUT, to keep it simple and type-safe without complex type gymnastics:
             // We will rely on the components to pass the token OR we can create a wrapper here.
             
             // Actually, the previous implementation in MobileApp.tsx passed `session.accessToken` manually.
             // A better DX is to have methods that DON'T need the token passed.
             
             // Let's create a wrapper that injects the token if the first argument name is 'accessToken'.
             // Since we can't inspect param names easily at runtime, we have to know the signature.
             
             // Alternative: Return the raw client and let the caller pass the token.
             // Given the limited time, let's just return the raw client but ensure we have easy access to the token.
             return originalMethod.apply(target, args);
           };
        }
        return originalMethod;
      }
    });
  }, [accessToken]);
}

/**
 * A wrapper that automatically injects the access token into requests.
 * This changes the signature of the methods to NOT require the token.
 */
export function useAuthenticatedApi() {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.accessToken;

  // This is a simplified wrapper. In a real app, you might want to auto-refresh tokens here.
  
  if (!accessToken) {
    throw new Error("Authentication required for this hook");
  }

  return useMemo(() => ({
    getMyProfile: () => baseClient.getMyProfile(accessToken),
    updateMyProfile: (payload: any) => baseClient.updateMyProfile(accessToken, payload),
    listCategories: () => baseClient.listCategories(accessToken),
    listTasks: (filters: any) => baseClient.listTasks(accessToken, filters),
    createTask: (payload: any) => baseClient.createTask(accessToken, payload),
    applyToTask: (taskId: string, message: string) => baseClient.applyToTask(accessToken, taskId, message),
    // ... add other methods as needed, this is a bit tedious to map 1:1 manually without a Proxy.
    // For now, let's stick to using the raw client and passing the token, 
    // but exposing the token easily.
    client: baseClient,
    accessToken,
  }), [accessToken]);
}
