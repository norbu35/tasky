import { useMutation } from '@tanstack/react-query';

import { getProfilePolishPreview } from '../api';
import type { ProfilePolishPreviewPayload } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';

export function useProfilePolishPreview() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;

  return useMutation({
    mutationFn: (payload: ProfilePolishPreviewPayload) => getProfilePolishPreview(token!, payload),
  });
}
