import { useMutation } from '@tanstack/react-query';

import { createMobileApiClient } from '../../../lib/mobileApiClient';
import { useAuthStore } from '../../../store/authStore';

const api = createMobileApiClient();

export function useDeleteAccount() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const signOut = useAuthStore((s) => s.signOut);

  return useMutation({
    mutationFn: () => api.deleteMyAccount(token!),
    onSuccess: () => {
      signOut();
    },
  });
}
