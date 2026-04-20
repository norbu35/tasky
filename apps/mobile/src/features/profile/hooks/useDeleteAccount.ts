import { useMutation } from '@tanstack/react-query';

import { deleteMyAccount } from '../api';
import { useAuthStore } from '../../../store/authStore';

export function useDeleteAccount() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const signOut = useAuthStore((s) => s.signOut);

  return useMutation({
    mutationFn: () => deleteMyAccount(token!),
    onSuccess: () => {
      signOut();
    },
  });
}
